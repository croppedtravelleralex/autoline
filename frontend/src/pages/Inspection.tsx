import React, { useState, useEffect, useMemo } from 'react';
import { useSystemStateContext } from '../context/SystemStateContext';
import {
    Search,
    History,
    CheckCircle2,
    AlertCircle,
    Cpu,
    Zap,
    Wind,
    Star,
    Timer
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { InspectionCard } from '../components/InspectionCard';

type CategoryType = 'ALL' | 'VACUUM' | 'ELECTRONICS' | 'LOGISTICS';

export const Inspection: React.FC = () => {
    const { state } = useSystemStateContext();
    const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnlyAbnormal, setIsOnlyAbnormal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [autoInterval, setAutoInterval] = useState<number>(0);
    const [timeToNext, setTimeToNext] = useState<number>(0);

    // 计算统计数据
    const stats = useMemo(() => {
        const all = state.lines.flatMap(l => [...(l.anodeChambers || []), ...(l.cathodeChambers || [])]);
        const warning = all.filter(c => c.state === 'warning').length;
        const failed = all.filter(c => c.state === 'error').length;
        const passed = all.length - warning - failed;

        return { total: all.length, passed, warning, failed };
    }, [state.lines]);

    // 自动点检定时器逻辑
    useEffect(() => {
        if (autoInterval <= 0) return;

        const timer = setInterval(() => {
            setTimeToNext(prev => {
                if (prev <= 1) {
                    handleInspect();
                    return autoInterval * 60;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [autoInterval]);

    const handleInspect = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
    };

    return (
        <div className="flex h-full bg-[#0a0b1e] text-slate-200 overflow-hidden font-sans">
            {/* 顶层扫描特效 */}
            {isScanning && <div className="inspection-scan-line" />}

            {/* LEFT SIDEBAR: History & Search */}
            <aside className="w-64 border-r border-white/5 bg-[#0d0f26]/80 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-sm font-black flex items-center gap-2 mb-4 tracking-tight">
                        <History size={16} className="text-sky-500" />
                        最近点检历史
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="搜索历史报告..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-1">今天</div>
                    <motion.div
                        whileHover={{ x: 4 }}
                        className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl cursor-not-allowed history-item-hover"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[11px] font-black">手动执行</span>
                            <span className="text-[10px] font-bold text-sky-400">100分</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">21:42</span>
                    </motion.div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0a0b1e]">
                {/* Header Navbar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0f26]/40 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-none text-white">智能点检中心 (Auto-Inspection)</h1>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">全自动设备健康体检与故障预警系统</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* 自动点检控制 */}
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                                <Timer size={14} className="text-indigo-400" />
                                <select
                                    className="bg-transparent text-[11px] font-bold text-slate-300 outline-none cursor-pointer appearance-none"
                                    value={autoInterval}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setAutoInterval(val);
                                        setTimeToNext(val * 60);
                                    }}
                                >
                                    <option value="0" className="bg-[#0d0f26]">手动模式</option>
                                    <option value="1" className="bg-[#0d0f26]">每 1 分钟</option>
                                    <option value="5" className="bg-[#0d0f26]">每 5 分钟</option>
                                    <option value="15" className="bg-[#0d0f26]">每 15 分钟</option>
                                    <option value="60" className="bg-[#0d0f26]">每 1 小时</option>
                                </select>
                            </div>
                            {autoInterval > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Next Scan</span>
                                    <span className="text-[12px] font-mono font-black text-indigo-400 min-w-[36px]">
                                        {Math.floor(timeToNext / 60)}:{(timeToNext % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleInspect}
                            disabled={isScanning}
                            className={cn(
                                "px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 group",
                                isScanning && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Zap size={14} className={cn("group-hover:scale-110 transition-transform", isScanning && "animate-pulse")} />
                            {isScanning ? '点检扫描中...' : '立即执行点检'}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* TOP DASHBOARD CARDS */}
                    <section className="grid grid-cols-12 gap-6 h-48 shrink-0">
                        {/* Health Circle Chart */}
                        <div className="col-span-3 bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="56" cy="56" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                    <circle
                                        cx="56" cy="56" r="45" fill="transparent" stroke="currentColor" strokeWidth="8"
                                        className="text-emerald-500 health-ring-path"
                                        strokeDasharray="283"
                                        strokeDashoffset="0"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white">100</span>
                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">HEALTH</span>
                                </div>
                            </div>
                            <div className="flex-1 ml-6 space-y-3">
                                {['真空', '电控', '物流'].map((item, idx) => (
                                    <div key={item} className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-black text-slate-400">
                                            <span>{item}</span>
                                            <span>100%</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className={cn("h-full", idx === 0 ? "bg-sky-500" : idx === 1 ? "bg-orange-500" : "bg-emerald-500")} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI Diagnostic Summary */}
                        <div className="col-span-6 bg-white/[0.03] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-indigo-500/[0.02] transition-colors">
                            <div className="flex items-start gap-4 h-full">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Cpu className="text-indigo-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        AI DIAGNOSTIC SUMMARY
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                                    </h3>
                                    <p className="text-sm font-medium text-slate-400 leading-relaxed">
                                        当前全线设备运行平稳。真空系统漏率稳定在极低水平，分子泵转速及电控模组温度均在最佳工艺范围内。未检测到任何亚健康或故障倾向。
                                    </p>
                                </div>
                            </div>
                            <Star className="absolute -bottom-4 -right-4 w-24 h-24 text-white/[0.02] -rotate-12" />
                        </div>

                        {/* Summary Stats */}
                        <div className="col-span-3 flex flex-col gap-4">
                            <div className="flex-1 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-emerald-500/[0.08] transition-all">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-white">{stats.passed}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">PASSED</span>
                                </div>
                            </div>
                            <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-50">
                                <div className="p-2 bg-slate-500/10 rounded-xl">
                                    <AlertCircle className="text-slate-400" size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-white">0</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">WARNING</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CATEGORY NAV & TOGGLES */}
                    <section className="flex items-center justify-between sticky top-0 py-2 bg-[#0a0b1e] z-40">
                        <nav className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
                            {(['ALL', 'VACUUM', 'ELECTRONICS', 'LOGISTICS'] as CategoryType[]).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all",
                                        activeCategory === cat
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-500">仅看异常 (Abnormal Only)</span>
                            <div
                                onClick={() => setIsOnlyAbnormal(!isOnlyAbnormal)}
                                className={cn(
                                    "w-10 h-5 rounded-full p-1 cursor-pointer transition-colors duration-300",
                                    isOnlyAbnormal ? "bg-indigo-600" : "bg-slate-800"
                                )}
                            >
                                <motion.div
                                    animate={{ x: isOnlyAbnormal ? 20 : 0 }}
                                    className="w-3 h-3 bg-white rounded-full shadow-sm"
                                />
                            </div>
                        </div>
                    </section>

                    {/* INSPECTION GRIDS AREA */}
                    <div className="space-y-12">
                        {/* Vacuum System Group */}
                        {(activeCategory === 'ALL' || activeCategory === 'VACUUM') && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sky-500 font-bold mb-6">
                                    <Wind size={18} />
                                    <span className="text-sm font-black uppercase tracking-widest">真空系统 (Vacuum)</span>
                                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-[10px]">22</span>
                                </div>
                                <div className="grid grid-cols-6 gap-4">
                                    {state.lines.flatMap(line =>
                                        [...(line.anodeChambers || []), ...(line.cathodeChambers || [])].map((chamber, idx) => (
                                            <InspectionCard
                                                key={chamber.id + idx}
                                                variant="compact"
                                                chamber={chamber}
                                                lineName={`${line.id.replace('line', '')}# 产线`}
                                                metricName="真空度"
                                                metricValue={chamber.highVacPressure.toExponential(1).replace('e', 'E')}
                                                metricUnit="Pa"
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Electronics Group */}
                        {(activeCategory === 'ALL' || activeCategory === 'ELECTRONICS') && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-orange-500 font-bold mb-6">
                                    <Zap size={18} />
                                    <span className="text-sm font-black uppercase tracking-widest">电控系统 (Electronics)</span>
                                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-[10px]">11</span>
                                </div>
                                <div className="grid grid-cols-6 gap-4">
                                    {state.lines.flatMap(line =>
                                        [...(line.anodeChambers || []), ...(line.cathodeChambers || [])].slice(0, 6).map((chamber, idx) => (
                                            <InspectionCard
                                                key={'elec' + chamber.id + idx}
                                                variant="compact"
                                                chamber={chamber}
                                                lineName={`${line.id.replace('line', '')}# 产线`}
                                                metricName="温度控制"
                                                metricValue={chamber.temperature.toFixed(1)}
                                                metricUnit="°C"
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
