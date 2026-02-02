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
    Timer,
    ClipboardList,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { InspectionCard } from '../components/InspectionCard';

type CategoryType = 'ALL' | 'VACUUM' | 'ELECTRONICS' | 'LOGISTICS';

export const Inspection: React.FC = () => {
    const { state, actions, playback, autoInspection } = useSystemStateContext();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnlyAbnormal, setIsOnlyAbnormal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const selectedRecord = useMemo(() => {
        if (!state.inspectionHistory || state.inspectionHistory.length === 0) return null;
        return state.inspectionHistory.find(r => r.id === selectedRecordId) || state.inspectionHistory[0];
    }, [state.inspectionHistory, selectedRecordId]);

    // 计算统计数据
    const stats = useMemo(() => {
        const all = state.lines.flatMap(l => [...(l.anodeChambers || []), ...(l.cathodeChambers || [])]);
        const warning = all.filter(c => c.state === 'warning').length;
        const failed = all.filter(c => c.state === 'error').length;
        const passed = all.length - warning - failed;

        return { total: all.length, passed, warning, failed };
    }, [state.lines]);

    // 自动点检已移至全局 SystemStateContext，此处仅需读取 autoInspection 状态

    const handleInspect = async () => {
        setIsScanning(true);
        try {
            const newRecord = await actions.triggerInspection('manual');
            if (newRecord) {
                setSelectedRecordId(newRecord.id);
                await actions.setPlaybackTime('all', newRecord.timestamp / 1000);
            }
        } catch (error) {
            console.error("Inspection failed:", error);
        } finally {
            setTimeout(() => setIsScanning(false), 2000);
        }
    };

    const handleSelectRecord = async (record: any) => {
        setSelectedRecordId(record.id);
        await actions.setPlaybackTime('all', record.timestamp / 1000);
    };

    return (
        <div className="flex h-full bg-[#0a0b1e] text-slate-200 overflow-hidden font-sans">
            {isScanning && <div className="inspection-scan-line" />}

            {/* LEFT SIDEBAR: History & Search - 移动端隐藏 */}
            <aside className="hidden md:flex w-64 border-r border-white/5 bg-[#0d0f26]/80 flex-col shrink-0">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-sm font-black flex items-center gap-2 mb-4 tracking-tight text-white">
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
                            className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-1">历史记录</div>
                    {state.inspectionHistory?.length > 0 ? (
                        state.inspectionHistory.map((record) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ x: 4 }}
                                onClick={() => handleSelectRecord(record)}
                                className={cn(
                                    "p-3 border rounded-xl cursor-pointer transition-all group relative overflow-hidden",
                                    (selectedRecordId === record.id || (!selectedRecordId && state.inspectionHistory?.[0]?.id === record.id))
                                        ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
                                        : "bg-white/5 border-white/5 hover:bg-white/10",
                                    isScanning && "opacity-50 pointer-events-none"
                                )}
                            >
                                {(selectedRecordId === record.id || (!selectedRecordId && state.inspectionHistory?.[0]?.id === record.id)) && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                )}
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[11px] font-black">{record.type === 'manual' ? '手动执行' : '自动执行'}</span>
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        record.status === 'passed' ? "text-emerald-400" : record.status === 'warning' ? "text-amber-400" : "text-rose-400"
                                    )}>{record.score.toFixed(1)}分</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-medium font-mono">
                                        {new Date(record.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    {playback?.isActive && (selectedRecordId === record.id || (!selectedRecordId && state.inspectionHistory?.[0]?.id === record.id)) && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">历史回顾中</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-600">暂无记录</div>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0a0b1e]">
                <header className="min-h-[4rem] border-b border-white/5 flex flex-wrap items-center justify-between px-3 md:px-6 py-2 gap-2 bg-[#0d0f26]/40 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-lg font-black tracking-tight leading-none text-white">智能点检中心</h1>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter hidden sm:block">全自动设备健康体检与故障预警系统</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-6">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                                <Timer size={14} className="text-indigo-400" />
                                <select
                                    className="bg-transparent text-[11px] font-bold text-slate-300 outline-none cursor-pointer appearance-none"
                                    value={autoInspection.interval}
                                    onChange={(e) => autoInspection.setInterval(Number(e.target.value))}
                                >
                                    <option value="0" className="bg-[#0d0f26]">手动模式</option>
                                    <option value="1" className="bg-[#0d0f26]">每 1 分钟</option>
                                    <option value="5" className="bg-[#0d0f26]">每 5 分钟</option>
                                    <option value="15" className="bg-[#0d0f26]">每 15 分钟</option>
                                    <option value="60" className="bg-[#0d0f26]">每 1 小时</option>
                                </select>
                            </div>
                            {autoInspection.interval > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">下次点检</span>
                                    <span className="text-[12px] font-mono font-black text-indigo-400 min-w-[36px]">
                                        {Math.floor(autoInspection.timeToNext / 60)}:{(autoInspection.timeToNext % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {playback?.isActive && (
                            <button
                                onClick={() => {
                                    actions.setPlaybackMode(false);
                                    setSelectedRecordId(null);
                                    actions.refreshState();
                                }}
                                className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black rounded-lg border border-rose-500/20 transition-all flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                退出回放/查看实时
                            </button>
                        )}
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

                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
                    {/* TOP DASHBOARD CARDS - 移动端垂直堆叠 */}
                    <section className="flex flex-col gap-4 md:grid md:grid-cols-12 md:gap-6 md:h-48 shrink-0">
                        <div className="md:col-span-3 bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="56" cy="56" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                    <circle
                                        cx="56" cy="56" r="45" fill="transparent" stroke="currentColor" strokeWidth="8"
                                        className={cn(
                                            "transition-all duration-1000",
                                            selectedRecord?.status === 'passed' ? "text-emerald-500" : selectedRecord?.status === 'warning' ? "text-amber-500" : "text-rose-500"
                                        )}
                                        strokeDasharray="283"
                                        strokeDashoffset={283 - (283 * (selectedRecord?.score || 100) / 100)}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={cn(
                                        "text-3xl font-black text-white transition-opacity",
                                        isScanning && "opacity-20"
                                    )}>
                                        {isScanning ? "..." : (selectedRecord?.score || 100).toFixed(1)}
                                    </span>
                                    <span className={cn(
                                        "text-[8px] font-bold uppercase tracking-widest transition-opacity",
                                        isScanning ? "text-indigo-400 opacity-100" : (selectedRecord?.status === 'passed' ? "text-emerald-500" : selectedRecord?.status === 'warning' ? "text-amber-500" : "text-rose-500")
                                    )}>
                                        {isScanning ? "分析中" : "健康评分"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 ml-6 space-y-3">
                                {['真空', '电控', '物流'].map((item, idx) => {
                                    const score = idx === 0
                                        ? (selectedRecord?.vacuum_score ?? 100)
                                        : idx === 1
                                            ? (selectedRecord?.electronics_score ?? 100)
                                            : (selectedRecord?.logistics_score ?? 100);
                                    return (
                                        <div key={item} className="space-y-1">
                                            <div className="flex justify-between text-[9px] font-black text-slate-400">
                                                <span>{item}</span>
                                                <span>{(score).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${score}%` }}
                                                    className={cn("h-full transition-all duration-1000", idx === 0 ? "bg-sky-500" : idx === 1 ? "bg-orange-500" : "bg-emerald-500")}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Diagnostic Detailed Report */}
                        <div className="md:col-span-6 bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-colors flex gap-3 md:gap-5">
                            <div className="p-3 bg-sky-500/10 rounded-xl h-fit border border-sky-500/10 shrink-0">
                                <ClipboardList className="text-sky-400" size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    检测结果详报
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                                </h3>

                                {/* 结构化异常展示 */}
                                <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                                    {selectedRecord?.summary ? (
                                        // 解析 summary 文本，每行一个异常
                                        selectedRecord.summary.split('\n').filter(Boolean).map((line, idx) => {
                                            // 判断是否为标题行
                                            if (line.includes('【') && line.includes('】')) {
                                                return (
                                                    <div key={idx} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                                                        {line}
                                                    </div>
                                                );
                                            }
                                            // 普通异常条目
                                            const isError = line.includes('过高') || line.includes('异常') || line.includes('错误');
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors",
                                                        isError
                                                            ? "bg-red-500/10 border-red-500/20 text-red-300"
                                                            : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                                    )}
                                                >
                                                    <AlertCircle size={12} className={isError ? "text-red-400" : "text-amber-400"} />
                                                    <span className="text-[11px] font-medium truncate">{line}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        // 无异常状态
                                        <div className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                            <span className="text-[11px] font-bold text-emerald-300">所有设备运行正常，未检测到异常</span>
                                        </div>
                                    )}
                                </div>

                                {playback?.isActive && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="mt-4 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-black rounded-lg border border-sky-500/10 transition-all flex items-center gap-2"
                                    >
                                        <FileText size={12} />
                                        追溯至主看板查看当时全线细节
                                    </button>
                                )}
                            </div>
                            <Star className="absolute -bottom-4 -right-4 w-20 h-20 text-white/[0.02] -rotate-12" />
                        </div>

                        {/* Summary Stats - 移动端横向排列 */}
                        <div className="md:col-span-3 flex flex-row md:flex-col gap-3 md:gap-4">
                            <div className="flex-1 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-emerald-500/[0.08] transition-all">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-white">{stats.passed}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">通过</span>
                                </div>
                            </div>
                            <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-50">
                                <div className="p-2 bg-slate-500/10 rounded-xl">
                                    <AlertCircle className="text-slate-400" size={20} />
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-black text-white">{stats.warning + stats.failed}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">异常</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CATEGORY NAV & TOGGLES - 移动端横向滚动 */}
                    <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 py-2 gap-2 bg-[#0a0b1e] z-40">
                        <nav className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl overflow-x-auto max-w-full scrollbar-none">
                            {[
                                { id: 'ALL', label: '全部' },
                                { id: 'VACUUM', label: '真空系统' },
                                { id: 'ELECTRONICS', label: '电控系统' },
                                { id: 'LOGISTICS', label: '物流运输' }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id as CategoryType)}
                                    className={cn(
                                        "px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all",
                                        activeCategory === cat.id
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-500">仅看异常</span>
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
                    <div className="space-y-8">
                        {/* Vacuum System Group */}
                        {(activeCategory === 'ALL' || activeCategory === 'VACUUM') && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-sky-500 font-bold mb-2">
                                    <Wind size={18} />
                                    <span className="text-sm font-black uppercase tracking-widest">真空系统监控</span>
                                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-[10px]">
                                        {state.lines.reduce((acc, l) => acc + (l.anodeChambers?.length || 0) + (l.cathodeChambers?.length || 0), 0)}
                                    </span>
                                </div>

                                {state.lines.map(line => (
                                    <div key={'vac-line-' + line.id} className="space-y-3 bg-white/[0.01] p-3 rounded-3xl border border-white/[0.02]">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {line.name} 产线监控
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2">
                                            {[...(line.anodeChambers || []), ...(line.cathodeChambers || [])].map((chamber, idx) => (
                                                <InspectionCard
                                                    key={'vac-' + chamber.id + idx}
                                                    variant="compact"
                                                    chamber={chamber}
                                                    lineName={line.name}
                                                    metricName="真空度"
                                                    metricValue={chamber.highVacPressure.toExponential(1)}
                                                    metricUnit="Pa"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Electronics Group */}
                        {(activeCategory === 'ALL' || activeCategory === 'ELECTRONICS') && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
                                    <Zap size={18} />
                                    <span className="text-sm font-black uppercase tracking-widest">电控系统监控</span>
                                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-[10px]">
                                        {state.lines.reduce((acc, l) => acc + (l.anodeChambers?.length || 0) + (l.cathodeChambers?.length || 0), 0)}
                                    </span>
                                </div>

                                {state.lines.map(line => (
                                    <div key={'elec-line-' + line.id} className="space-y-3 bg-white/[0.01] p-3 rounded-3xl border border-white/[0.02]">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {line.name} 产线监控
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2">
                                            {[...(line.anodeChambers || []), ...(line.cathodeChambers || [])].map((chamber, idx) => (
                                                <InspectionCard
                                                    key={'elec-' + chamber.id + idx}
                                                    variant="compact"
                                                    chamber={chamber}
                                                    lineName={line.name}
                                                    metricName="控制温度"
                                                    metricValue={chamber.temperature.toFixed(1)}
                                                    metricUnit="°C"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
