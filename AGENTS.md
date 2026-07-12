# AGENTS.md

**请始终使用简体中文和用户对话**

## 项目概述

Hacker Podcast — 基于 AI 的中文播客生成器，自动抓取 Hacker News 每日热门文章，生成中文摘要并转换为音频播客。部署于 Cloudflare Workers。

## 技术栈

- **框架**: vinext (Vite-based Next.js for Cloudflare Workers) + React 19
- **语言**: TypeScript 严格模式 + Zod 运行时验证
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: `@tanstack/react-store`（stores/ 目录）
- **基础设施**: Cloudflare Workers / KV / R2 / Workflows / Browser Rendering
- **包管理**: pnpm 11.0.8

## 开发命令

```bash
pnpm dev                    # vinext 开发服务器 (端口 3000)
pnpm build                  # 构建应用
pnpm deploy                 # 部署完整应用
pnpm typecheck              # tsc --noEmit 类型检查
pnpm lint:fix               # 自动修复 ESLint 问题 (优先使用)
pnpm dev:worker             # Worker 开发服务器 (端口 8787)
pnpm deploy:worker          # 部署 Worker
pnpm logs:worker            # 实时查看 Worker 日志
pnpm tests                  # 集成测试 (需远程 Cloudflare 环境)
pnpm cf-typegen             # 生成 Cloudflare 类型定义
```

**验证变更顺序**: `pnpm lint:fix` → `pnpm typecheck` → `pnpm build`

### Lint 单个文件

```bash
npx eslint path/to/file.ts --fix
```

### 测试说明

- **没有单元测试框架**，仅有基于 wrangler 的集成测试
- `pnpm tests` 实际运行 `wrangler dev --cwd tests --remote`，需要远程 Cloudflare 环境
- 测试文件位于 `tests/audio.ts`，测试音频合并功能
- 本地无法运行测试，**验证代码变更应使用 `pnpm lint` 和 `pnpm build`**

## 项目结构

```
app/                    # App Router 页面 (页面组件默认导出)
├── page.tsx            # 首页
├── episode/[date]/     # 单集页面
├── rss.xml/            # RSS 订阅
├── sitemap.ts          # 站点地图
├── robots.ts           # robots.txt
└── layout.tsx          # 根布局
worker/                 # Cloudflare Worker 入口 (独立 wrangler.jsonc，cron 触发)
workflow/               # 工作流引擎 (抓取、AI 摘要、TTS)
├── index.ts            # HackerNewsWorkflow 入口
├── prompt.ts           # AI 提示词
├── tts.ts              # TTS 多提供商适配（含 edge/ark/mimo/minimax/murf 等）
└── utils.ts            # 工具函数
components/
├── ui/                 # shadcn/ui (ESLint 忽略，勿手动修改)
└── podcast/            # 播客业务组件
stores/                 # TanStack Store 状态管理
hooks/                  # React 自定义 Hook
types/                  # TypeScript 类型定义
├── *.d.ts              # 全局声明 (无需 import/export)
└── *.ts                # 显式导出的类型
lib/                    # 工具函数
config.ts               # 应用配置 (播客信息、站点设置)
vite.config.ts          # Vite + vinext + Cloudflare 插件配置
next.config.mjs         # vinext 读取的重写规则 (/blog.xml → /rss.xml)
wrangler.jsonc          # 主应用 Cloudflare 配置 (KV/R2 remote: true)
worker/wrangler.jsonc   # Worker Cloudflare 配置 (含 cron、Browser Rendering)
```

## vinext 关键差异 (非标准 Next.js)

vinext 在 Vite 上重新实现 Next.js API (~94% 覆盖率)，编码时需注意：

1. 构建使用 Vite，配置在 `vite.config.ts` 中，**不支持 webpack/Turbopack**
2. 环境变量通过 `import { env } from 'cloudflare:workers'` 获取，**不用 `process.env`**
3. `next/image` 无构建时优化，远程图片推荐 `@unpic/react`（若需要）
4. `runtime` 和 `preferredRegion` 路由段配置被忽略
5. CLI 命令: `vinext dev` / `vinext build` / `vinext deploy`
6. `tsconfig.json` 中 `next/*` 路径别名映射到 vinext 的 shim 实现

## Workflow 架构要点

