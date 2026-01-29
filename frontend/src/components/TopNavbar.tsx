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
    Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 border-b border-border bg-background/60 dark:bg-slate-950/60 backdrop-blur-2xl flex items-center justify-between px-6 shrink-0 z-50 shadow-sm dark:shadow-xl relative overflow-hidden">
            {/* 顶部高光边线 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />

            <div className="flex items-center gap-8">
                {/* Logo / Title */}
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="relative">
                        <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-colors" />
                        <Activity className="w-6 h-6 text-sky-500 relative z-10 transition-all duration-500 group-hover:rotate-[30deg] group-hover:scale-110 drop-shadow-[0_0_12px_rgba(14,165,233,0.8)]" />
                    </div>
                    <h1 className="text-lg font-black tracking-tighter text-foreground leading-tight hidden md:block select-none">
                        连续线智能监控
                    </h1>
                </div>

                {/* Navigation Items */}
                <nav className="flex items-center gap-1.5 p-1 bg-muted/30 dark:bg-slate-900/40 rounded-lg border border-border/50">
                    <NavItem to="/" icon={LayoutDashboard} label="主界面" />
                    <NavItem to="/logs" icon={ListTodo} label="运行日志" />
                    <NavItem to="/stats" icon={BarChart2} label="数据统计" />
                    <NavItem to="/inspection" icon={ClipboardCheck} label="智能点检" />
                    <NavItem to="/settings" icon={Settings} label="系统设置" />
                </nav>

                {playback?.isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-500 text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Playback Mode
                    </motion.div>
                )}
            </div>

            <div className="flex items-center gap-6">
                {/* System Status Indicators */}
                <div className="hidden md:flex gap-8 border-r border-border dark:border-white/10 pr-8 items-center">
                    <div className="text-right">
                        <span className="block text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">在线小车</span>
                        <span className="font-mono text-xl font-black text-foreground leading-none">{state.carts.length}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">系统完整性</span>
                        <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-mono text-xl font-black bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent leading-none">100%</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        </div>
                    </div>
                    <div className="text-right min-w-[140px]">
                        <span className="block text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60 xl:hidden">时间</span>
                        <span className="hidden xl:block text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                            {formatFullDate(currentTime)}
                        </span>
                        <span className="font-mono text-xl font-black text-foreground dark:text-slate-200 leading-none block mt-0.5">
                            {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                        </span>
                    </div>
                </div>

                {/* User / Authentication Control */}
                {user ? (
                    <div className="flex items-center gap-4 group">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                                {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {user.username}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-60">
                                {user.role === 'admin' ? '系统管理员' : user.role === 'operator' ? '首席操作员' : '外部人员'}
                            </span>
                        </div>

                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-[1px] shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300">
                                <div className="w-full h-full rounded-[10px] bg-background dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                    <span className="text-xs font-black text-sky-500 uppercase">{user.username.substring(0, 2)}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                title="退出当前账户"
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-50 group-hover:scale-100"
                            >
                                <LogOut className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
