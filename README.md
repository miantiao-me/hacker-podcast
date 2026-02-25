# Agili 的 Hacker Podcast

一个基于 AI 的 Hacker News 中文播客项目，每天自动抓取 Hacker News 热门文章，通过 AI 生成中文总结并转换为播客内容。

[<img src="https://devin.ai/assets/deepwiki-badge.png" alt="DeepWiki" height="20"/>](https://deepwiki.com/miantiao-me/hacker-podcast)

预览地址: <https://hacker-podcast.agi.li>

订阅地址: [RSS](https://hacker-podcast.agi.li/rss.xml) | [Apple Podcasts](https://podcasts.apple.com/us/podcast/Hacker-Podcast/id1809638204) | [YouTube](https://www.youtube.com/@hacker-podcast-daily) | [小宇宙](https://www.xiaoyuzhoufm.com/podcast/67b06023606e5c59409cd9ba) | [Spotify](https://open.spotify.com/show/63cre75hc25H7McAY5bzyo)

![hacker-podcast](https://socialify.git.ci/miantiao-me/hacker-podcast/image?description=1&forks=1&name=1&owner=1&pattern=Circuit+Board&stargazers=1&theme=Auto)

---

## 主要特性

- 🤖 自动抓取 Hacker News 每日热门文章
- 🎯 使用 AI 智能总结文章内容和评论
- 🎙️ 通过 TTS 生成中文播报
- 📱 支持网页和播客 App 收听
- 🔄 每日自动更新
- 📝 提供文章摘要和完整播报文本

## 技术栈

- [vinext](https://github.com/cloudflare/vinext) (Vite + React Server Components) 应用框架
- Cloudflare Workers 部署和运行环境
- TTS 语音合成
- OpenAI API 内容生成
- Tailwind CSS 样式处理
- shadcn-ui 组件库

## 工作流程

1. 定时抓取 Hacker News 热门文章
2. 使用 AI 生成中文摘要和播报文稿
3. 通过 TTS 转换为音频。
4. 存储到 Cloudflare R2 和 KV
5. 通过 RSS feed 和网页提供访问

## 本地开发

> 项目由一个 Worker 和 Web 程序组成，Worker 负责抓取数据，处理音频。使用了 Cloudflare 的 R2 存储、 KV 存储、工作流和浏览器呈现。
> Web 程序负责展示数据和提供 RSS 订阅。Web 程序使用 vinext 开发，通过 Cloudflare Vite 插件部署到 Workers。

1. 安装依赖:

```bash
pnpm install
```

2. 配置环境变量:

```bash
# .env.local
NODE_ENV=development
NEXT_STATIC_HOST=http://localhost:3000/static

# worker/.env.local
NODE_ENV=development
HACKER_PODCAST_WORKER_URL=https://you-worker-url
HACKER_PODCAST_R2_BUCKET_URL=https://your-bucket-url
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1

```

3. 启动开发服务器:

```bash
# 开发工作流
pnpm dev:worker
# curl -X POST http://localhost:8787 # 手动触发工作流

# 开发 Web 页面
pnpm dev
```

> 注意：
>
> - 本地运行工作流时，Edge TTS 转换音频可能会卡住。建议直接注释该部分代码进行调试。
> - 由于合并音频需要使用 Cloudflare 的浏览器端呈现，不支持本地开发，需要远程调试。可以使用 `pnpm tests` 进行测试。

## 部署

项目使用 Cloudflare Workers 部署:

1. 创建 R2 文件存储桶, 绑定域名后，修改 `NEXT_STATIC_HOST` 和 `HACKER_PODCAST_R2_BUCKET_URL` 变量。
2. 创建 KV 存储空间
3. 修改 `wrangler.jsonc` 中 KV 和 R2 的值
4. 使用 `wrangler` 脚手架配置线上环境的环境变量:

```bash
# 更新 Worker 的私有变量
pnpx wrangler secret put --cwd worker HACKER_PODCAST_WORKER_URL # 绑定域名后，修改为绑定域名
pnpx wrangler secret put --cwd worker HACKER_PODCAST_R2_BUCKET_URL
pnpx wrangler secret put --cwd worker OPENAI_API_KEY
pnpx wrangler secret put --cwd worker OPENAI_BASE_URL
pnpx wrangler secret put --cwd worker OPENAI_MODEL

# 更新 Web 程序的私有变量
pnpx wrangler secret put NODE_ENV # 建议 production
pnpx wrangler secret put NEXT_PUBLIC_BASE_URL # Web 服务地址
pnpx wrangler secret put NEXT_STATIC_HOST # 绑定域名后，修改为绑定域名
```

```bash
# 记得恢复注释：wrangler.jsonc 中的 workflows 相关配置
pnpm deploy:worker
pnpm run deploy
```

## 致谢

特别感谢以下开源项目：

- **[Podify](https://github.com/sun0225SUN/podify)** - 一个优雅的播客主题，为本项目提供了设计灵感和参考

## 贡献

欢迎提交 Issue 和 Pull Request!

## 赞助

> [!TIP]
> ![MiniMax](https://static.miantiao.me/share/2026/eFwhMy/7360.png)
> MiniMax-M2.1 是开源的业界顶尖编程模型，在多语言代码编写、界面设计理解与美学表达、长文本处理及多步骤复杂开发任务上表现卓越。让我们向通用生产力的长期愿景迈出了坚实一步，让人人都能轻松用上前沿的 AI 能力。[**点击领取 MiniMax CodingPlan 专属 88 折优惠**](http://404.li/mm)。

1. [在 Telegram 关注我](https://t.me/miantiao_me)
2. [在 𝕏 上关注我](https://404.li/x)
3. [在 GitHub 赞助我](https://github.com/sponsors/miantiao-me)

## 免责声明

本项目与 Hacker News 和 Y Combinator 没有任何关联。"Hacker News" 是 Y Combinator 的注册商标。
