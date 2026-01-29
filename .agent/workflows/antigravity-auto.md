---
description: Antigravity 全自动任务执行工作流
---

// turbo-all

当接收到复杂开发任务或明确要求“全自动执行”时使用此工作流。

## 执行步骤

1. **需求分析与环境检查**
   - 快速扫描项目结构。
   - 检查必要依赖是否安装。

2. **制定计划 (PLANNING)**
   - 创建或更新 `task.md` 记录任务进度。
   - 编写 `implementation_plan.md` 详细描述改动方案。
   - 使用 `notify_user` 请用户审阅（若无重大风险可设置为 ShouldAutoProceed: true）。

3. **自动化执行 (EXECUTION)**
   - 使用 `run_command` 执行构建、清理或环境配置命令。
   - 使用 `write_to_file` 或 `replace_file_content` 进行代码开发。
   - // turbo 会自动批准此步骤中的命令。

4. **自动化验证 (VERIFICATION)**
   - 运行测试脚本或启动服务验证。
   - 捕获日志并修复发现的问题。

5. **交付报告 (WALKTHROUGH)**
   - 生成 `walkthrough.md` 总结改动。
   - 运行 `notify_user` 告知任务完成并附带报告链接。
