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

const NavItem = ({ to, icon: Icon, label, index }: { to: string; icon: any; label: string; index: number }) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group relative overflow-visible border",
                active
                    ? "bg-sky-500/10 text-sky-500 border-sky-500/50 nav-item-active-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/40 hover:border-border"
            )}
        >
            <Icon className={cn("w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110", active && "drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]")} />

            {/* Label Container - Now purely centered */}
            <div className="relative z-10 hidden lg:flex h-4 items-center">
                <span className="text-sm font-bold tracking-wide leading-none">{label}</span>

                {/* Shortcut Hint - Aboslute positioned to avoid shifting the label */}
                <div className="absolute top-full left-0 right-0 flex justify-center pt-1 pointer-events-none">
                    <Kbd
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 scale-75 origin-top whitespace-nowrap bg-black/40 backdrop-blur-md border-white/10"
                    >
                        Alt+{index + 1}
                    </Kbd>
                </div>
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

                {/* LEFT: Logo / Title */}
                <div className="flex items-center gap-2 sm:gap-4 z-20 overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0" onClick={() => window.location.href = '/'}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-colors" />
                            <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-sky-500 relative z-10 transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-110 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                        </div>
                        <h1 className="text-base sm:text-xl font-black tracking-tighter text-foreground leading-tight select-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] xs:max-w-[150px] sm:max-w-none bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 drop-shadow-sm">
                            连续线智能监控系统
                        </h1>
                    </div>
                </div>

                {/* CENTER: Navigation Items (Desktop) */}
                <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1.5 p-1 bg-muted/20 dark:bg-slate-900/40 rounded-xl border border-border/50 backdrop-blur-md z-10">
                    {navItems.map((item, idx) => (
                        <NavItem key={item.to} index={idx} {...item} />
                    ))}
                </nav>

                {/* RIGHT: Status & User */}
                <div className="flex items-center gap-2 lg:gap-4 z-20">
                    {/* Playback Badge */}
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

                    {/* Stats Group: Sequential Layout */}
                    <div className="hidden xl:flex items-center gap-4 border-r border-border dark:border-white/10 pr-4">
                        {/* 1. 年月日 */}
                        <div className="text-right min-w-[120px]">
                            <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">日期</span>
                            <span className="font-mono text-[11px] font-black text-foreground dark:text-slate-300 leading-none block mt-0.5 whitespace-nowrap">
                                {formatFullDate(currentTime).split(' ')[0]}
                            </span>
                        </div>
                        {/* 2. 时分秒 */}
                        <div className="text-right min-w-[70px]">
                            <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">时间</span>
                            <span className="font-mono text-sm font-black text-sky-600 dark:text-sky-400 leading-none block mt-0.5">
                                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                            </span>
                        </div>
                        {/* 3. 线体数 */}
                        <div className="text-right">
                            <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">线体数</span>
                            <span className="font-mono text-sm font-black text-foreground leading-none">{(state && state.lines) ? state.lines.length : 0}</span>
                        </div>
                        {/* 4. 完整性 */}
                        <div className="text-right">
                            <span className="block text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">完整性</span>
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="font-mono text-sm font-black text-emerald-500 leading-none">100%</span>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            </div>
                        </div>
                    </div>

                    {/* User Group: Role, Avatar, Logout */}
                    {user ? (
                        <div className="flex items-center gap-3 sm:gap-5 ml-2">
                            {/* 5. 管理员 (Role/User) */}
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-black text-foreground flex items-center gap-1.5 leading-none">
                                    {user.username}
                                </span>
                                <span className="text-[9px] text-sky-600 dark:text-sky-400 uppercase tracking-widest font-black opacity-80 mt-1">
                                    {user.role === 'admin' ? '管理员' : '操作员'}
                                </span>
                            </div>

                            {/* 6. 头像 (Avatar) */}
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/20 p-[1px] border border-sky-500/20 shadow-md">
                                <div className="w-full h-full rounded-[10px] bg-background dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <span className="text-[11px] font-black text-sky-500 uppercase">{user?.username ? user.username.substring(0, 2) : '??'}</span>
                                </div>
                            </div>

                            {/* 7. 退出 (Logout) */}
                            <button
                                onClick={logout}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-300 border border-red-500/20 hover:border-red-500/40"
                            >
                                <LogOut size={14} className="opacity-70" />
                                <span className="text-xs font-black">退出</span>
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
                                <NavItem to="/" icon={LayoutDashboard} label="主界面" index={0} />
                                <NavItem to="/logs" icon={ListTodo} label="运行日志" index={1} />
                                <NavItem to="/stats" icon={BarChart2} label="数据统计" index={2} />
                                <NavItem to="/inspection" icon={ClipboardCheck} label="智能点检" index={3} />
                                <NavItem to="/settings" icon={Settings} label="系统设置" index={4} />
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
