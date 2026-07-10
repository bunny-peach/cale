# Cale 🌸

移动端优先的 AI 聊天应用，基于中转 API 调用 Claude 模型。支持添加到 iOS 主屏幕作为 PWA 全屏运行。

Cale 是 Quinn 的专属 AI 伙伴 —— 除了聊天，她还能记住你、感知你的经期和心情、和你一起攒愿望清单、推荐歌和书。

## 技术栈

- **框架**：Next.js 15（App Router）
- **语言**：TypeScript
- **样式**：Tailwind CSS + CSS 变量主题系统（三套主题 + 自动深色模式）
- **存储**：全部使用浏览器 localStorage，数据不上传任何服务器
- **PWA**：manifest + apple-mobile-web-app 元标签，自定义粉色图标
- **部署**：Vercel（连接 GitHub 仓库 `bunny-peach/cale`）

## 本地开发

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 生产构建
npm start        # 运行生产版本
```

## 功能一览

### 🎨 主题（设置 → 外观）
- **粉色**（默认）：干净的奶油白背景（#FAF7F5，不再偏黄）+ 低饱和粉色
- **液态玻璃**：iOS 26 风格毛玻璃，半透明卡片与气泡、磨砂顶栏/底栏、发光边框
- **Claude 官端复刻**：奶油背景 + 橙棕强调色，消息无气泡、全宽阅读式排版
- **深色模式自动切换**：三套主题都有深色版本，跟随系统 `prefers-color-scheme`
- 主题保存到 localStorage，首帧前即应用，无闪烁

### 💬 聊天
- 支持 **OpenAI 兼容**（`/v1/chat/completions`）和 **Anthropic 原生**（`/v1/messages`）两种接口格式
- SSE 流式输出，实时打字机效果
- 思维链（Thinking）折叠展示 —— “💭 Cale的内心”，默认收起
- Markdown 渲染（加粗 / 斜体 / 代码块 / 列表）
- **长按菜单**：复制、撤回、删除单条、清空整个对话、保存到日记
- **撤回**：撤回自己的消息会连同 Cale 的对应回复一起删除
- **查找聊天记录**：顶部搜索框，高亮匹配结果，点击跳转并闪烁定位
- **双击点赞**：双击消息冒出爱心动画
- **引用回复**：左滑 Cale 的消息快速引用
- **备注名**：点击顶部名字直接编辑，自动同步进 system prompt
- 发送图片（转 base64，支持 vision）
- 多对话管理，左侧滑出对话列表
- 每次请求自动携带完整历史 + 组装好的 system prompt

### 📖 日记
- 时间倒序列表，Markdown 详情
- 手动新增，或从聊天一键保存

### 📅 日历
- **恋爱纪念日**：显示“和 Cale 在一起的第 X 天”+ 爱心动效
- **经期记录与预测**：标记经期开始日，自动按历史修正周期；日历上区分经期 / 预测 / 排卵期
- **心情记录**：每天选一个心情，日历用 emoji 标记
- **API 消费统计**：按天统计 token 用量与花费（近 14 天柱状图）

### ⚙️ 设置
- API 设置（地址 / Key / 模型 / 格式 / 测试连接）
- System Prompt 编辑（字数统计）
- 记忆库、MCP 愿望清单、Cale 的推荐（歌单 / 书架）
- 个性化：Cale 备注名、纪念日、token 单价
- 导入 / 导出全部数据（JSON），清除对话记录

## Cale 的“自主能力”

发送时，记忆库、经期状态、今日心情、MCP 愿望清单会自动附加到 system prompt。
Cale 可以在回复中使用隐藏标记来主动记录（前端解析后自动隐藏并入库）：

| 标记 | 效果 |
| --- | --- |
| `[MCP_ADD: 条目]` | 添加到 MCP 愿望清单（标注“Cale 添加”） |
| `[SONG_ADD: 歌名 - 歌手]` | 添加到歌单 |
| `[BOOK_ADD: 书名 - 作者]` | 添加到书架 |
| `[MOOD_NOTE: 内容]` | 记录到今日心情备注 |

## localStorage key 规划

`cale_api_config` · `cale_system_prompt` · `cale_conversations` · `cale_current_conversation` ·
`cale_diary` · `cale_memories` · `cale_mcp_wishlist` · `cale_period_data` · `cale_usage_stats` ·
`cale_settings` · `cale_moods` · `cale_playlist` · `cale_bookshelf`
