# RoadMap — 产品路线图工作台

基于 Notion 的双向数据流转看板。管理灵感、规划版本、拖拽排期。

## Tech Stack

- **Next.js 16** (App Router + Turbopack)
- **React 19**
- **@dnd-kit/core** — 拖拽交互
- **@notionhq/client** — Notion API 双向同步
- **Tailwind CSS v4** — 样式

## 功能

- **灵感池** — 创建想法，拖入版本排期或放入储备库
- **版本时间线** — 创建版本（选择显示板块），管理状态（规划中 / 进行中 / 已发布）
- **拖拽流转** — 灵感池 → 版本板块 / 储备库，自动同步到 Notion
- **垃圾桶** — 拖入删除灵感

## 前置条件

1. Notion 创建一个 Integration，获取 API Key
2. 创建 **Roadmap_Version** 数据库，字段：
   - `Version` (Title)
   - `Commit` (Rich Text)
   - `Status` (Select: Planned / In Progress / Released)
   - `VisibleCategories` (Multi-select: scenarios, experience, foundation, performance)
3. 创建 **Ideas** 数据库，字段：
   - `Idea` (Title)
   - `Status` (Select: Ideas / Backlog / Scheduled)
   - `Category` (Select: Uncategorized, scenarios, experience, foundation, performance)
   - `Version` (Relation → Roadmap_Version)
4. 将两个数据库共享给 Integration

## 环境变量

```env
# .env.local
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx  # Roadmap_Version 数据库 ID
NOTION_IDEAS_DB_ID=xxx  # Ideas 数据库 ID
NOTION_DATA_SOURCE_ID=xxx  # Roadmap_Version 的数据源视图 ID（用于查询）
```

## 运行

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # 生产构建
npm start         # 生产模式运行
```

## 部署到 Vercel

1. 推送代码到 Git
2. [vercel.com](https://vercel.com) 导入项目
3. 添加上述 4 个环境变量
4. Deploy

## 项目结构

```
app/
  api/
    ideas/create/route.ts    # 创建灵感
    ideas/update/route.ts    # 更新灵感（状态/板块/版本）
    ideas/delete/route.ts    # 删除灵感
    versions/create/route.ts # 创建版本
    versions/update/route.ts # 更新版本状态
    versions/delete/route.ts # 删除版本
  page.tsx                   # SSR 入口
  globals.css                # 主题（米白 + 胡桃木）

components/
  RoadmapInteractiveBoard.tsx  # 主看板
  CreateIdeaModal.tsx          # 新建灵感
  CreateVersionModal.tsx       # 新建版本
  StatusBadge.tsx              # 状态徽章

lib/notion.ts                  # Notion 查询
types/roadmap.ts               # 类型定义
```
