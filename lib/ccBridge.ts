import { ApiConfig, Message } from "./types";
import type { StreamCallbacks } from "./api";

/**
 * Claude Code Bridge — routes chat through the local `claude` CLI / Agent SDK so
 * the app can use a Pro/Max subscription instead of a paid proxy API.
 *
 * This needs a server-side process where the `claude` CLI is installed and
 * logged in to the account — it cannot run in the browser or on a static host.
 * The intended wiring is a Next.js route handler at `/api/claude-code` that
 * shells out to `claude -p` (or the Agent SDK) and streams the result back.
 *
 * For now this is a STUB: the UI, config and quota plumbing are in place, but
 * the real call is not connected yet. It POSTs to the route if present and
 * otherwise surfaces a clear "not connected" message in the chat.
 */
export async function streamClaudeCode(
  _config: ApiConfig,
  system: string,
  messages: Message[],
  cb: StreamCallbacks
): Promise<void> {
  let res: Response | null = null;
  try {
    res = await fetch("/api/claude-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        maxTokens: cb.maxTokens,
      }),
      signal: cb.signal,
    });
  } catch {
    res = null;
  }

  if (!res || !res.ok) {
    throw new Error(
      "Claude Code 通道尚未接通。该通道需要在本地运行 App，并已登录 claude CLI（Pro/Max 订阅）。" +
        "当前为插桩版本：线路选择、配置与额度界面已就绪，真实调用待接入 /api/claude-code。"
    );
  }

  // When the route is implemented it should stream SSE; wire it up here.
}
