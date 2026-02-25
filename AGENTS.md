# AGENTS.md

**请始终使用简体中文和用户对话**

## 项目概述

Hacker Podcast — 基于 AI 的中文播客生成器，自动抓取 Hacker News 每日热门文章，生成中文摘要并转换为音频播客。部署于 Cloudflare Workers。

## 技术栈

- **框架**: vinext (Vite-based Next.js for Cloudflare Workers) + React 19
- **语言**: TypeScript 严格模式 + Zod 运行时验证
- **样式**: Tailwind CSS 4 + shadcn/ui
- **基础设施**: Cloudflare Workers / KV / R2 / Workflows / Browser Rendering
- **包管理**: pnpm 10.26.1

## 开发命令

```bash
pnpm install                # 安装依赖
pnpm dev                    # vinext 开发服务器 (端口 3000)
pnpm build                  # 构建应用
pnpm deploy                 # 部署完整应用
pnpm lint                   # ESLint 全量检查
pnpm lint:fix               # 自动修复 ESLint 问题 (优先使用)
pnpm dev:worker             # Worker 开发服务器 (端口 8787)
pnpm deploy:worker          # 部署 Worker
pnpm tests                  # 集成测试 (需远程 Cloudflare 环境, wrangler --remote)
pnpm cf-typegen             # 生成 Cloudflare 类型定义
```

### Lint 单个文件

```bash
npx eslint path/to/file.ts          # 检查单个文件
npx eslint path/to/file.ts --fix    # 修复单个文件
npx eslint "app/**/*.tsx"            # 检查目录下所有 TSX 文件
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
└── layout.tsx          # 根布局
worker/                 # Cloudflare Worker 入口 (独立 wrangler.jsonc)
workflow/               # 工作流引擎 (抓取、AI 摘要、TTS)
components/
├── ui/                 # shadcn/ui (ESLint 忽略，勿手动修改)
└── podcast/            # 播客业务组件
types/                  # TypeScript 类型定义
├── *.d.ts              # 全局声明 (无需 import/export)
└── *.ts                # 显式导出的类型
lib/                    # 工具函数
config.ts               # 应用配置 (播客信息、站点设置)
vite.config.ts          # Vite + vinext + Cloudflare 插件配置
wrangler.jsonc          # 主应用 Cloudflare 配置
```

## vinext 关键差异 (非标准 Next.js)

vinext 在 Vite 上重新实现 Next.js API (~94% 覆盖率)，编码时需注意：

1. 构建使用 Vite，配置在 `vite.config.ts` 中，**不支持 webpack/Turbopack**
2. 环境变量通过 `import { env } from 'cloudflare:workers'` 获取，**不用 `process.env`**
3. `next/image` 无构建时优化，远程图片用 `@unpic/react`
4. `runtime` 和 `preferredRegion` 路由段配置被忽略
5. CLI 命令: `vinext dev` / `vinext build` / `vinext deploy`

## 代码风格规范

### 格式化

- 2 空格缩进，LF 换行，UTF-8 编码
- ESLint 使用 `@antfu/eslint-config` (含 formatters + react + better-tailwindcss)
- `components/ui/**/*` 和 `cloudflare-env.d.ts` 被 ESLint 忽略
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
- 样式用 `cn()` 合并 Tailwind 类名: `cn('flex gap-2', isActive && 'bg-primary')`

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
2. **本地 TTS 限制** — Edge TTS 在本地可能卡住，调试时注释掉 TTS 代码
3. **音频合并** — 需要 Cloudflare Browser Rendering，用 `pnpm tests` 测试
4. **开发模式** — 只处理 1 篇文章 (生产 10 篇)
5. **构建容错** — TypeScript 错误不会阻断构建
6. **勿修改 `components/ui/`** — 由 shadcn/ui 生成，ESLint 已忽略
7. **验证变更** — 提交前运行 `pnpm lint` 确保通过
