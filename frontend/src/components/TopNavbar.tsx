import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ListTodo,

    Activity,
    BarChart2,
    Settings,

    ClipboardCheck,
    LogOut,
    Shield,
    Eye,
    Menu,
    X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { useSystemState } from '../hooks/useSystemState';
import { useUser } from '../context/UserContext';

// 格式化日期：YYYY年MM月DD日 星期X
const formatFullDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekDay}`;
};

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 group relative overflow-hidden",
                active
                    ? "bg-sky-500/15 text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)] border border-sky-500/30 animate-in fade-in zoom-in-95"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            {active && (
                <motion.div
                    layoutId="active-nav-glow"
                    className="absolute inset-0 bg-sky-400/5 dark:bg-sky-400/10 active-nav-pulse"
                />
            )}
            <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]")} />
            <span className="text-sm font-bold relative z-10 hidden lg:block tracking-wide">{label}</span>
        </Link>
    );
};

export function TopNavbar() {
    const { state, playback } = useSystemState();
    const { user, logout } = useUser();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 border-b border-border bg-background/60 dark:bg-slate-950/60 backdrop-blur-2xl flex items-center justify-between px-6 shrink-0 z-50 shadow-sm dark:shadow-xl relative overflow-visible">
            {/* 顶部高光边线 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />

            {/* LEFT: Logo / Title */}
            <div className="flex items-center gap-4 z-20">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-colors" />
                        <Activity className="w-6 h-6 text-sky-500 relative z-10 transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-110 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                    </div>
                    <h1 className="text-lg font-black tracking-tighter text-foreground leading-tight hidden sm:block select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px] lg:max-w-none">
                        连续线智能监控
                    </h1>
                </div>
            </div>

            {/* CENTER: Navigation Items (Desktop) */}
            <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 p-1 bg-muted/30 dark:bg-slate-900/40 rounded-lg border border-border/50 backdrop-blur-md z-10">
                <NavItem to="/" icon={LayoutDashboard} label="主界面" />
                <NavItem to="/logs" icon={ListTodo} label="运行日志" />
                <NavItem to="/stats" icon={BarChart2} label="数据统计" />
                <NavItem to="/inspection" icon={ClipboardCheck} label="智能点检" />
                <NavItem to="/settings" icon={Settings} label="系统设置" />
            </nav>

            {/* RIGHT: Status & User */}
            <div className="flex items-center gap-3 lg:gap-6 z-20">
                {/* Playback Badge (Desktop Only or Compact) */}
                {playback?.isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden sm:flex items-center gap-2 px-2 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-500 text-[9px] font-black tracking-widest uppercase"
                    >
                        <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                        Playback
                    </motion.div>
                )}

                {/* System Stats (Desktop Only) */}
                <div className="hidden xl:flex gap-6 border-r border-border dark:border-white/10 pr-6 items-center">
                    <div className="text-right">
                        <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">在线小车</span>
                        <span className="font-mono text-sm font-black text-foreground leading-none">{(state && state.carts) ? state.carts.length : 0}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">完整性</span>
                        <span className="font-mono text-sm font-black text-emerald-500 leading-none block">100%</span>
                    </div>
                    <div className="text-right min-w-[100px]">
                        <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                            {formatFullDate(currentTime).split(' ')[1]}
                        </span>
                        <span className="font-mono text-sm font-black text-foreground dark:text-slate-200 leading-none block mt-0.5">
                            {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                        </span>
                    </div>
                </div>

                {/* User Info */}
                {user ? (
                    <div className="flex items-center gap-2 lg:gap-4 group">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5 leading-none">
                                {user.username}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mt-1">
                                {user.role === 'admin' ? '管理员' : '操作员'}
                            </span>
                        </div>

                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 p-[1px] shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300">
                                <div className="w-full h-full rounded-[7px] bg-background dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <span className="text-[10px] font-black text-sky-500 uppercase">{user?.username ? user.username.substring(0, 2) : '??'}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-50 group-hover:scale-100"
                            >
                                <LogOut size={10} />
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors relative z-50"
                >
                    {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-background border-l border-border shadow-2xl z-50 md:hidden p-6 pt-20 flex flex-col gap-2"
                        >
                            <div className="mb-4 px-2 py-4 border-b border-border/50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-sky-500" />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-black">系统控制中心</span>
                                        <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Version 1.2.0</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1" onClick={() => setIsMobileMenuOpen(false)}>
                                <NavItem to="/" icon={LayoutDashboard} label="主界面" />
                                <NavItem to="/logs" icon={ListTodo} label="运行日志" />
                                <NavItem to="/stats" icon={BarChart2} label="数据统计" />
                                <NavItem to="/inspection" icon={ClipboardCheck} label="智能点检" />
                                <NavItem to="/settings" icon={Settings} label="系统设置" />
                            </div>

                            <div className="mt-auto pt-6 border-t border-border/50 space-y-4 text-center">
                                <div className="flex justify-around items-center opacity-60">
                                    <div className="text-center">
                                        <span className="block text-[8px] font-black text-muted-foreground">CARTS</span>
                                        <span className="text-base font-black">{(state && state.carts) ? state.carts.length : 0}</span>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="text-center">
                                        <span className="block text-[8px] font-black text-muted-foreground">HEALTH</span>
                                        <span className="text-base font-black text-emerald-500">100%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-bold text-sm"
                                >
                                    <LogOut size={16} />
                                    退出登录
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
