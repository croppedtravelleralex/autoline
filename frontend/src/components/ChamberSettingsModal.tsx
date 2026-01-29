import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Settings2,
    Activity,
    Thermometer,
    Zap,
    Wrench,
    Power,
    Package,
    Box,
    Settings as SettingsIcon
} from 'lucide-react';
import type { Chamber, ChamberValves } from '../types';
import { useSystemStateContext } from '../context/SystemStateContext';
import { ChamberTrendChart } from './ChamberTrendChart';
import { cn } from '../lib/utils';

interface ChamberSettingsModalProps {
    chamber: Chamber | null;
    onClose: () => void;
    onSave: (chamberId: string, updates: Partial<Chamber>) => Promise<void>;
}

type TabType = 'CONTROL' | 'CART' | 'MAINTENANCE';

export const ChamberSettingsModal = ({ chamber, onClose }: ChamberSettingsModalProps) => {
    const { state, actions } = useSystemStateContext();
    const [activeTab, setActiveTab] = useState<TabType>('CONTROL');
    const [timeRange, setTimeRange] = useState<'1m' | '1h' | '24h'>('1m');

    // 铟封工艺控制状态
    const [indiumAutoRunning, setIndiumAutoRunning] = useState(false);
    const [indiumStations, setIndiumStations] = useState<boolean[]>([false, false, false, false, false, false, false, false]);

    // 刻度设置
    const [showRangeSettings, setShowRangeSettings] = useState(false);
    const [vacMin, setVacMin] = useState('1e-6');
    const [vacMax, setVacMax] = useState('1e-3');
    const [tempMin, setTempMin] = useState('0');
    const [tempMax, setTempMax] = useState('100');

    // 缩放模式与 X 轴控制
    const [zoomMode, setZoomMode] = useState<'X' | 'Y' | 'BOTH'>('BOTH');
    const [viewSpanSeconds, setViewSpanSeconds] = useState(60); // 当前试图查看的时间跨度 (秒)
    const [timeOffsetSeconds, setTimeOffsetSeconds] = useState(0); // 拖拽产生的时间偏移量 (正值表示向右看更早的数据)
    const RENDER_RESOLUTION = 200; // 固定渲染分辨率，无论跨度多长只画 200 个点

    // 鼠标拖拽相关状态
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; offsetSeconds: number } | null>(null);
    const chartContainerRef = useRef<HTMLElement>(null);

    // 联动系统实时数据 (移到 useEffect 之前以避免 "used before declaration" 错误)
    const liveChamber = useMemo(() => {
        if (!chamber) return null;
        for (const line of state.lines) {
            const chambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
            const found = chambers.find(c => c.id === chamber.id);
            if (found) return { ...found, lineId: line.id };
        }
        return chamber;
    }, [state.lines, chamber?.id]);


    /**
     * 真空度语义配色 - 根据真空度对数值动态计算背景深度
     * 高真空 -> 深邃蓝黑，低真空 -> 浅灰色
     */
    const getVacuumDepthStyle = (pressure: number) => {
        const logP = Math.log10(pressure);
        // 压力范围: 1e-8 (logP=-8) 到 1e-1 (logP=-1)
        const normalized = Math.max(0, Math.min(1, (logP + 8) / 7));

        if (normalized < 0.3) {
            // 高真空 - 深邃蓝黑
            return {
                background: 'linear-gradient(135deg, #050810 0%, #0a1020 100%)',
                shadow: '0 0 20px rgba(14, 165, 233, 0.15)',
                borderColor: 'rgba(14, 165, 233, 0.3)'
            };
        } else if (normalized < 0.6) {
            // 中真空 - 蓝灰渐变
            return {
                background: 'linear-gradient(135deg, #0b1525 0%, #151d30 100%)',
                shadow: '0 0 15px rgba(14, 165, 233, 0.1)',
                borderColor: 'rgba(14, 165, 233, 0.2)'
            };
        } else {
            // 低真空 - 浅灰色
            return {
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                shadow: 'none',
                borderColor: 'rgba(255, 255, 255, 0.1)'
            };
        }
    };

    // 模拟分子泵转速 (0-100%)
    const turboSpeed = liveChamber?.molecularPump ? 85 + Math.sin(Date.now() / 2000) * 10 : 0;

    // 处理鼠标滚轮缩放图表刻度
    const handleWheel = (e: React.WheelEvent) => {
        // 阻止默认滚动行为
        e.preventDefault();

        const zoomSpeed = 0.15;
        const direction = e.deltaY > 0 ? 1 : -1;
        const factor = 1 + direction * zoomSpeed;

        // X 轴缩放 (调整查看的时间跨度 - 无上限)
        if (zoomMode === 'X' || zoomMode === 'BOTH') {
            setViewSpanSeconds(prev => {
                const next = Math.round(prev * factor);
                return Math.max(10, next); // 最小 10 秒
            });
        }

        // Y 轴缩放
        if (zoomMode === 'Y' || zoomMode === 'BOTH') {
            // 真空度缩放 (对数坐标)
            const vMinNum = parseFloat(vacMin);
            const vMaxNum = parseFloat(vacMax);
            if (!isNaN(vMinNum) && !isNaN(vMaxNum)) {
                const logMin = Math.log10(vMinNum);
                const logMax = Math.log10(vMaxNum);
                const midLog = (logMax + logMin) / 2;
                const halfRangeLog = ((logMax - logMin) / 2) * factor;
                const newMin = Math.max(-10, midLog - halfRangeLog);
                const newMax = Math.min(2, midLog + halfRangeLog);
                setVacMin(Math.pow(10, newMin).toExponential(1));
                setVacMax(Math.pow(10, newMax).toExponential(1));
            }

            // 温度缩放 (线性坐标)
            const tMinNum = parseFloat(tempMin);
            const tMaxNum = parseFloat(tempMax);
            if (!isNaN(tMinNum) && !isNaN(tMaxNum)) {
                const midTemp = (tMaxNum + tMinNum) / 2;
                const halfRangeTemp = ((tMaxNum - tMinNum) / 2) * factor;
                const newMin = Math.max(-50, midTemp - halfRangeTemp);
                const newMax = Math.min(500, midTemp + halfRangeTemp);
                setTempMin(newMin.toFixed(0));
                setTempMax(newMax.toFixed(0));
            }
        }
    };

    // 处理鼠标拖拽开始
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // 仅左键触发拖拽
        if (e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offsetSeconds: timeOffsetSeconds
        };
    }, [timeOffsetSeconds]);

    // 处理鼠标拖拽移动
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !dragStartRef.current || !chartContainerRef.current) return;

        const containerWidth = chartContainerRef.current.offsetWidth;
        const deltaX = e.clientX - dragStartRef.current.x;

        // 每拖拽容器宽度的距离，移动 viewSpanSeconds 的时间
        const secondsPerPixel = viewSpanSeconds / containerWidth;
        const deltaSeconds = -deltaX * secondsPerPixel;

        // 更新时间偏移量 (限制不能看到未来的数据)
        const newOffset = dragStartRef.current.offsetSeconds + deltaSeconds;
        setTimeOffsetSeconds(Math.max(0, newOffset));
    }, [isDragging, viewSpanSeconds]);

    // 处理鼠标拖拽结束
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        dragStartRef.current = null;
    }, []);

    // 处理鼠标离开区域
    const handleMouseLeave = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            dragStartRef.current = null;
        }
    }, [isDragging]);

    // 基于时间的平滑波动算法 (非随机)
    const trendData = useMemo(() => {
        if (!liveChamber) return [];
        const now = Date.now();
        const baseVac = liveChamber.highVacPressure;
        const baseTemp = liveChamber.temperature;

        // 无论时间跨度多长，始终渲染 RENDER_RESOLUTION 个点
        // NOTE: timeOffsetSeconds 用于支持拖拽平移历史数据
        const baseTime = now - (timeOffsetSeconds * 1000);
        return Array.from({ length: RENDER_RESOLUTION }).map((_, i) => {
            // 计算每个点在时间轴上的位置
            // i=0 是最左侧 (最旧)，i=RENDER_RESOLUTION-1 是最右侧 (最新)
            const timeOffset = (i - (RENDER_RESOLUTION - 1)) * (viewSpanSeconds * 1000 / RENDER_RESOLUTION);
            const t = (baseTime + timeOffset) / 20000;
            const vacNoise = (Math.sin(t) * 0.1) + (Math.sin(t * 5.3) * 0.02);
            const tempNoise = (Math.cos(t * 0.8) * 0.3) + (Math.sin(t * 4.2) * 0.05);
            const timestamp = new Date(baseTime + timeOffset);
            return {
                time: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`,
                vacuum: baseVac * (1 + vacNoise),
                temp: baseTemp + tempNoise
            };
        });
    }, [liveChamber?.id, state.timestamp, viewSpanSeconds, timeOffsetSeconds]);

    if (!liveChamber) return null;

    const isIndiumSealing = liveChamber.type === 'sealing';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-3xl max-h-[85vh] bg-[#0b0e1b]/80 backdrop-blur-xl border border-sky-500/30 rounded-2xl shadow-[0_0_60px_rgba(14,165,233,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col overflow-hidden"
                >
                    <header className="bg-chamber-header h-10 flex items-center justify-between px-3 shrink-0 relative">
                        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                <Settings2 className="w-5 h-5 text-sky-500" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-sm font-bold text-white tracking-tight">{liveChamber.name} 设备详情</h2>
                                    <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                        ID: {liveChamber.id.split('-').pop()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", liveChamber.state === 'error' ? "bg-red-500" : "bg-emerald-500")} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">系统连接状态: 在线运行中</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                            <nav className="flex bg-white/5 rounded-lg p-0.5 mr-4 border border-white/5">
                                {[
                                    { id: 'CONTROL', label: '设备控制', icon: SettingsIcon },
                                    { id: 'CART', label: '载具分布', icon: Package },
                                    { id: 'MAINTENANCE', label: '维护信息', icon: Wrench }
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={cn("flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold transition-all", activeTab === tab.id ? "bg-sky-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}>
                                        <tab.icon size={12} /> {tab.label}
                                    </button>
                                ))}
                            </nav>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-hidden grid grid-cols-12">
                        <div className={cn(
                            "col-span-12 lg:col-span-7 border-r border-white/5 p-3 flex flex-col gap-3 overflow-y-auto relative transition-all duration-500",
                            liveChamber.molecularPump && "bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent"
                        )}>
                            {/* 分子泵蓝色灯光特效 - 左侧 */}
                            {liveChamber.molecularPump && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-sky-500/20 via-cyan-500/10 to-transparent" />
                                    <div className="absolute top-1/4 left-0 w-24 h-32 bg-sky-400/15 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                                    <div className="absolute bottom-1/3 left-4 w-16 h-16 bg-cyan-400/20 blur-2xl animate-pulse" style={{ animationDuration: '2.5s' }} />
                                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500/0 via-sky-500/60 to-sky-500/0 animate-pulse" />
                                </div>
                            )}
                            <section className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={10} className="text-sky-500" /> 实时环境监测
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                    <div
                                        className="p-2.5 rounded-xl border flex flex-col justify-between h-16 transition-all duration-300"
                                        style={{
                                            background: getVacuumDepthStyle(liveChamber.highVacPressure).background,
                                            boxShadow: getVacuumDepthStyle(liveChamber.highVacPressure).shadow,
                                            borderColor: getVacuumDepthStyle(liveChamber.highVacPressure).borderColor
                                        }}
                                    >
                                        <span className="text-[9px] font-bold text-slate-500">实时真空度 (Pa)</span>
                                        <span className="font-mono-data text-lg text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]">{liveChamber.highVacPressure.toExponential(2)}</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between h-16">
                                        <span className="text-[9px] font-bold text-slate-500">实时温度 (°C)</span>
                                        <div className="flex items-baseline justify-between mt-auto">
                                            <span className="font-mono-data text-lg text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{liveChamber.temperature.toFixed(1)}</span>
                                            <span className="text-[9px] font-bold text-slate-600">目标: {liveChamber.targetTemperature}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section
                                ref={chartContainerRef as React.RefObject<HTMLElement>}
                                className={cn(
                                    "w-full aspect-square max-h-[450px] flex flex-col bg-gradient-to-br from-slate-950/50 to-slate-900/30 rounded-xl border border-white/5 p-3 relative overflow-hidden group/chart shadow-inner select-none",
                                    isDragging ? "cursor-grabbing" : "cursor-grab"
                                )}
                                onWheel={handleWheel}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="absolute top-3 left-3 flex items-center gap-1 px-1 py-0.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-md z-10 opacity-0 group-hover/chart:opacity-100 transition-opacity">
                                    {(['X', 'Y', 'BOTH'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={(e) => { e.stopPropagation(); setZoomMode(mode); }}
                                            className={cn(
                                                "px-1.5 py-0.5 rounded text-[7px] font-black transition-all uppercase",
                                                zoomMode === mode ? "bg-sky-600 text-white" : "text-slate-500 hover:text-white"
                                            )}
                                        >
                                            {mode === 'X' ? '时间' : mode === 'Y' ? '数值' : '双轴'}
                                        </button>
                                    ))}
                                </div>
                                <ChamberTrendChart
                                    data={trendData}
                                    timeRange={timeRange}
                                    onRangeChange={setTimeRange}
                                    vacuumDomain={[parseFloat(vacMin) || 'auto', parseFloat(vacMax) || 'auto']}
                                    tempDomain={[parseFloat(tempMin) || 'auto', parseFloat(tempMax) || 'auto']}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                    <div className="opacity-0 group-hover/chart:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 pointer-events-none">
                                        <div className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                                        <span className="text-[7px] text-slate-400 font-bold">
                                            时间跨度: {(() => {
                                                const totalSeconds = Math.round(viewSpanSeconds);
                                                const hours = Math.floor(totalSeconds / 3600);
                                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                                const seconds = totalSeconds % 60;
                                                if (hours > 0) {
                                                    return `${hours}h${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;
                                                } else if (minutes > 0) {
                                                    return `${minutes}m${seconds.toString().padStart(2, '0')}s`;
                                                }
                                                return `${seconds}s`;
                                            })()} | 模式: {zoomMode === 'X' ? '时间轴' : zoomMode === 'Y' ? '数值轴' : '双轴'}
                                        </span>
                                    </div>
                                    <button onClick={() => setShowRangeSettings(!showRangeSettings)} className="p-1.5 bg-white/5 border border-white/5 rounded-md text-slate-500 hover:text-sky-400 transition-all">
                                        <SettingsIcon size={12} />
                                    </button>
                                    <AnimatePresence>
                                        {showRangeSettings && (
                                            <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full right-0 mb-2 w-48 bg-[#0b0e1b] border border-white/10 p-3 rounded-lg shadow-2xl z-20 space-y-3">
                                                <h5 className="text-[10px] font-black text-slate-500 uppercase">Y 轴刻度范围设置</h5>
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-[9px] text-sky-400 font-bold">真空度 (最小/最大)</label>
                                                        <div className="flex gap-2 mt-1">
                                                            <input value={vacMin} onChange={e => setVacMin(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-white" />
                                                            <input value={vacMax} onChange={e => setVacMax(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-orange-400 font-bold">温度 (最小/最大)</label>
                                                        <div className="flex gap-2 mt-1">
                                                            <input value={tempMin} onChange={e => setTempMin(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-white" />
                                                            <input value={tempMax} onChange={e => setTempMax(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </section>
                        </div>

                        <div className={cn(
                            "col-span-12 lg:col-span-5 p-3 overflow-y-auto space-y-3 relative transition-all duration-500",
                            liveChamber.isHeating && "bg-gradient-to-l from-orange-500/10 via-orange-500/5 to-transparent"
                        )}>
                            {/* 加热橙黄色灯光特效 - 右侧 */}
                            {liveChamber.isHeating && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/20 via-amber-500/10 to-transparent animate-pulse" />
                                    <div className="absolute top-1/4 right-0 w-24 h-32 bg-orange-400/15 blur-3xl animate-pulse" style={{ animationDuration: '2s' }} />
                                    <div className="absolute bottom-1/4 right-4 w-16 h-16 bg-amber-500/20 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                                    <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-500/0 via-amber-500/60 to-amber-500/0 animate-pulse" />
                                </div>
                            )}
                            <section className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-500 tracking-wide">核心动力矩阵</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={cn(
                                        "bg-slate-900/40 border rounded-xl p-2 flex items-center justify-between transition-all duration-300",
                                        liveChamber.molecularPump
                                            ? "border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
                                            : "border-white/5"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border relative overflow-hidden",
                                                liveChamber.molecularPump ? "bg-sky-500/10 border-sky-500/30" : "bg-white/5 border-white/5"
                                            )}>
                                                {/* 脉冲波形环效果 */}
                                                {liveChamber.molecularPump && (
                                                    <>
                                                        <div className="absolute inset-0 rounded-lg border-2 border-sky-400/30 animate-ping" />
                                                        <div className="absolute inset-1 rounded-md border border-sky-400/20 animate-pulse" />
                                                    </>
                                                )}
                                                <Activity className={cn(
                                                    "w-4 h-4 relative z-10",
                                                    liveChamber.molecularPump ? "text-sky-400 animate-spin" : "text-slate-600"
                                                )} style={{ animationDuration: liveChamber.molecularPump ? '2s' : '0s' }} />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-xs font-bold text-slate-200 leading-tight">涡轮分子泵</p>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[10px] text-slate-500 font-medium">状态: {liveChamber.molecularPump ? '运行中' : '已停机'}</p>
                                                    {liveChamber.molecularPump && (
                                                        <span className="text-[10px] font-mono text-sky-400">{turboSpeed.toFixed(0)}%</span>
                                                    )}
                                                </div>
                                                {/* 转速进度条 */}
                                                {liveChamber.molecularPump && (
                                                    <div className="w-16 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-300"
                                                            style={{ width: `${turboSpeed}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => actions.togglePump(liveChamber.lineId as any, liveChamber.id, 'molecular')} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all", liveChamber.molecularPump ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30" : "bg-white/5 text-slate-600 hover:text-slate-400")}>
                                            <Power size={12} />
                                        </button>
                                    </div>
                                    <div className={cn(
                                        "bg-slate-900/40 border rounded-xl p-2.5 flex flex-col gap-2 transition-all duration-300",
                                        liveChamber.isHeating
                                            ? "border-orange-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                            : "border-white/5"
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center border relative overflow-hidden",
                                                    liveChamber.isHeating ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/5"
                                                )}>
                                                    <Thermometer className={cn(
                                                        "w-4 h-4 relative z-10",
                                                        liveChamber.isHeating ? "text-orange-400 animate-pulse" : "text-slate-600"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-200 leading-tight">加热系统</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">状态: {liveChamber.isHeating ? '运行中' : '待机'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newHeating = !liveChamber.isHeating;
                                                    actions.updateChamber(liveChamber.lineId as any, liveChamber.id, {
                                                        isHeating: newHeating,
                                                        heatingMode: newHeating ? 'manual' : 'off'
                                                    });
                                                }}
                                                className={cn(
                                                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                                    liveChamber.isHeating ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "bg-white/5 text-slate-600 hover:text-slate-400"
                                                )}
                                            >
                                                <Power size={12} />
                                            </button>
                                        </div>

                                        {/* 加热模式选择 */}
                                        <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/5">
                                            {[
                                                { id: 'off', label: '关闭' },
                                                { id: 'manual', label: '手动' },
                                                { id: 'program', label: '程序' }
                                            ].map(mode => (
                                                <button
                                                    key={mode.id}
                                                    onClick={() => {
                                                        if (mode.id === 'off') {
                                                            actions.updateChamber(liveChamber.lineId as any, liveChamber.id, { heatingMode: 'off', isHeating: false });
                                                        } else {
                                                            actions.updateChamber(liveChamber.lineId as any, liveChamber.id, { heatingMode: mode.id, isHeating: true });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex-1 py-1 rounded-md text-[10px] font-bold transition-all",
                                                        liveChamber.isHeating && liveChamber.heatingMode === mode.id
                                                            ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                                                            : !liveChamber.isHeating && mode.id === 'off'
                                                                ? "bg-slate-600/20 text-slate-400 border border-slate-500/30"
                                                                : "text-slate-600 hover:text-slate-400 border border-transparent"
                                                    )}
                                                >
                                                    {mode.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {isIndiumSealing && (
                                <section className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                                    <div className="flex items-center gap-2 font-black text-indigo-300 uppercase tracking-[0.2em] text-[10px]">
                                        <Zap size={14} /> 铟封仓核心工艺控制
                                    </div>
                                    <button
                                        onClick={() => setIndiumAutoRunning(!indiumAutoRunning)}
                                        className={cn(
                                            "w-full py-2 text-white rounded-xl font-bold text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]",
                                            indiumAutoRunning
                                                ? "bg-red-600 hover:bg-red-500 shadow-red-900/30"
                                                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30"
                                        )}
                                    >
                                        <Box size={12} />
                                        {indiumAutoRunning ? "停止铟封流水程序" : "启动全自动铟封流水程序"}
                                    </button>
                                    <div className="grid grid-cols-8 gap-1.5">
                                        {indiumStations.map((active, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const newStations = [...indiumStations];
                                                    newStations[i] = !newStations[i];
                                                    setIndiumStations(newStations);
                                                }}
                                                className={cn(
                                                    "py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                    active
                                                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                                                        : "bg-slate-900/50 border-white/5 text-slate-600 hover:text-slate-400 hover:border-white/10"
                                                )}
                                            >
                                                #{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 tracking-wide">高真空阀门组</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'gate_valve' as keyof ChamberValves, label: '进样插板阀' },
                                        { id: 'transfer_valve' as keyof ChamberValves, label: '传样插板阀' },
                                        { id: 'foreline_valve' as keyof ChamberValves, label: '主抽插板阀' },
                                    ].map(v => (
                                        <button key={v.id} onClick={() => actions.toggleValve(liveChamber.lineId as any, liveChamber.id, v.id)} className={cn("valve-control-btn py-1", liveChamber.valves[v.id] === 'open' ? "open" : "")}>
                                            <div className="flex items-center gap-2">
                                                <div className="valve-circle-indicator shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                <span className={cn("text-xs font-bold", liveChamber.valves[v.id] === 'open' ? "text-emerald-400" : "text-slate-500")}>{v.label}</span>
                                            </div>
                                            <div className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold", liveChamber.valves[v.id] === 'open' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-slate-700")}>
                                                {liveChamber.valves[v.id] === 'open' ? '开启' : '关闭'}
                                            </div>
                                        </button>
                                    ))}
                                    <div className="grid grid-cols-2 gap-2 mt-0">
                                        <button onClick={() => actions.toggleValve(liveChamber.lineId as any, liveChamber.id, 'roughing_valve')} className={cn("valve-control-btn py-1", liveChamber.valves.roughing_valve === 'open' ? "open" : "")}>
                                            <span className="text-xs font-bold">粗抽阀</span>
                                            <Power size={10} className={liveChamber.valves.roughing_valve === 'open' ? "text-emerald-400" : "text-slate-700"} />
                                        </button>
                                        <button onClick={() => actions.toggleValve(liveChamber.lineId as any, liveChamber.id, 'vent_valve')} className={cn("valve-control-btn py-1", liveChamber.valves.vent_valve === 'open' ? "open" : "")}>
                                            <span className="text-xs font-bold">放气阀</span>
                                            <Power size={10} className={liveChamber.valves.vent_valve === 'open' ? "text-emerald-400" : "text-slate-700"} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <footer className="h-10 border-t border-white/5 bg-black/40 flex items-center justify-between px-6 shrink-0 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" /> 指挥中心实时同步已开启</span>
                            <span>精密制造控制系统 v4.1</span>
                        </div>
                        <div className="text-slate-700 flex items-center gap-2">
                            智能制造平台
                        </div>
                    </footer>
                </motion.div >
            </div >
        </AnimatePresence >
    );
};
