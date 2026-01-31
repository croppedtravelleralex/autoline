import { Outlet } from 'react-router-dom';
import { TopNavbar } from '../components/TopNavbar';
import { useToast } from '../context/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X, ChevronRight } from 'lucide-react';

export function MainLayout() {
    const { toasts, removeToast } = useToast();

    // 过滤出所有持久化报警 (duration=0)
    const activeAlarms = toasts.filter(t => t.duration === 0);

    return (
        <div className="flex flex-col min-h-screen md:h-screen bg-background bg-grid overflow-x-hidden md:overflow-hidden font-sans select-none text-foreground">
            <TopNavbar />

            {/* 常驻报警区域 (仅当有持久报警时显示) */}
            <AnimatePresence>
                {activeAlarms.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-500/10 border-b border-red-500/20 dark:border-red-500/40 backdrop-blur-md overflow-hidden relative"
                    >
                        <div className="max-w-[1600px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-0.5">系统关键报警 ({activeAlarms.length})</span>
                                    <h4 className="text-sm font-bold text-foreground dark:text-white truncate">{activeAlarms[0].message}</h4>
                                </div>
                                {activeAlarms.length > 1 && (
                                    <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                                        <span className="text-[9px] font-black text-red-500">更多内容</span>
                                        <ChevronRight size={10} className="text-red-500" />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => removeToast(activeAlarms[0].id)}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors group/close"
                            >
                                <X size={16} className="text-white/40 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                        {/* 扫描线动画 */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute bottom-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-hidden relative">
                <main className="absolute inset-0 overflow-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
