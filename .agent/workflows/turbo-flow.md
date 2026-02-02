---
description: 高度自动化的开发工作流，复刻 Superpowers 功能（头脑风暴、计划编写、TDD 验证、Skill 调用）
---

# Turbo Flow — 全流程自动化开发工作流

本工作流实现了类似 Superpowers 的核心功能，包括需求理清、计划编写、自动化测试、Skill 调用及任务看板管理。

---

## 阶段 0: 初始化 | Initialization

// turbo
1. **读取任务看板**：查看 `docs/turbo_tasks.md` 中的现有任务状态。
2. **识别用户需求**：分析用户本次请求的核心目标。
3. **添加任务到看板**：将新需求以 `- [ ] **任务名称**：描述` 格式追加到 `docs/turbo_tasks.md` 的 `<!-- TASKS_START -->` 区域。

---

## 阶段 1: 需求理清 | Brainstorming

// turbo
4. **需求澄清**：如果需求不明确，主动向用户提问以获取更多细节。
5. **生成设计概要**：在 `implementation_plan.md` 中记录初步设计思路。
6. **确认方向**：通过 `notify_user` 请求用户确认设计方向。

---

## 阶段 2: 计划编写 | Planning

// turbo
7. **任务拆解**：将需求拆解为原子任务，每个任务应在 2-5 分钟内完成。
8. **更新任务看板**：将拆解后的子任务以缩进形式追加到 `docs/turbo_tasks.md`。
9. **Skill 识别**：根据任务类型自动匹配合适的 Skill。可选 Skill 包括：
   - `webapp-testing` — 前端功能测试
   - `frontend-design` — 高质量 UI 设计
   - `fastapi-industrial-service` — 后端服务开发
   - `industrial-hmi-expert` — 工业 HMI 界面
   - `xlsx` / `pdf` / `docx` — 文档处理
10. **加载 Skill**：如果需要，使用 `view_file` 读取对应 Skill 的 `SKILL.md` 文件。

---

## 阶段 3: 执行与验证 | Execution & TDD

// turbo-all
11. **批量执行任务**：按计划依次完成每个子任务。
12. **运行自动化测试**：
    - 前端：`npm test` 或 `npm run lint`
    - 后端：`pytest` 或 `python -m pytest`
    - 若无测试文件，跳过此步骤。
13. **标记完成**：测试通过后，在 `docs/turbo_tasks.md` 中将对应任务的 `[ ]` 改为 `[x]`。
14. **验证失败处理**：
    - 如测试失败，分析原因并自动修复。
    - 修复后重新运行测试，直到通过。

---

## 阶段 4: 收尾 | Finishing

// turbo
15. **生成变更摘要**：在 `walkthrough.md` 中记录本次完成的工作。
16. **移动已完成任务**：将 `docs/turbo_tasks.md` 中已完成的任务移至 `<!-- COMPLETED_START -->` 区域。
17. **通知用户**：使用 `notify_user` 告知用户任务已完成，并提供 `walkthrough.md` 和 `docs/turbo_tasks.md` 的路径供审阅。

---

## 快捷指令

- `/turbo-flow` — 启动完整流程
- `/turbo-flow:plan` — 仅执行阶段 0-2（规划）
- `/turbo-flow:exec` — 仅执行阶段 3-4（执行与收尾）
- `/turbo-flow:status` — 查看当前任务看板状态

---

## 注意事项

- 所有任务必须记录到 `docs/turbo_tasks.md`，确保用户可见。
- 涉及 UI 的任务应优先调用 `frontend-design` Skill。
- 涉及测试的任务应优先调用 `webapp-testing` Skill。
- 每个阶段开始前，使用 `task_boundary` 更新当前状态。
- 如遇复杂需求，拆分为多个子任务分批执行。
