@echo off
setlocal
echo ========================================
echo   AutoLine Local Development Launcher
echo ========================================

:: 说明：
:: 1. 使用 start /b 将进程运行在后台，但输出仍会显示在当前窗口。
:: 2. 这样关闭此窗口时，Windows 通常会自动清理该会话下的所有子进程。
:: 3. 移除了 npm install 以加快启动速度。

echo [%TIME%] Starting Backend with Conda (cursor)...
:: 使用 call conda activate 确保在批处理中正常跳转
start /b cmd /c "cd backend && call conda activate cursor && python main.py"

echo [%TIME%] Starting Frontend (Vite)...
start /b cmd /c "cd frontend && npm run dev"

echo.
echo ================================================
echo   Services are running in THIS window.
echo   - Backend: http://127.0.0.1:8080
echo   - Frontend: http://localhost:5173
echo.
echo   [IMPORTANT] CLOSE THIS WINDOW to stop all services.
echo ================================================
echo.

:: 保持窗口开启
pause > nul