- **触发**: Worker cron `30 23 * * *` UTC → 触发 `HackerNewsWorkflow`
- **开发模式**: `NODE_ENV != production` 时只处理 1 篇文章（生产 10 篇）
- **TTS 对话格式**: 每行以 `男:` 或 `女:` 开头，workflow 按此切分并选择对应声音
- **TTS 提供商**: 默认 Edge TTS，支持 `ark`、`mimo`、`minimax`、`murf`、`volcengine` 等
- **音频合并**: 依赖 Cloudflare Browser Rendering（BROWSER binding），无此 binding 则跳过
- **KV key 格式**: `content:{env}:hacker-podcast:{date}`（如 `content:production:hacker-podcast:2025-01-01`）
- **R2 路径格式**: `{date}/{env}/hacker-podcast-{date}.mp3`
- **本地 TTS 限制**: Edge TTS 在本地可能卡住，调试时注释掉 TTS 代码

### Workflow 所需环境变量

| 变量                                         | 说明                                                         | 必须 |
| -------------------------------------------- | ------------------------------------------------------------ | ---- |
| `OPENAI_BASE_URL`                            | LLM API 基础 URL                                             | ✓    |
| `OPENAI_API_KEY`                             | LLM API Key                                                  | ✓    |
| `OPENAI_MODEL`                               | 主模型                                                       | ✓    |
| `HACKER_PODCAST_WORKER_URL`                  | Worker 公开 URL                                              | ✓    |
| `HACKER_PODCAST_R2_BUCKET_URL`               | R2 Bucket 公开 URL                                           | ✓    |
| `OPENAI_THINKING_MODEL`                      | 思考模型（可选，用于播客/博客内容）                          | -    |
| `OPENAI_MAX_TOKENS`                          | 最大 token 数，默认 4096                                     | -    |
| `JINA_KEY`                                   | Jina API Key（文章抓取备用）                                 | -    |
| `TTS_PROVIDER`                               | TTS 提供商，如 `ark`（默认 edge）                            | -    |
| `TTS_API_KEY` / `TTS_API_URL` / `TTS_API_ID` | TTS 凭证和接口配置                                           | -    |
| `TTS_MODEL`                                  | TTS 模型；ark 默认 `seed-tts-2.0`，mimo 默认 `mimo-v2.5-tts` | -    |
| `MAN_VOICE_ID` / `WOMAN_VOICE_ID`            | 声音 ID                                                      | -    |
| `AUDIO_SPEED`                                | 语速；ark 使用 0.5～2 倍率                                   | -    |

## 代码风格规范

### 格式化

- 2 空格缩进，LF 换行，UTF-8 编码
- ESLint 使用 `@antfu/eslint-config` (含 formatters + react + better-tailwindcss)
- ESLint 忽略: `components/ui/**/*`、`cloudflare-env.d.ts`、`.codex/**/*`
- 预提交钩子: simple-git-hooks → lint-staged → `eslint --fix`

### 导入规范

```typescript
// 类型导入始终使用 import type
import type { Episode, PodcastInfo } from '@/types/podcast'
// 顺序: 类型导入 → 外部依赖 → 内部模块 (ESLint 自动排序)
import { generateText } from 'ai'
import { cn } from '@/lib/utils'
// 路径别名: @/ 映射到项目根目录
```

### TypeScript 规范

- **严格模式**，禁止 `any` / `as any` / `@ts-ignore`
- 接口 (`interface`) 优先于 `type alias`
- 导出命名函数，非箭头函数赋值
- 全局类型放 `types/` 目录 (`.d.ts` 全局声明，`.ts` 显式导出)

### React 组件

- 客户端组件必须标记 `'use client'`
- 业务组件使用**命名导出**
- 页面组件使用**默认导出** (App Router 约定)
- 样式用 `cn()` 合并 Tailwind 类名

### Console 规范

```typescript
// 禁止 console.log，允许 console.info / console.warn / console.error
console.info('allowed') // ✓
```

### 错误处理

```typescript
// try-catch + console.error，workflow 步骤配合重试
try {
  const result = await someAsyncOperation()
}
catch (error) {
  console.error('操作失败', error)
  throw error
}
```

### Cloudflare Workers 环境

```typescript
import { env } from 'cloudflare:workers'

const kv = env.HACKER_PODCAST_KV
const r2 = env.HACKER_PODCAST_R2
// ISR 重验证
export const revalidate = 600
```

## 重要注意事项

1. **这不是标准 Next.js** — 使用 vinext，命令为 `vinext dev/build/deploy`
2. **两个独立 wrangler 配置** — 根目录 `wrangler.jsonc` 是主应用，`worker/wrangler.jsonc` 是 cron Worker
3. **构建容错** — TypeScript 错误不会阻断构建，但 `pnpm typecheck` 会报错
4. **勿修改 `components/ui/`** — 由 shadcn/ui 生成，ESLint 已忽略
5. **`next.config.mjs` 仍有效** — vinext 读取此文件中的 `rewrites` 配置
