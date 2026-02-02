import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import type { Cart, LineData, Chamber } from '../types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TimeRangeSelector, type TimeRange } from './TimeRangeSelector';
import { fetchCartHistory, type HistoryDataPoint } from '../api/history';
import { ChevronDown, Check, Square, CheckSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface MESHistoryChartProps {
    lines: LineData[];
    carts?: Cart[];
}

const COLORS = [
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Rose
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
];

export function MESHistoryChart({ lines }: MESHistoryChartProps) {
    const [historyDataMap, setHistoryDataMap] = useState<Record<string, HistoryDataPoint[]>>({});

    // Selection state
    const [selectedLineId, setSelectedLineId] = useState<string>('');
    const [selectedChamberIds, setSelectedChamberIds] = useState<string[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'vacuum'>('temperature');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // React 18: Use deferred value for the selected IDs to keep UI responsive
    const deferredChamberIds = useDeferredValue(selectedChamberIds);
    const deferredMetric = useDeferredValue(selectedMetric);

    const [timeRange, setTimeRange] = useState<{ start: number; end: number; type: TimeRange }>({
        start: Date.now() / 1000 - 3600,
        end: Date.now() / 1000,
        type: '1h'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-select first line and its first chamber initially
    useEffect(() => {
        if (lines.length > 0 && !selectedLineId) {
            setSelectedLineId(lines[0].id);
            const firstLineChambers = [...(lines[0].anodeChambers || []), ...(lines[0].cathodeChambers || [])];
            if (firstLineChambers.length > 0) {
                setSelectedChamberIds([firstLineChambers[0].id]);
            }
        }
    }, [lines, selectedLineId]);

    // Fetch history for all selected chambers
    useEffect(() => {
        if (deferredChamberIds.length === 0) {
            setHistoryDataMap({});
            return;
        }

        const loadAllHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const results = await Promise.all(
                    deferredChamberIds.map(async (id) => {
                        const data = await fetchCartHistory(
                            id,
                            deferredMetric,
                            timeRange.start,
                            timeRange.end
                        );
                        return { id, data };
                    })
                );

                const newMap: Record<string, HistoryDataPoint[]> = {};
                results.forEach(res => {
                    newMap[res.id] = res.data;
                });
                setHistoryDataMap(newMap);
            } catch (err) {
                console.error('Failed to load history data:', err);
                setError('部分或全部数据加载失败');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(loadAllHistory, 50); // Small debounce
        return () => clearTimeout(timer);
    }, [deferredChamberIds, deferredMetric, timeRange]);

    const currentLine = lines.find(l => l.id === selectedLineId);
    const availableChambers = useMemo(() => {
        return currentLine
            ? [...(currentLine.anodeChambers || []), ...(currentLine.cathodeChambers || [])]
            : [];
    }, [currentLine]);

    // OPTIMIZED: Data Merging for Recharts
    const chartData = useMemo(() => {
        // 1. Create specialized lookup maps for O(1) matching
        const pointMaps: Record<string, Map<number, number>> = {};
        const timestampsSet = new Set<number>();

        Object.entries(historyDataMap).forEach(([cid, points]) => {
            const m = new Map<number, number>();
            points.forEach(p => {
                const tsInt = Math.floor(p.timestamp);
                m.set(tsInt, p.value);
                timestampsSet.add(tsInt);
            });
            pointMaps[cid] = m;
        });

        // 2. Sort timestamps
        const sortedTimestamps = Array.from(timestampsSet).sort((a, b) => a - b);

        // 3. Dynamic Decimation based on number of curves
        // More curves = Fewer points per curve to maintain smooth SVG rendering
        const curveCount = Object.keys(historyDataMap).length;
        const totalMaxPoints = 1200;
        const targetPoints = Math.max(300, Math.floor(totalMaxPoints / Math.max(1, curveCount / 2)));

        let finalTimestamps = sortedTimestamps;
        if (sortedTimestamps.length > targetPoints) {
            const step = Math.ceil(sortedTimestamps.length / targetPoints);
            finalTimestamps = sortedTimestamps.filter((_, i) => i % step === 0);
        }

        // 4. Build objects with O(1) lookups
        return finalTimestamps.map(ts => {
            const entry: any = { timestamp: ts };
            Object.entries(pointMaps).forEach(([cid, m]) => {
                const val = m.get(ts);
                if (val !== undefined) entry[cid] = val;
            });
            return entry;
        });
    }, [historyDataMap]);

    // Use deferred value for chart data to prioritize input interaction
    const deferredChartData = useDeferredValue(chartData);

    const handleToggleChamber = (id: string) => {
        setSelectedChamberIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const allIds = availableChambers.map(c => c.id);
        setSelectedChamberIds(allIds);
    };

    const handleClearAll = () => {
        setSelectedChamberIds([]);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatYAxis = (value: number) => {
        if (deferredMetric === 'vacuum') return value.toExponential(1);
        return value.toFixed(1);
    };

    return (
        <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-4 h-full overflow-hidden flex flex-col gap-4">
            <h2 className="text-cyan-400 text-lg font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    历史趋势图 (性能增强版)
                </div>
                {loading && <div className="text-xs text-cyan-400/50 animate-pulse font-normal">同步加载中...</div>}
            </h2>

            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <TimeRangeSelector onTimeRangeChange={(s, e, t) => setTimeRange({ start: s, end: e, type: t })} />
                </div>

                <div className="flex items-center gap-4 bg-gray-950/50 p-2 rounded border border-gray-800 z-50">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">线体:</span>
                        <select
                            value={selectedLineId}
                            onChange={(e) => {
                                setSelectedLineId(e.target.value);
                                setSelectedChamberIds([]);
                            }}
                            className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm border border-gray-700 outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                            {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 bg-gray-800 text-white px-4 py-1.5 rounded text-sm border border-gray-700 hover:border-cyan-500 transition-all min-w-[200px] justify-between"
                        >
                            <span>
                                {selectedChamberIds.length === 0 ? '选择对比腔体' : `已选 ${selectedChamberIds.length} 个腔体`}
                            </span>
                            <ChevronDown size={14} className={cn("transition-transform", isDropdownOpen && "rotate-180")} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-gray-700">
                                        <button onClick={handleSelectAll} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold">全选</button>
                                        <button onClick={handleClearAll} className="text-[10px] text-rose-400 hover:text-rose-300 font-bold">清空</button>
                                    </div>
                                    {availableChambers.map(chamber => (
                                        <div
                                            key={chamber.id}
                                            onClick={() => handleToggleChamber(chamber.id)}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-md cursor-pointer transition-colors"
                                        >
                                            {selectedChamberIds.includes(chamber.id)
                                                ? <CheckSquare size={14} className="text-cyan-500" />
                                                : <Square size={14} className="text-gray-600" />
                                            }
                                            <span className={cn("text-xs", selectedChamberIds.includes(chamber.id) ? "text-white font-bold" : "text-gray-400")}>
                                                {chamber.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-1 ml-auto">
                        {(['temperature', 'vacuum'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setSelectedMetric(m)}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-black transition-all",
                                    selectedMetric === m ? "bg-cyan-600 text-white shadow-lg" : "bg-gray-800 text-gray-500 hover:text-gray-300"
                                )}
                            >
                                {m === 'temperature' ? '控制温度' : '极限真空'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-black/20 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                {selectedChamberIds.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                        <div className="p-4 rounded-full bg-white/5 border border-white/5">
                            <CheckSquare size={48} className="opacity-20" />
                        </div>
                        <p className="font-bold text-sm tracking-widest uppercase">请勾选需要对比的腔体曲线</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={deferredChartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatTime}
                                stroke="#525252"
                                style={{ fontSize: '10px', fontWeight: 'bold' }}
                                minTickGap={60}
                            />
                            <YAxis
                                tickFormatter={formatYAxis}
                                stroke="#525252"
                                style={{ fontSize: '10px', fontWeight: 'bold' }}
                                domain={deferredMetric === 'vacuum' ? ['auto', 'auto'] : [0, 'auto']}
                                scale={deferredMetric === 'vacuum' ? 'log' : 'auto'}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(10, 11, 30, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)', padding: '12px' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '1px 0' }}
                                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}
                                labelFormatter={(ts) => `时间点: ${new Date(ts * 1000).toLocaleString()}`}
                                formatter={(val: any, name?: string) => [formatYAxis(val), availableChambers.find(c => c.id === (name || ""))?.name || (name || "未知")]}
                            />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                            {deferredChamberIds.map((cid, idx) => (
                                <Line
                                    key={cid}
                                    type="monotone"
                                    dataKey={cid}
                                    name={availableChambers.find(c => c.id === cid)?.name || cid}
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                    isAnimationActive={false}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
                {deferredChartData !== chartData && (
                    <div className="absolute bottom-4 right-4 text-[8px] bg-sky-500/20 text-sky-400 px-2 py-1 rounded font-black italic animate-pulse">
                        RENDER DEFERRED
                    </div>
                )}
            </div>
        </div>
    );
}
