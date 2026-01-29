# Vercel 部署教程

本文档介绍如何将 AutoLine 项目（前端和后端）部署到 Vercel。

---

## 1. 准备工作

在开始之前，请确保你拥有以下账号：
- [GitHub](https://github.com/) 账号（用于托管代码）
- [Vercel](https://vercel.com/) 账号（用于部署）

---

## 2. 前端部署 (React + Vite)

Vercel 对 Vite 项目有很好的原生支持。

### 步骤：
1. **推送代码至 GitHub**：将你的项目推送到 GitHub 仓库。
2. **导入项目**：登录 Vercel，点击 "Add New" -> "Project"，选择你的 GitHub 仓库并点击 "Import"。
3. **配置项目**：
   - **Framework Preset**: 选择 `Vite`。
   - **Root Directory**: 如果你的前端代码在子目录中（例如 `frontend`），请点击 "Edit" 并选择该目录。
   - **Build and Output Settings**: 默认设置通常即可（`npm run build` 和 `dist`）。
4. **设置环境变量**：
   - 在 "Environment Variables" 部分，添加以下变量：
     - `VITE_API_URL`: 指向你的后端接口地址（例如 `https://your-backend.vercel.app/api`）。
5. **部署**：点击 "Deploy"。

> [!TIP]
> 前端目录中已包含 `vercel.json`，用于处理单页应用 (SPA) 的路由重写和 API 代理。

---

## 3. 后端部署 (FastAPI)

Vercel 支持通过 Serverless Functions 部署 Python 应用。

### 步骤：
1. **创建入口文件**：在 `backend` 目录下（或根目录，取决于你的组织方式）确保有一个接入 Vercel 的入口文件。通常可以将 `main.py` 中的 `app` 实例暴露出来。
2. **配置 `vercel.json`**：在后端根目录创建或修改 `vercel.json`。
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/index.py" }
     ]
   }
   ```
3. **环境依赖**：确保 `requirements.txt` 位于部署目录下，包含 `fastapi`, `uvicorn` 等。
4. **导入项目**：在 Vercel 中再次导入项目，或将后端作为独立项目导入。
5. **配置项目**：
   - **Framework Preset**: 选择 `Other`。
   - **Root Directory**: `backend`。
6. **设置环境变量**：添加后端运行所需的任何变量（如 `SECRET_KEY`, `DATABASE_URL`）。
7. **部署**：点击 "Deploy"。

---

## 4. 常见问题 (FAQ)

### 如何处理后端跨域 (CORS)？
在 `backend/app/main.py` 中，确保配置了生产环境的域名。
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Vercel Serverless Function 超时？
Vercel 免费版的 Serverless Function 执行时长有限（通常为 10s）。如果后端有长时间运行的任务，建议使用专用的服务器（如 Railway, Render）或异步队列。

### 前端 API 请求 404？
检查 `frontend/vercel.json` 中的 `rewrites` 配置，确保其指向了正确的后端地址。

---

## 5. 维护与更新

每次你向 GitHub 推送代码时，Vercel 都会自动触发重新部署。你可以通过 Vercel 控制台查看构建日志和实时部署状态。
