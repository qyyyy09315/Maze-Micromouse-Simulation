<div align="center">

<img src="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f42d.svg" width="80" height="80" alt="mouse" />

# 迷宫电脑鼠仿真系统

**Maze Micromouse Simulation**

*A* · BFS · 多智能体竞赛 · Canvas 可视化*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![pnpm](https://img.shields.io/badge/pnpm-latest-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<br />

</div>

---

## 📖 项目简介

大连海洋大学《算法设计与分析》课程期末项目。模拟迷宫电脑鼠路径规划与多智能体竞赛，支持 **A\***（3 种启发式）和 **BFS** 算法对比，Canvas 渲染支持高达 500×500 的迷宫规模。

> ℹ️ 仅供教育和研究用途。This project is for educational purposes only.

---

## ✨ 核心功能

<table>
<tr>
<td width="50%">

### 🧭 路径规划
- **A\*** 算法 — Manhattan / Euclidean / Diagonal 三种启发式
- **BFS** 基线算法 — 双指针队列 O(1) 出队
- 自动启发式选择（基于障碍率）

### 🤖 多智能体竞赛
- 最多 5 个智能体同时运行
- 3 种策略：Follower / Competitor / Random
- 实时碰撞检测与回退

</td>
<td width="50%">

### 🎮 实时可视化
- Canvas 渲染迷宫（10×10 ~ 500×500）
- 搜索过程分步动画
- 按智能体颜色区分搜索区域
- BFS（红色）vs A\*（青色）一目了然

### 📊 性能分析
- 启发式对比图表（Recharts）
- 竞赛统计：路径长度、探索节点、碰撞率
- 自定义起点/终点 · 文件导入迷宫

</td>
</tr>
</table>

---

## 🚀 快速开始

### 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| pnpm | latest |

### 安装与运行

```bash
# 克隆仓库
git clone git@github.com:qyyyy09315/Maze-Micromouse-Simulation.git
cd Maze-Micromouse-Simulation

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

浏览器访问 **http://localhost:3000**

### 其他命令

```bash
pnpm run build      # 生产构建
pnpm run test       # 运行测试（Vitest）
pnpm run test:watch # 测试监视模式
pnpm run typecheck  # TypeScript 类型检查
pnpm run lint       # ESLint 代码检查
```

---

## 🗂 项目结构

```
src/
├── algorithms/          # 核心算法
│   ├── astar.ts           A* 路径规划（MinHeap 优先队列）
│   ├── bfs.ts             BFS（双指针队列）
│   ├── collision.ts       多智能体碰撞检测
│   ├── heap.ts            二叉最小堆
│   ├── heuristics.ts      三种启发式函数
│   └── maze-generator.ts  迷宫生成（递归回溯 + 可解性保证）
├── hooks/               # React Hooks
│   ├── useMazeSimulation.ts  核心模拟逻辑
│   ├── useExperiment.ts      启发式对比实验
│   └── useTheme.ts           暗色/亮色主题
├── components/          # UI 组件
│   ├── MazeGrid.tsx         Canvas 迷宫渲染
│   ├── ControlPanel.tsx     实验参数控制
│   ├── StatsPanel.tsx       竞赛结果统计
│   └── HeuristicChart.tsx   启发式性能图表
├── pages/
│   └── Home.tsx             主页面（组装层）
├── types/
│   └── index.ts             类型定义与常量
└── lib/
    └── utils.ts             工具函数
tests/                   # Vitest 单元测试
```

---

## 🧠 算法说明

### A\* 路径规划

使用 **MinHeap 优先队列** 优化节点拓展（O(n log n)），Open Map 实现 O(1) 节点查找。

| 启发式 | 公式 | 特点 |
|--------|------|------|
| Manhattan | \|dx\| + \|dy\| | 4 方向网格最优 |
| Euclidean | √(dx² + dy²) | 物理距离，对角线低估 |
| Diagonal | max(dx,dy) + (√2-1)·min(dx,dy) | 8 方向网格最优 |

### BFS 基线

双指针队列替代 `Array.shift()`，实现 O(1) 出队。保证找到最短路径。

### 迷宫生成

递归回溯算法（步长 2）生成通道结构，BFS 验证可解性，二分搜索优化障碍物密度。

---

## 📈 使用说明

### 基本操作

1. 在左侧面板调整参数（迷宫大小、障碍率、智能体数量等）
2. 点击「开始实验」启动模拟
3. 观察 Canvas 中智能体的搜索和移动过程
4. 查看右侧「竞赛统计」了解各智能体表现

### 启发式对比

点击顶部「启发式对比」按钮运行独立实验：
- 在 8 种障碍率（5%–40%）下测试 3 种启发式
- 对比**探索节点数**（非路径长度——所有 admissible 启发式的最优路径长度相同）
- 图表即时显示不同启发式的搜索效率差异

### 自定义迷宫

1. 选择「文件导入」选项
2. 上传 `.txt` 格式迷宫文件（每行 0/1，0=空 1=墙）
3. 支持自定义起点/终点坐标

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 |
| 语言 | TypeScript（strict） |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 + Outfit 字体 |
| 图表 | Recharts |
| 测试 | Vitest |
| 包管理 | pnpm |

---

## 📄 License

MIT — [qyyyy09315](https://github.com/qyyyy09315)

---

<div align="center">

**大连海洋大学 · 算法设计与分析 · 2026**

</div>
