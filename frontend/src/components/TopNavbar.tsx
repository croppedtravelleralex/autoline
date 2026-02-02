import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    ListTodo,
    BarChart2,
    Activity,
    Menu,
    X as CloseIcon,
    LogOut,
    ClipboardCheck
} from 'lucide-react';
import { cn, formatFullDate } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSystemState } from '../hooks/useSystemState';
import { useUser } from '../context/UserContext';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { Kbd } from './Kbd';

const NavItem = ({ to, icon: Icon, label, index, showLabel }: { to: string; icon: any; label: string; index: number; showLabel?: boolean }) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group relative overflow-visible border",
                active
                    ? "bg-sky-500/10 text-sky-500 border-sky-500/30 dark:border-sky-500/50 nav-item-active-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/20 dark:border-border/40 hover:border-border"
            )}
        >
            <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]")} />

            {/* Label Container - Responsive: Hidden on desktop until screen is very wide (1700px+) */}
            <div className={cn("relative z-10 h-4 items-center", showLabel ? "flex" : "hidden min-[1700px]:flex")}>
                <span className="text-sm font-bold tracking-wide leading-none">{label}</span>

                {/* Shortcut Hint - Aboslute positioned to avoid shifting the label */}
                {!showLabel && (
                    <div className="absolute top-full left-0 right-0 flex justify-center pt-1 pointer-events-none">
                        <Kbd
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 scale-75 origin-top whitespace-nowrap bg-muted dark:bg-black/40 backdrop-blur-md border border-border dark:border-white/10 text-muted-foreground dark:text-white"
                        >
                            Alt+{index + 1}
                        </Kbd>
                    </div>
                )}
            </div>

            {active && (
                <motion.div
                    layoutId="active-nav-glow"
                    className="absolute inset-0 rounded-lg bg-sky-400/5 dark:bg-sky-400/10 active-nav-pulse"
                />
            )}
        </Link>
    );
};

export function TopNavbar() {
    const { state, playback } = useSystemState();
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 全局导航快捷键
    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "主界面" },
        { to: "/logs", icon: ListTodo, label: "运行日志" },
        { to: "/stats", icon: BarChart2, label: "数据统计" },
        { to: "/inspection", icon: ClipboardCheck, label: "智能点检" },
        { to: "/settings", icon: Settings, label: "系统设置" },
    ];

    useKeyboardShortcut(
        navItems.map((item, idx) => ({
            key: (idx + 1).toString(),
            altKey: true,
            handler: () => navigate(item.to)
        })),
        true
    );

    return (
        <>
            <header className="h-16 border-b border-border bg-white/90 dark:bg-slate-900/40 backdrop-blur-2xl flex items-center justify-between px-6 shrink-0 z-50 shadow-sm dark:shadow-xl relative overflow-visible">
                {/* 顶部高光边线 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />

                {/* LEFT CONTAINER: Logo + Nav */}
                <div className="flex items-center gap-8 z-20 overflow-hidden flex-1">
                    {/* Logo / Title */}
                    <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0" onClick={() => window.location.href = '/'}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-colors" />
                            <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-sky-500 relative z-10 transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-110 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                        </div>
                        <h1 className="text-base sm:text-xl font-black tracking-tighter text-foreground leading-tight select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] xs:max-w-[150px] sm:max-w-none bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 drop-shadow-sm">
                            连续线智能监控系统
                        </h1>
                    </div>

                    {/* Navigation Items - Moved here, no longer centered */}
                    <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-muted/20 dark:bg-slate-900/40 rounded-xl border border-border/50 backdrop-blur-md">
                        {navItems.map((item, idx) => (
                            <NavItem key={item.to} index={idx} {...item} />
                        ))}
                    </nav>
                </div>

                {/* RIGHT: Status & User */}
                <div className="flex items-center gap-2 lg:gap-4 z-20">
                    {/* Playback Badge */}

                    {/* Stats Group: Reorganized - Function Buttons Left, DateTime Right (Only on 2xl screens) */}
                    <div className="hidden 2xl:flex items-center gap-3 border-r border-border dark:border-white/10 pr-4">
                        {/* 1. 线体数 - Pill Card Style with Glow */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-sky-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(14,165,233,0.15)] hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all duration-300 cursor-pointer group">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-shadow">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-medium leading-none">线体数</span>
                                <span className="font-['Microsoft_YaHei'] text-lg font-bold text-white leading-tight">{(state && state.lines) ? state.lines.length : 0}</span>
                            </div>
                        </div>
                        {/* 2. 完整性 - Pill Card Style with Glow */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-emerald-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 cursor-pointer group">
                            <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <div className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping opacity-30" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-medium leading-none">完整性</span>
                                <span className="font-['Microsoft_YaHei'] text-lg font-bold text-emerald-400 leading-tight">100%</span>
                            </div>
                        </div>
                        {/* 3. 在线人数 - Pill Card Style with Glow */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-cyan-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer group">
                            <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping opacity-30" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-slate-400 font-medium leading-none">在线</span>
                                <span className="font-['Microsoft_YaHei'] text-lg font-bold text-cyan-400 leading-tight">
                                    {state.onlineUsers?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        {/* 4. 年月日 */}
                        <div className="text-right">
                            <span className="font-['Microsoft_YaHei'] text-sm font-bold text-foreground dark:text-slate-300 leading-none block whitespace-nowrap">
                                {formatFullDate(currentTime).split(' ')[0]}
                            </span>
                        </div>
                        {/* 5. 时分秒 */}
                        <div className="text-right min-w-[90px]">
                            <span className="font-['Microsoft_YaHei'] text-2xl font-bold text-sky-600 dark:text-sky-400 leading-none block">
                                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                            </span>
                        </div>
                    </div>

                    {/* User Group: Beautified Design */}
                    {user ? (
                        <div className="flex items-center gap-2 pl-4 ml-2 border-l border-border/40 dark:border-white/10">
                            <div className="group flex items-center gap-3 p-1 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-border/50 dark:border-white/10 transition-all cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-md">
                                {/* Avatar */}
                                <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-white/20 overflow-hidden">
                                        <span className="text-xs font-black bg-gradient-to-br from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                                            {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-10" />
                                </div>

                                {/* Text Info */}
                                <div className="hidden lg:flex flex-col items-start pr-3 min-w-0">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none truncate max-w-[100px]" title={user.username}>
                                        {user.username}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate max-w-[100px]">
                                        {user.role === 'admin' ? 'Administrator' : 'Operator'}
                                    </span>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={logout}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                title="退出系统"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    ) : null}

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors relative z-50 border border-border/40"
                    >
                        {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-[#0b0e1b] border-l border-border shadow-2xl z-[70] md:hidden p-6 pt-20 flex flex-col gap-2"
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
                                {navItems.map((item, idx) => (
                                    <NavItem key={item.to} index={idx} {...item} showLabel />
                                ))}
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
        </>
    );
}
