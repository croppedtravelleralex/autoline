# 腾讯云 CloudBase (TCB) 部署指南

本教程将引导您将 AutoLine 项目（FastAPI 后端 + React 前端）部署到腾讯云 CloudBase。

## 准备工作

1. **注册腾讯云账号**：访问 [腾讯云官网](https://cloud.tencent.com/) 并完成实名认证。
2. **创建环境**：在 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) 创建一个新环境（推荐选择按量计费）。
3. **记下环境 ID**：例如 `my-env-123456`。

## 第一步：后端部署 (云托管)

1. 进入 TCB 控制台的 **“云托管”** 页面。
2. 点击 **“新建服务”**：
   - **服务名称**：`autoline-backend`
   - **部署方式**：选择“代码包部署”或“代码库部署”。
   - **端口设置**：`8080` (必须与 Dockerfile 中的 EXPOSE 端口一致)。
3. 上传 `backend` 文件夹内容，或者关联您的 Git 仓库。
4. 部署成功后，系统会分配一个 **公网域名**（如 `autoline-backend-xxx.run.tcloudbase.com`），请记下这个地址。

## 第二步：前端构建与适配

1. **修改 API 地址**：
   在 `frontend` 目录下创建或修改 `.env.production`：
   ```env
   VITE_API_BASE_URL=https://您的后端公网域名/api
   ```
2. **执行构建**：
   在 `frontend` 目录下运行：
   ```bash
   npm install --force
   npm run build
   ```
   这会生成 `dist` 文件夹。

## 第三步：前端部署 (静态网站托管)

1. 进入 TCB 控制台的 **“静态网站托管”** 页面。
2. 点击 **“开始使用”**（如果尚未开启）。
3. 将 `frontend/dist` 文件夹中的所有文件上传到根目录。
4. 访问提供的 **静态网站域名** 即可开始使用！

## 关键说明

> [!WARNING]
> **SQLite 持久化**：当前版本使用 SQLite 存储数据，云托管实例重启后数据会清空。如需稳定存储，建议后续配置“云数据库”并将后端代码适配为连接外部数据库。

> [!TIP]
> **API 跨域**：后端 `main.py` 已配置 CORS 允许所有来源，通常无需额外修改。
