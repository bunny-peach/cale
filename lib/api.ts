import { ApiConfig, Message } from "./types";

export interface StreamCallbacks {
  onThinking?: (delta: string) => void;
  onText?: (delta: string) => void;
  onUsage?: (input: number, output: number) => void;
  signal?: AbortSignal;
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/+$/, "");
}

interface OpenAIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface AnthropicContentPart {
  type: "text" | "image";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
}

/** Text actually sent to the API: quote context + visible text + hidden text. */
function apiText(m: Message): string {
  let t = m.content || "";
  if (m.quote) {
    t = `（引用 ${m.quote.author}：${m.quote.text}）\n${t}`;
  }
  if (m.hiddenText) {
    t = t ? `${t}\n${m.hiddenText}` : m.hiddenText;
  }
  return t;
}

function toOpenAIMessages(system: string, messages: Message[]) {
  const out: {
    role: string;
    content: string | OpenAIContentPart[];
  }[] = [];
  if (system.trim()) out.push({ role: "system", content: system });
  for (const m of messages) {
    const text = apiText(m);
    if (m.images && m.images.length > 0 && m.role === "user") {
      const parts: OpenAIContentPart[] = [];
      if (text) parts.push({ type: "text", text });
      for (const img of m.images) {
        parts.push({ type: "image_url", image_url: { url: img.dataUrl } });
      }
      out.push({ role: m.role, content: parts });
    } else {
      out.push({ role: m.role, content: text });
    }
  }
  return out;
}

function toAnthropicMessages(messages: Message[]) {
  return messages.map((m) => {
    const text = apiText(m);
    if (m.images && m.images.length > 0 && m.role === "user") {
      const parts: AnthropicContentPart[] = [];
      for (const img of m.images) {
        const data = img.dataUrl.split(",")[1] || "";
        parts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data,
          },
        });
      }
      if (text) parts.push({ type: "text", text });
      return { role: m.role, content: parts };
    }
    return { role: m.role, content: text };
  });
}

/** Read an SSE stream line-by-line, invoking cb with each `data:` payload. */
async function readSSE(
  res: Response,
  onEvent: (data: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    if (signal?.aborted) {
      await reader.cancel();
      throw new DOMException("Aborted", "AbortError");
    }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        onEvent(data);
      }
    }
  }
}

async function ensureOk(res: Response) {
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`请求失败 (${res.status}): ${detail.slice(0, 300)}`);
  }
}

async function streamOpenAI(
  config: ApiConfig,
  system: string,
  messages: Message[],
  cb: StreamCallbacks
) {
  const res = await fetch(
    `${normalizeBaseURL(config.baseURL)}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: toOpenAIMessages(system, messages),
        stream: true,
        stream_options: { include_usage: true },
      }),
      signal: cb.signal,
    }
  );
  await ensureOk(res);

  await readSSE(
    res,
    (data) => {
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        if (delta) {
          const reasoning =
            delta.reasoning_content ?? delta.reasoning ?? null;
          if (reasoning) cb.onThinking?.(reasoning);
          if (delta.content) cb.onText?.(delta.content);
        }
        if (json.usage) {
          cb.onUsage?.(
            json.usage.prompt_tokens ?? 0,
            json.usage.completion_tokens ?? 0
          );
        }
      } catch {
        /* skip malformed chunk */
      }
    },
    cb.signal
  );
}

async function streamAnthropic(
  config: ApiConfig,
  system: string,
  messages: Message[],
  cb: StreamCallbacks
) {
  const res = await fetch(`${normalizeBaseURL(config.baseURL)}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 16384,
      system: system,
      messages: toAnthropicMessages(messages),
      stream: true,
    }),
    signal: cb.signal,
  });
  await ensureOk(res);

  let inputTokens = 0;
  let outputTokens = 0;
  const blockTypes: Record<number, string> = {};

  await readSSE(
    res,
    (data) => {
      try {
        const json = JSON.parse(data);
        switch (json.type) {
          case "message_start":
            inputTokens = json.message?.usage?.input_tokens ?? 0;
            break;
          case "content_block_start":
            blockTypes[json.index] = json.content_block?.type ?? "text";
            break;
          case "content_block_delta": {
            const d = json.delta;
            if (d?.type === "thinking_delta") cb.onThinking?.(d.thinking);
            else if (d?.type === "text_delta") cb.onText?.(d.text);
            break;
          }
          case "message_delta":
            if (json.usage?.output_tokens)
              outputTokens = json.usage.output_tokens;
            break;
          case "message_stop":
            cb.onUsage?.(inputTokens, outputTokens);
            break;
        }
      } catch {
        /* skip malformed chunk */
      }
    },
    cb.signal
  );
}

export async function streamChat(
  config: ApiConfig,
  system: string,
  messages: Message[],
  cb: StreamCallbacks
): Promise<void> {
  if (config.format === "anthropic") {
    return streamAnthropic(config, system, messages, cb);
  }
  return streamOpenAI(config, system, messages, cb);
}

/** Lightweight connectivity test used by the settings page. */
export async function testConnection(config: ApiConfig): Promise<string> {
  let received = "";
  await streamChat(
    config,
    "You are a helpful assistant.",
    [{ id: "test", role: "user", content: "你好", createdAt: Date.now() }],
    {
      onText: (t) => {
        received += t;
      },
    }
  );
  return received.trim() || "(连接成功，但未返回文本)";
}

/** Fetch the list of available model ids from the provider. */
export async function fetchModels(config: ApiConfig): Promise<string[]> {
  const base = normalizeBaseURL(config.baseURL);
  const headers: Record<string, string> =
    config.format === "anthropic"
      ? {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        }
      : { Authorization: `Bearer ${config.apiKey}` };

  const res = await fetch(`${base}/v1/models`, { headers });
  await ensureOk(res);
  const json = await res.json();
  // OpenAI: { data: [{ id }] }  ·  Anthropic: { data: [{ id }] }
  const list = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.models)
      ? json.models
      : [];
  const ids: string[] = list
    .map((m: unknown): string =>
      typeof m === "string"
        ? m
        : (m as { id?: string; name?: string })?.id ??
          (m as { id?: string; name?: string })?.name ??
          ""
    )
    .filter((s: string): s is string => Boolean(s));
  return Array.from(new Set(ids)).sort();
}

/**
 * Ask the model to summarize a conversation into memory JSON entries.
 * Returns the raw model text (expected to be a JSON array).
 */
export async function summarizeConversation(
  config: ApiConfig,
  conversation: Message[],
  instruction: string
): Promise<string> {
  let received = "";
  const messages: Message[] = [
    ...conversation,
    {
      id: "summary-req",
      role: "user",
      content: instruction,
      createdAt: Date.now(),
    },
  ];
  await streamChat(
    config,
    "你是一个对话摘要助手，只输出规定格式的 JSON，不要输出多余文字。",
    messages,
    {
      onText: (t) => {
        received += t;
      },
    }
  );
  return received.trim();
}
