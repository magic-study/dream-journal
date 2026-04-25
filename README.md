# Dream Journal

一个手机优先的梦境记录 Web App（MVP），支持快速记录、搜索筛选、统计洞察，以及本地导入导出。

## 功能概览

- **记录梦境**：标题、正文、梦境日期、情绪(1-5)、清晰度(1-5)、清醒梦/噩梦、标签
- **草稿体验**：自动保存草稿到本地，支持“撤销上一步”编辑
- **时间线回顾**：按日期倒序展示，点击查看详情
- **搜索与筛选**：关键词搜索、标签筛选、最低情绪筛选、仅清醒梦筛选
- **统计洞察**：近 7/30 天记录数、高频标签 Top5、情绪/清晰度趋势图
- **数据管理**：导出 JSON、导入 JSON（含 schema 校验与版本迁移）、清空本地数据

## 技术栈

- React 19 + TypeScript + Vite
- Zustand（状态管理）
- IndexedDB + `idb`（本地持久化）
- Zod（导入数据校验）
- Recharts（统计图）
- Vitest + Testing Library（测试）

## 快速开始

### 1) 安装依赖

```bash
pnpm install
```

### 2) 启动开发环境

```bash
pnpm dev
```

### 3) 常用命令

```bash
pnpm build
pnpm lint
pnpm test
```

## 数据模型

### `DreamEntry`

- `id: string`
- `createdAt: string` (ISO)
- `updatedAt: string` (ISO)
- `dreamDate: string` (YYYY-MM-DD)
- `title?: string`
- `content: string`
- `tags: string[]`
- `emotion: 1 | 2 | 3 | 4 | 5`
- `vividness: 1 | 2 | 3 | 4 | 5`
- `isLucid: boolean`
- `isNightmare: boolean`
- `draft: boolean`

### `AppMeta`

- `schemaVersion: number`
- `lastBackupAt?: string`

## 目录结构（核心）

```text
src/
  App.tsx                  # 页面与交互
  index.css                # 移动端与主题样式
  types.ts                 # 数据类型
  store/
    useDreamStore.ts       # Zustand 状态与业务动作
  lib/
    db.ts                  # IndexedDB 访问
    schema.ts              # Zod 校验
    migrate.ts             # 导入数据迁移
    migrate.test.ts        # 迁移测试
  test/
    setup.ts               # 测试环境初始化
```

## 当前实现边界

- 首版为**纯本地存储**，不含登录与云同步
- 适配手机优先 Web 体验，桌面端可用但非主要优化目标
- 当前未接入 PWA 离线缓存插件（可后续补齐）
