# AutoLine Zeabur 免费部署教程

本教程指导您将 AutoLine 完整应用（前端 + 后端）免费部署到 Zeabur 平台，**支持中国大陆访问**。

---

## 为什么选择 Zeabur？

| 优势 | 说明 |
|------|------|
| 🚀 亚洲优化 | 台湾公司，亚洲节点速度快 |
| 🆓 免费额度 | 每月 $5 免费额度 |
| 🐍 后端支持 | 原生支持 Python / FastAPI |
| ⚡ 一键部署 | GitHub 连接后自动部署 |
| 🔗 内网互联 | 前后端服务可内网通信 |

---

## 目录

1. [前置准备](#前置准备)
2. [部署后端](#部署后端)
3. [部署前端](#部署前端)
4. [配置域名](#配置域名)
5. [环境变量配置](#环境变量配置)
6. [常见问题](#常见问题)

---

## 前置准备

### 已完成 ✅
- [x] GitHub 仓库: [croppedtravelleralex/autoline](https://github.com/croppedtravelleralex/autoline)
- [x] 后端配置文件: `backend/zeabur.json`
- [x] 前端配置文件: `frontend/zeabur.json`

### 注册 Zeabur

1. 访问 [https://zeabur.com](https://zeabur.com)
2. 点击 **Sign Up** → 使用 GitHub 登录
3. 授权 Zeabur 访问您的仓库

---

## 部署后端

### 步骤 1：创建项目

1. 登录 Zeabur 控制台
2. 点击 **New Project**
3. 选择区域：**Asia (Hong Kong)** 或 **Asia (Tokyo)**（中国访问更快）

### 步骤 2：添加后端服务

1. 在项目中点击 **Add Service** → **Deploy from GitHub**
2. 选择仓库 `croppedtravelleralex/autoline`
3. 配置：
   - **Root Directory**: `backend`
   - **Branch**: `main`
4. 点击 **Deploy**

### 步骤 3：生成后端域名

1. 部署成功后，点击后端服务
2. 进入 **Networking** 选项卡
3. 点击 **Generate Domain**
4. 记录生成的域名，例如：`autoline-backend-xxx.zeabur.app`

---

## 部署前端

### 步骤 1：添加前端服务

1. 在同一项目中点击 **Add Service** → **Deploy from GitHub**
2. 选择同一仓库 `croppedtravelleralex/autoline`
3. 配置：
   - **Root Directory**: `frontend`
   - **Branch**: `main`
4. 点击 **Deploy**

### 步骤 2：配置环境变量

1. 点击前端服务 → **Variables** 选项卡
2. 添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://autoline-backend-xxx.zeabur.app`（上一步获取的后端域名） |

3. 点击 **Redeploy** 使变量生效

### 步骤 3：生成前端域名

1. 进入 **Networking** 选项卡
2. 点击 **Generate Domain**
3. 获取前端访问地址，例如：`autoline-xxx.zeabur.app`

---

## 配置域名

### 使用 Zeabur 提供的免费域名

Zeabur 自动提供 `*.zeabur.app` 子域名，无需额外配置。

### 使用自定义域名（可选）

1. 在 **Networking** 中点击 **Custom Domain**
2. 输入您的域名（如 `autoline.yourdomain.com`）
3. 按提示添加 DNS CNAME 记录
4. 等待 SSL 证书自动签发

---

## 环境变量配置

### 后端环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ENV` | `production` | 生产环境 |
| `PORT` | `8080` | 服务端口（已在配置文件中设置） |

### 前端环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend.zeabur.app` | 后端 API 地址 |

---

## 常见问题

### Q: 部署失败怎么办？

A: 检查以下几点：
1. 确认 `requirements.txt` 存在于 `backend/` 目录
2. 确认 `package.json` 存在于 `frontend/` 目录
3. 查看 Zeabur 部署日志获取详细错误信息

### Q: 前端无法连接后端？

A: 检查以下配置：
1. 后端服务是否正常运行
2. 前端 `VITE_API_URL` 是否正确设置
3. 后端 CORS 配置是否允许前端域名

### Q: 免费额度用完了怎么办？

A: Zeabur 免费额度为每月 $5：
- 单个小型服务约 $2-3/月
- 可暂停不使用的服务节省额度
- 或升级到付费计划

### Q: 如何更新部署？

A: 推送代码到 GitHub main 分支后，Zeabur 会**自动重新部署**。

---

## 部署检查清单

### 后端
- [ ] 选择亚洲区域（香港/东京）
- [ ] Root Directory 设置为 `backend`
- [ ] 部署成功并生成域名
- [ ] 访问 `/api/health` 确认服务正常

### 前端
- [ ] Root Directory 设置为 `frontend`
- [ ] 配置 `VITE_API_URL` 环境变量
- [ ] 部署成功并生成域名
- [ ] 访问前端确认页面正常加载

---

## 最终架构

```
┌─────────────────────────────────────────────────────────┐
│                    Zeabur 项目                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐      ┌─────────────────┐          │
│  │   前端服务       │      │   后端服务       │          │
│  │   (Vite/React)  │ ───► │   (FastAPI)     │          │
│  │                 │      │                 │          │
│  │ autoline.       │      │ autoline-       │          │
│  │ zeabur.app      │      │ backend.        │          │
│  │                 │      │ zeabur.app      │          │
│  └─────────────────┘      └─────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

祝部署顺利！🚀
