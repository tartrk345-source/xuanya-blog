# AI 个人博客设计

> 项目创建时间：2026-06-12
> 开发者：祝欣缘（玄牙）
> AI 协作伙伴：WorkBuddy
> 开发方式：Vibe Coding（严格按 docs/开发流程.md 执行）

---

## 这个项目是什么

一个支持 Markdown 写作的个人博客 Web 应用。极简第一版：文章列表 + 详情 + 写作/编辑 + 发布/草稿 + 导出备份。

## 目录结构

```
ai-blog/
├── README.md               # 本文件：项目总览
├── AGENTS.md               # AI 协作规则（必须遵守的开发规范）
├── index.html              # 入口 HTML
├── package.json            # 项目依赖和脚本
├── vite.config.ts          # Vite 配置
│
├── docs/                   # 文档目录
│   ├── PRD.md              # 产品需求文档
│   ├── 开发流程.md          # Vibe Coding 开发流程说明
│   └── 变更日志.md          # 每次修改记录
│
├── src/                    # 源代码目录
│   ├── main.tsx            # 应用入口
│   ├── App.tsx             # 根组件（路由）
│   ├── components/         # UI 组件
│   ├── pages/              # 页面组件
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── hooks/              # 自定义 React Hooks
│   ├── storage/            # localStorage 读写逻辑
│   └── styles/             # 样式文件
│
└── public/                 # 静态资源
```

## 当前状态

🟢 **MVP 开发完成** — 6 个阶段全部通过，进入验收阶段

## 快速链接

- [AIGENTS.md — AI 协作规则](./AGENTS.md)
- [PRD.md — 产品需求文档](./docs/PRD.md)
- [开发流程.md](./docs/开发流程.md)
