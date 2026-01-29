import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Activity, Shield, Users, Settings, User, Lock, Crown } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
    const navigate = useNavigate();
    const { login } = useUser();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (u: string, p: string) => {
        setIsLoading(true);
        setError('');
        try {
            await login(u, p);
            navigate('/');
        } catch (err) {
            setError('登录失败：用户名或密码错误');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleLogin(username, password);
    };

    const QuickLoginCard = ({ role, name, user, pass, icon: Icon, colorClass, borderClass, bgClass, isVip }: any) => (
        <button
            type="button"
            onClick={() => handleLogin(user, pass)}
            className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden",
                "bg-slate-900/40 hover:bg-slate-800/60 w-full",
                borderClass,
                isVip && "border-amber-500/30 hover:border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            )}
        >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity", bgClass, isVip && "bg-amber-500")} />
            <Icon className={cn("w-5 h-5 mb-1.5 transition-colors", colorClass, isVip && "text-amber-500")} />
            <span className={cn("text-xs font-bold text-slate-200 group-hover:text-white", isVip && "text-amber-200")}>{name}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 group-hover:text-slate-400">{role}</span>
        </button>
    );

    return (
        <div className="h-screen w-screen bg-[#0a0f18] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
                {/* Header Icon */}
                <div className="relative mb-8">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-2xl relative">
                        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-pulse scale-110" />
                        <Activity className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                {/* Title Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        真空产线智能监控系统
                    </h1>
                    <p className="text-slate-400 text-sm">请登录以访问控制台</p>
                </div>

                {/* Login Form Card */}
                <div className="w-full space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1">用户名</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="请输入用户名"
                                    className="w-full bg-[#161d2b] border border-slate-800 hover:border-slate-700 focus:border-blue-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 outline-none transition-all focus:ring-1 focus:ring-blue-600/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 ml-1">密码</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-blue-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="请输入密码"
                                    className="w-full bg-[#161d2b] border border-slate-800 hover:border-slate-700 focus:border-blue-600 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 outline-none transition-all focus:ring-1 focus:ring-blue-600/50"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs text-center font-medium bg-red-500/10 py-2.5 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {isLoading ? '登录中...' : '登录系统'}
                        </button>
                    </form>

                    {/* Quick Login Section */}
                    <div className="pt-6 border-t border-slate-800/60">
                        <div className="flex items-center justify-center mb-5">
                            <div className="h-px bg-slate-800 flex-1" />
                            <span className="px-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">测试账号提示</span>
                            <div className="h-px bg-slate-800 flex-1" />
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <QuickLoginCard
                                name="员工"
                                role="staff"
                                user="observer"
                                pass="123456"
                                icon={Users}
                                colorClass="text-emerald-500"
                                bgClass="bg-emerald-500"
                                borderClass="border-slate-800"
                            />
                            <QuickLoginCard
                                name="操作员"
                                role="op"
                                user="operator"
                                pass="123456"
                                icon={Settings}
                                colorClass="text-sky-500"
                                bgClass="bg-sky-500"
                                borderClass="border-slate-800"
                            />
                            <QuickLoginCard
                                name="管理员"
                                role="admin"
                                user="admin"
                                pass="123456"
                                icon={Shield}
                                colorClass="text-rose-500"
                                bgClass="bg-rose-500"
                                borderClass="border-slate-800"
                            />
                            <QuickLoginCard
                                name="超管"
                                role="superadmin"
                                user="admin"
                                pass="123456"
                                icon={Crown}
                                isVip={true}
                                colorClass="text-amber-500"
                                bgClass="bg-amber-500"
                                borderClass="border-amber-500/20"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

