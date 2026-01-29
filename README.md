# Auto Line Monitor (AutoLine)

连续线智能监控系统，提供工业产线的实时状态监控、自动化流程管理及历史数据分析。

## 目录结构

- [frontend/](file:///c:/Users/Lenovo/Desktop/program/autoline/frontend/) - 后端服务 (FastAPI)
- [backend/](file:///c:/Users/Lenovo/Desktop/program/autoline/backend/) - 前端应用 (React + TypeScript)
- [docs/](file:///c:/Users/Lenovo/Desktop/program/autoline/docs/) - 项目文档、规格说明及部署教程
- [scripts/](file:///c:/Users/Lenovo/Desktop/program/autoline/scripts/) - 开发工具与自动化脚本

## 快速开始

### 开发环境启动
1. **后端**: 进入 `backend` 目录，执行 `python main.py`。详见 [测试启动步骤.md](file:///c:/Users/Lenovo/Desktop/program/autoline/docs/测试启动步骤.md)。
2. **前端**: 进入 `frontend` 目录，执行 `npm run dev`。

### 生产部署
推荐使用 Docker Compose 进行快速部署。详见 [部署教程.md](file:///c:/Users/Lenovo/Desktop/program/autoline/docs/部署教程.md)。

## 技术栈

- **前端**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **后端**: Python 3.10+, FastAPI, Pydantic, SQLite
- **部署**: Docker, Docker Compose, Nginx
