import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { cn } from '../lib/utils';

interface DataPoint {
    time: string;
    vacuum: number;
    temp: number;
}

interface ChamberTrendChartProps {
    data: DataPoint[];
    timeRange: '1m' | '1h' | '24h';
    onRangeChange: (range: '1m' | '1h' | '24h') => void;
    vacuumDomain?: [number | string, number | string];
    tempDomain?: [number | string, number | string];
}

export const ChamberTrendChart = React.memo(({
    data,
    timeRange,
    onRangeChange,
    vacuumDomain = ['auto', 'auto'],
    tempDomain = ['auto', 'auto']
}: ChamberTrendChartProps) => {
    // ... same content as before but wrapped in memo
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0b0e1b] border border-white/10 p-2.5 rounded-lg shadow-2xl backdrop-blur-md">
                    <p className="text-[9px] font-bold text-slate-500 mb-1.5">{label}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-6 justify-between">
                            <span className="text-[10px] font-bold text-sky-400">真空度</span>
                            <span className="text-[10px] font-mono-data font-bold text-sky-400">{payload[0].value.toExponential(2)} Pa</span>
                        </div>
                        <div className="flex items-center gap-6 justify-between">
                            <span className="text-[10px] font-bold text-orange-400">温度</span>
                            <span className="text-[10px] font-mono-data font-bold text-orange-400">{payload[1].value.toFixed(2)} °C</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">趋势波动轨迹</h3>
                </div>

                <div className="flex items-center gap-0.5 p-0.5 bg-black/30 border border-white/10 rounded-md">
                    {(['1m', '1h', '24h'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => onRangeChange(r)}
                            className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black transition-all",
                                timeRange === r
                                    ? "bg-indigo-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {r === '1m' ? '1分钟' : r === '1h' ? '1小时' : '24小时'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 min-h-[160px] bg-gradient-to-br from-slate-950/60 to-slate-900/40 rounded-xl border border-white/5 overflow-hidden relative group shadow-inner">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(14,165,233,0.03)_0%,transparent_70%)] pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorVacuum" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 7, fill: '#64748b', fontWeight: 600 }}
                            interval="preserveStartEnd"
                            minTickGap={30}
                        />
                        <YAxis
                            yAxisId="left"
                            scale="log"
                            domain={vacuumDomain}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 8, fill: '#0ea5e9', fontWeight: 800, fontFamily: 'JetBrains Mono' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={tempDomain}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 8, fill: '#f97316', fontWeight: 800, fontFamily: 'JetBrains Mono' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="vacuum"
                            stroke="#0ea5e9"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorVacuum)"
                            isAnimationActive={false}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="temp"
                            stroke="#f97316"
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#colorTemp)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none opacity-40">
                    <span className="text-[7px] font-black text-sky-400 uppercase tracking-tighter">真空深度 (Pa)</span>
                    <span className="text-[7px] font-black text-orange-400 uppercase tracking-tighter">实时温度 (°C)</span>
                </div>
            </div>
        </div>
    );
});


