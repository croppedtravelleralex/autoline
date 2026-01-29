# AutoLine Vercel 免费部署教程

本教程指导您将 AutoLine 前端应用免费部署到 Vercel 平台。

> **重要提示**: Vercel 免费版仅支持静态网站和 Serverless Functions，**不支持运行 Python 后端**。如需完整功能，后端需单独部署到 Railway、Render 或其他平台。

---

## 目录

1. [前置准备](#前置准备)
2. [部署配置](#部署配置)
3. [部署步骤](#部署步骤)
4. [后端部署方案](#后端部署方案)
5. [常见问题](#常见问题)

---

## 前置准备

### 已完成 ✅
- [x] GitHub 仓库: [croppedtravelleralex/autoline](https://github.com/croppedtravelleralex/autoline)
- [x] Vercel 账号已创建
- [x] 已连接 GitHub 仓库

### 配置文件
项目已包含以下 Vercel 配置文件：

| 文件 | 位置 | 作用 |
|------|------|------|
| `vercel.json` | `frontend/vercel.json` | Vercel 构建配置 |

---

## 部署配置

在 Vercel 项目创建页面，请按以下配置：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Framework Preset** | Vite | 已自动识别 |
| **Root Directory** | `frontend` | ⚠️ **必须修改**，点击 Edit 按钮 |
| **Build Command** | `npm run build` | 默认即可 |
| **Output Directory** | `dist` | 默认即可 |
| **Install Command** | `npm install` | 默认即可 |

### 环境变量配置

展开 **Environment Variables** 面板，添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend-url.com` | 后端 API 地址（部署后端后填写） |

> 如果暂时没有后端地址，可以先留空，部署纯前端演示版本。

---

## 部署步骤

### 步骤 1：修改 Root Directory

1. 在 Vercel 项目配置页面，找到 **Root Directory**
2. 点击 **Edit** 按钮
3. 输入 `frontend`
4. 点击确认

### 步骤 2：添加环境变量（可选）

1. 展开 **Environment Variables**
2. 添加 `VITE_API_URL`（如有后端地址）

### 步骤 3：部署

1. 点击 **Deploy** 按钮
2. 等待构建完成（约 1-2 分钟）
3. 部署成功后获取访问地址

---

## 后端部署方案

由于 Vercel 免费版不支持 Python 后端，推荐以下方案：

### 方案 A: Railway（推荐）

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 新建项目 → 选择 GitHub 仓库
4. 配置：
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 部署后获取后端 URL
6. 回到 Vercel 更新 `VITE_API_URL` 环境变量

### 方案 B: Render

1. 访问 [render.com](https://render.com)
2. 新建 Web Service
3. 配置：
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 常见问题

### Q: 页面刷新后显示 404？

A: 确保 `frontend/vercel.json` 文件存在且包含 rewrites 配置：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Q: API 请求失败？

A: 检查以下配置：
1. 确认后端已部署并运行
2. 确认 `VITE_API_URL` 环境变量设置正确
3. 后端需配置 CORS 允许 Vercel 域名

### Q: 如何重新部署？

A: 两种方式：
1. **自动**: 推送新代码到 GitHub main 分支
2. **手动**: Vercel 控制台 → Deployments → Redeploy

---

## 部署检查清单

- [ ] Root Directory 设置为 `frontend`
- [ ] Framework Preset 为 Vite
- [ ] 点击 Deploy 开始部署
- [ ] 部署成功后记录访问地址
- [ ] （可选）部署后端并配置 `VITE_API_URL`

---

祝部署顺利！🚀
