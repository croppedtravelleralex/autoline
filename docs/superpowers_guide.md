# Superpowers 安装与使用指南

本文档记录了 [Superpowers](https://github.com/obra/superpowers) 的安装步骤与使用方法。Superpowers 是一个专为 AI 编程代理（Agent）设计的技能框架与开发方法论，旨在提升 AI 的规划、执行与协作能力。

## 1. 简介

Superpowers 不仅仅是一个代码库，它改变了 Agent 的工作方式：
*   **先思考再行动**：Agent 不会立即写代码，而是先通过对话理清需求（Brainstorming）。
*   **详细规划**：在确认设计后，生成详细到每一步的实施计划（Implementation Plan）。
*   **测试驱动**：强制遵循 TDD（测试驱动开发）流程，确保代码质量。
*   **子代理驱动**：将任务拆解并分派给子 Agent 执行，或批量执行任务。

## 2. 安装步骤

根据你使用的平台不同，安装方式有所区别。

### Claude Code (通过插件市场)

如果你使用的是 Claude Code 环境：

1.  **注册插件市场**：
    在对话框中输入以下命令：
    ```bash
    /plugin marketplace add obra/superpowers-marketplace
    ```

2.  **安装插件**：
    输入以下命令安装 Superpowers：
    ```bash
    /plugin install superpowers@superpowers-marketplace
    ```

### Codex

如果你使用的是 Codex，请告诉 Codex 执行以下指令：
```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

### OpenCode

如果你使用的是 OpenCode，请告诉 OpenCode 执行以下指令：
```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

## 3. 验证安装

安装完成后，可以通过以下方式验证是否成功：

在对话框中输入 `/help`。如果安装成功，你应该能看到类似以下的 Superpowers 相关命令：

```text
# Should see:
# /superpowers:brainstorm - Interactive design refinement (交互式设计优化)
# /superpowers:write-plan - Create implementation plan (创建实施计划)
# /superpowers:execute-plan - Execute plan in batches (批量执行计划)
```

## 4. 基本工作流 (The Basic Workflow)

Superpowers 引入了一套标准化的开发流程：

1.  **Brainstorming (头脑风暴)**
    *   **触发时机**：写代码之前。
    *   **作用**：通过提问完善想法，探索替代方案，并按模块展示设计以供确认。生成设计文档。

2.  **Using Git Worktrees (使用 Git 工作树)**
    *   **触发时机**：设计获批后。
    *   **作用**：在新分支上创建隔离的工作空间，运行项目设置，确保测试环境纯净。

3.  **Writing Plans (编写计划)**
    *   **触发时机**：设计获批后。
    *   **作用**：将工作拆解为微小的任务（每个 2-5 分钟）。每个任务都包含确切的文件路径、完整代码和验证步骤。

4.  **Subagent Driven Development / Executing Plans (子代理驱动开发/执行计划)**
    *   **触发时机**：有了计划之后。
    *   **作用**：为每个任务指派一个新的子 Agent 执行（包含两阶段审查：先查规范，再查代码质量），或者在人工检查点下批量执行。

5.  **Test Driven Development (测试驱动开发)**
    *   **触发时机**：实施过程中。
    *   **作用**：强制 **红-绿-重构** 循环：写失败的测试 -> 看着它失败 -> 写最少量的代码通过测试 -> 提交。删除测试前写的代码。

6.  **Requesting Code Review (请求代码审查)**
    *   **触发时机**：任务之间。
    *   **作用**：对照计划进行审查，按严重程度报告问题。严重问题将阻塞进度。

7.  **Finishing a Development Branch (完成开发分支)**
    *   **触发时机**：任务全部完成后。
    *   **作用**：验证测试，提供选项（合并/PR/保留/丢弃），清理工作树。

## 5. 包含的技能库 (Docs)

Superpowers 包含以下核心领域的技能：

*   **测试 (Testing)**: `test-driven-development` (TDD 循环)
*   **调试 (Debugging)**: `systematic-debugging` (系统化调试), `verification-before-completion` (完成前验证)
*   **协作 (Collaboration)**: `brainstorming` (头脑风暴), `writing-plans` (编写计划), `executing-plans` (执行计划), `using-git-worktrees` (Git 工作流) 等。
