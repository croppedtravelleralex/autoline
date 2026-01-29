import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export function GlobalErrorListener() {
    const { showToast } = useToast();

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error('Captured Global Error:', event.error);
            // 严重错误设为 sticky (duration: 0)
            showToast(`系统错误: ${event.message}`, 'error', 0);
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            console.error('Captured Unhandled Rejection:', event.reason);
            const message = event.reason?.message || event.reason || '未知的 Promise 拒绝';
            showToast(`异步错误: ${message}`, 'warning', 8000); // 异步警告显示久一点
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [showToast]);

    return null; // 此组件不渲染任何 UI
}
