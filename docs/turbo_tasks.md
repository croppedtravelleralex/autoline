# Turbo Flow 任务看板

本文档记录所有通过 Turbo Flow 工作流提交的需求与任务。
每个任务在完成后会被自动标记为 `[x]`。

---

## 📋 当前任务

> [!TIP]
> 此区域会实时更新，记录你提出的每一个需求。

- [x] **切换动画卡顿优化** ✅
    - [x] 分析 `LineButton.tsx` 的 layoutId 动画性能
    - [x] 检查 `Home.tsx` 中 LineSection 重新挂载逻辑
    - [x] 优化 React.memo 和动画参数，减少重绘
    - **影响文件**: `LineButton.tsx`, `Home.tsx`, `LineSection.tsx`
- [x] **进度条加载动效增强** ✅
    - [x] 为 `CartProgressPanel.tsx` 的进度条添加 shimmer/pulse 加载效果
    - [x] 优化进度条动画时序，使增长更具视觉冲击
    - **影响文件**: `CartProgressPanel.tsx`, `index.css`
- [x] **点检页面显示优化** ✅
    - [x] 优化"检测结果详报"区域布局，将纯文本改为结构化卡片
    - [x] 为异常项添加配色与图标，增强可读性
    - [x] 添加"无异常"状态的占位提示
    - **影响文件**: `Inspection.tsx`
- [x] **登录日志记录功能** ✅
    - [x] 在 `UserContext.tsx` 的 login/logout 中调用后端记录 API
    - [x] 后端添加 `/api/login-log` 接口，获取客户端 IP
    - [x] 确保登录日志正确显示在运行日志页
    - **影响文件**: `UserContext.tsx`, `api.py`
- [x] **页面切换动画闪烁修复** ✅
    - [x] 简化 `MainLayout.tsx` 的页面切换动画（移除 scale/y 偏移）
    - [x] 使用纯 opacity 过渡，避免布局抖动
    - **影响文件**: `MainLayout.tsx`
- [x] **腔体通信协议配置** ✅
    - [x] 为 `Chamber` 模型添加 `ChamberConnection` 字段（IP/端口/从站ID）
    - [x] 在 `Settings.tsx` 硬件接口 Tab 中添加腔体通信配置 UI
    - [x] 初始化腔体时自动分配递增 IP（192.168.1.xx）
    - [x] 持久化存储到 `state.json`
    - **影响文件**: `models.py`, `state_service.py`, `Settings.tsx`, `types/index.ts`
- [x] **点检模式与线体选择持久化** ✅
    - [x] 将 `Inspection.tsx` 的 `autoInterval` 持久化到 localStorage
    - [x] 自动点检定时器移至 `SystemStateContext` 全局运行（跨页面生效）
    - [x] 将 `Home.tsx` 的 `selectedLineId` 持久化到 localStorage
    - **影响文件**: `Inspection.tsx`, `Home.tsx`, `SystemStateContext.tsx`
- [x] **腔体通信配置 UI 优化** ✅ 
    - [x] 修复 IP 全相同问题（后端迁移旧数据添加 connection）
    - [x] 添加 IP/端口/从站ID 可编辑输入框
    - [x] 添加连接/断开按钮
    - [x] 优化线体名称格式（去掉重复的 id 后缀）
    - [x] 显示所有线体的腔体配置
    - **影响文件**: `Settings.tsx`, `state_service.py`
- [x] **腔体控制功能优化** ✅
    - [x] 优化详情页按钮样式，防止误认为禁用状态
    - [x] 腔体卡片状态行同步增加加热系统呼吸灯
    - [x] 后端完善加热系统切换的操作日志记录
    - [x] 验证详情页控制按钮交互与状态实时同步
    - **影响文件**: `ChamberSettingsModal.tsx`, `ChamberCard.tsx`, `state_service.py`
- [x] **设置界面全屏化优化** ✅
    - [x] 分析 `Settings.tsx` 布局容器，移除宽度限制
    - [x] 优化侧边栏与内容区域的比例，提升大屏利用率
    - [x] 适配响应式布局，确保在大屏下视觉效果饱满
    - **影响文件**: `Settings.tsx`
- [x] **界面滚动功能优化** ✅
    - [x] 在 `Settings.tsx` 主容器增加 `overflow-y-auto` 和 `h-full`
    - [x] 优化滚动条样式，使其符合工业监控系统风格
    - [x] 检查并确保其他主页面（如日志、报警）也具备正常的滚动功能
    - **影响文件**: `Settings.tsx`, `index.css`
- [x] **移动端响应式布局优化** ✅
    - [x] 点检页面（Inspection）：侧边栏折叠/抽屉模式，主内容区内容卡片转为垂直堆叠
    - [x] 设置页面（Settings）：标签页横向滚动，表格横向滚动/卡片化
    - [x] 统计页面（Statistics）：时间轴横向滚动，表格横向滚动/卡片化
    - [x] 日志页面（RunLogs）：标签页紧凑化，日志列表换行优化
    - [x] 全局导航栏（TopNavbar）：汉堡菜单折叠模式
    - **影响文件**: `Inspection.tsx`, `Settings.tsx`, `Statistics.tsx`, `RunLogs.tsx`, `TopNavbar.tsx`, `index.css`
<!-- TASKS_END -->

---

## ✅ 已完成任务

<!-- COMPLETED_START -->
- [x] **右侧面板文字重叠修复** ✅ (本次更新)
    - [x] 优化 `CartTaskPanel.tsx` 的 Flex 布局，实现双重截断
    - [x] 修正 `CartProgressPanel.tsx` 进度条文字重叠对齐
- [x] **底部5卡片独立收起/展开** ✅
    - [x] 为每个面板（日志、警报、操作、待办、进度）添加独立的 collapsed/expanded 状态
    - [x] 设计收起后的紧凑视图样式（窄条形式）
    - [x] 添加 Framer Motion 动画（300-500ms）
    - [x] 持久化展开/收起状态到 localStorage
    - **影响文件**: `CollapsiblePanel.tsx`(新), `CartTaskPanel.tsx`, `CartProgressPanel.tsx`, `DashboardLogPanel.tsx`, `Home.tsx`

- [x] **系统导航与 Logo 优化** ✅
    - [x] TopNavbar 功能按钮布局优化，避免重叠
    - [x] 增加按钮背景和发光特效
- [x] **线体管理 UI** ✅
    - [x] 线体切换动画与紧凑样式优化

- [x] **创建 Turbo Flow 工作流**：复刻 Superpowers 功能，实现全流程自动化
    - [x] 创建工作流文件 `.agent/workflows/turbo-flow.md`
    - [x] 创建用户可视任务文档 `docs/turbo_tasks.md`
<!-- COMPLETED_END -->
