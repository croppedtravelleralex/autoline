import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number; // 0 表示不自动消失
}

interface ToastContextType {
    toasts: Toast[]; // 导出原始列表以便布局订阅
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const iconMap = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10',
    error: 'bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/10',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10',
    info: 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-sky-500/10',
};

const iconColorMap = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        setToasts((prev) => [...prev, { id, type, message, duration }]);

        // 只有 duration > 0 时才自动移除
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            {/* 弹出式 Toast 容器 - 仅渲染有自动关闭时间或非严重的通知 */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-3 pointer-events-none w-full max-w-[90vw] md:max-w-2xl">
                <AnimatePresence>
                    {toasts.filter(t => t.duration !== 0).map((toast) => {
                        const Icon = iconMap[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                layout
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className={`pointer-events-auto group relative flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl w-full ${colorMap[toast.type]}`}
                            >
                                <div className={`p-2 rounded-xl bg-white/5`}>
                                    <Icon className={`w-6 h-6 shrink-0 ${iconColorMap[toast.type]}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white/90 leading-relaxed tracking-wide truncate md:whitespace-normal">
                                        {toast.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
                                >
                                    <X className="w-5 h-5 text-white/40 group-hover:text-white/80" />
                                </button>

                                {/* 只有自动关闭的会有进度条 */}
                                {toast.duration! > 0 && (
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: toast.duration! / 1000, ease: 'linear' }}
                                        className={`absolute bottom-0 left-0 h-0.5 rounded-full opacity-50 ${iconColorMap[toast.type].replace('text', 'bg')}`}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
