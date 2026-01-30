import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Calendar, X } from 'lucide-react';
import { fetchSnapshotRange, fetchEvents } from '../services/api';
import { useSystemStateContext } from '../context/SystemStateContext';
import { cn } from '../lib/utils';

interface LinePlaybackPanelProps {
    lineId: string;
    lineName: string;
    onClose: () => void;
}

// 时段快捷按钮配置
const TIME_PRESETS = [
    { label: '早班', startHour: 6, endHour: 12, shortLabel: '早班 (06:00)' },
    { label: '午休', startHour: 12, endHour: 14, shortLabel: '午休 (12:00)' },
    { label: '晚班', startHour: 20, endHour: 24, shortLabel: '晚班 (20:00)' },
    { label: '零点', startHour: 0, endHour: 6, shortLabel: '零点 (00:00)' },
];

// 播放速度配置
const SPEED_OPTIONS = [
    { label: '1x', value: 1 },
    { label: '10x', value: 10 },
    { label: '60x', value: 60 },
    { label: 'MAX', value: 300 },
];

export const LinePlaybackPanel = ({ lineId, lineName, onClose }: LinePlaybackPanelProps) => {
    const { actions } = useSystemStateContext();

    // 时间范围
    const [range, setRange] = useState<{ start: number; end: number } | null>(null);
    // 当前回放时间
    const [currentTime, setCurrentTime] = useState<number>(Date.now() / 1000);
    // 选择的日期
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    });
    // 播放速度
    const [playSpeed, setPlaySpeed] = useState<number>(1);
    // 是否正在播放
    const [isPlaying, setIsPlaying] = useState(false);
    // 防抖定时器
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 播放定时器
    const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // 历史操作事件
    const [events, setEvents] = useState<any[]>([]);
    // 当前时间点对应的操作描述
    const [currentOp, setCurrentOp] = useState<string | null>(null);
    // 上次执行 API 同步的时间戳，用于节流
    const lastSyncTimeRef = useRef<number>(0);

    // 周期性获取最新的时间范围和事件
    const refreshData = useCallback(async () => {
        try {
            // 获取最新全量范围
            const r = await fetchSnapshotRange();
            if (r.start && r.end) {
                setRange({ start: r.start, end: r.end });
            }

            // 计算当前选择日期的 00:00 和 23:59
            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(selectedDate);
            dayEnd.setHours(23, 59, 59, 999);

            const startTimestamp = dayStart.getTime() / 1000;
            const endTimestamp = dayEnd.getTime() / 1000;

            // 获取该日期全天的事件
            const evs = await fetchEvents(startTimestamp, endTimestamp);
            if (Array.isArray(evs)) {
                setEvents(evs.filter(e => e.line_id === lineId || !e.line_id));
            } else {
                setEvents([]);
            }
        } catch (e) {
            console.error('Failed to sync playback data:', e);
        }
    }, [lineId, selectedDate]);

    // 初始加载和周期性轮询 (2秒一次，增加实时性)
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 2000);
        return () => clearInterval(interval);
    }, [refreshData]);

    // 初始化时间并立即加载快照 (仅在首次加载且 range 产生时)
    const initializedRef = useRef(false);
    useEffect(() => {
        if (range && !initializedRef.current) {
            const initTime = range.end;
            setCurrentTime(initTime);
            // 关键：立即触发快照加载，将历史数据写入 playbackSnapshots
            actions.setPlaybackTime(lineId, initTime);
            initializedRef.current = true;
        }
    }, [range, lineId, actions]);

    // 自动播放逻辑
    useEffect(() => {
        if (isPlaying && range) {
            playIntervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + playSpeed;
                    if (next >= range.end) {
                        setIsPlaying(false);
                        return range.end;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, [isPlaying, playSpeed, range]);

    // 当 currentTime 变化时，使用节流 (Throttle) 同步 API 和查找操作
    useEffect(() => {
        const now = Date.now();
        const syncInterval = 80; // 80ms 节流，兼顾性能与流畅度

        const performSync = () => {
            actions.setPlaybackTime(lineId, currentTime);
            lastSyncTimeRef.current = Date.now();

            // 查找并显示最近的操作
            const recentOp = [...events]
                .sort((a, b) => b.timestamp - a.timestamp)
                .find(e => e.timestamp <= currentTime && e.timestamp > currentTime - 5);

            if (recentOp) {
                setCurrentOp(`${recentOp.operator_name}: ${recentOp.description}`);
            } else {
                setCurrentOp(null);
            }
        };

        if (now - lastSyncTimeRef.current >= syncInterval) {
            // 达到间隔，立即执行
            performSync();
        } else {
            // 未达到间隔，使用定时器在剩余时间后执行
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(performSync, syncInterval - (now - lastSyncTimeRef.current));
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [currentTime, lineId, actions, events]);

    // 格式化时间显示
    const formatTime = (ts: number): string => {
        const date = new Date(ts * 1000);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };



    // 滑块变化处理
    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setCurrentTime(value);
        setIsPlaying(false);
    }, []);

    // 时段快捷跳转
    const handlePresetClick = (preset: typeof TIME_PRESETS[0]) => {
        if (!range) return;

        // 基于选择的日期计算目标时间
        const dateObj = new Date(selectedDate);
        dateObj.setHours(preset.startHour, 0, 0, 0);
        const targetTime = dateObj.getTime() / 1000;

        // 确保在范围内
        const clampedTime = Math.max(range.start, Math.min(range.end, targetTime));
        setCurrentTime(clampedTime);
        setIsPlaying(false);
    };

    // 日期变化处理
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
        // 跳转到该日期的开始时间
        const dateObj = new Date(e.target.value);
        dateObj.setHours(0, 0, 0, 0);
        if (range) {
            const targetTime = Math.max(range.start, Math.min(range.end, dateObj.getTime() / 1000));
            setCurrentTime(targetTime);
        }
    };

    // 退出回放
    const handleExit = () => {
        setIsPlaying(false);
        actions.setPlaybackTime(lineId, range?.end || Date.now() / 1000);
        onClose();
    };

    // 计算滑块逻辑范围（显示 00:00 - 24:00）
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sliderMin = dayStart.getTime() / 1000;
    const sliderMax = dayEnd.getTime() / 1000;

    // 计算滑块进度百分比
    const progressPercent = ((currentTime - sliderMin) / (sliderMax - sliderMin)) * 100;

    if (!range) {
        return (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-slate-900/80 backdrop-blur-lg border border-amber-500/30 rounded-xl p-4 mt-3">
                    <div className="flex items-center justify-center gap-2 text-amber-500/60">
                        <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        <span className="text-sm">加载历史数据...</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
        >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-xl mt-3 shadow-2xl shadow-amber-900/20">
                {/* 顶部栏 */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-amber-500/10">
                    <div className="flex items-center gap-3">
                        {/* 模式标签 */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500 rounded-lg">
                            <Play className="w-3.5 h-3.5 text-slate-900" fill="currentColor" />
                            <span className="text-xs font-bold text-slate-900 tracking-wide">历史回溯模式</span>
                        </div>

                        {/* 日期选择 */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 border border-white/10 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="bg-transparent text-xs text-slate-300 font-mono outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 播放速度选择 */}
                        <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-white/5">
                            {SPEED_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPlaySpeed(opt.value)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer",
                                        playSpeed === opt.value
                                            ? "bg-sky-500 text-white shadow-lg shadow-sky-900/50"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* 退出按钮 */}
                        <button
                            onClick={handleExit}
                            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">退出回放</span>
                        </button>
                    </div>
                </div>

                {/* 控制栏 */}
                <div className="px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* 播放/暂停按钮 */}
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer",
                                isPlaying
                                    ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/50"
                                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 hover:bg-emerald-400"
                            )}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5" fill="currentColor" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                            )}
                        </button>

                        {/* 时段快捷按钮 */}
                        <div className="flex items-center gap-1.5">
                            {TIME_PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetClick(preset)}
                                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 border border-white/5 rounded text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-medium"
                                    title={preset.shortLabel}
                                >
                                    {preset.label} ({String(preset.startHour).padStart(2, '0')}:00)
                                </button>
                            ))}
                        </div>

                        {/* 时间滑块区域 */}
                        <div className="flex-1 flex items-center gap-4">
                            <div className="flex-1 relative">
                                {/* 滑块轨道背景 */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-700 rounded-full" />

                                {/* 已播放进度 */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-100"
                                    style={{ width: `${progressPercent}%` }}
                                />

                                {/* 操作事件标记点 */}
                                {events.map((ev, idx) => {
                                    const pos = ((ev.timestamp - sliderMin) / (sliderMax - sliderMin)) * 100;
                                    if (pos < 0 || pos > 100) return null;
                                    return (
                                        <div
                                            key={idx}
                                            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-400 rounded-full border border-sky-200 z-[5] pointer-events-none shadow-[0_0_5px_rgba(56,189,248,0.8)]"
                                            style={{ left: `${pos}%` }}
                                        />
                                    );
                                })}

                                {/* 滑块输入 */}
                                <input
                                    type="range"
                                    min={sliderMin}
                                    max={sliderMax}
                                    step={1}
                                    value={currentTime}
                                    onChange={handleSliderChange}
                                    className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-4
                                        [&::-webkit-slider-thumb]:h-4
                                        [&::-webkit-slider-thumb]:bg-white
                                        [&::-webkit-slider-thumb]:rounded-full
                                        [&::-webkit-slider-thumb]:border-2
                                        [&::-webkit-slider-thumb]:border-amber-500
                                        [&::-webkit-slider-thumb]:shadow-lg
                                        [&::-webkit-slider-thumb]:cursor-grab
                                        [&::-webkit-slider-thumb]:active:cursor-grabbing
                                        [&::-moz-range-thumb]:w-4
                                        [&::-moz-range-thumb]:h-4
                                        [&::-moz-range-thumb]:bg-white
                                        [&::-moz-range-thumb]:rounded-full
                                        [&::-moz-range-thumb]:border-2
                                        [&::-moz-range-thumb]:border-amber-500
                                        [&::-moz-range-thumb]:cursor-grab"
                                />

                                {/* 时间刻度 */}
                                <div className="flex justify-between mt-1 px-0.5">
                                    {[0, 6, 12, 18, 24].map(hour => (
                                        <span key={hour} className="text-[10px] text-slate-500 font-mono">
                                            {String(hour).padStart(2, '0')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 当前时间显示 */}
                            <div className="text-right shrink-0">
                                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                                    {formatTime(currentTime)}
                                </div>
                                <AnimatePresence>
                                    {currentOp && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute right-0 top-[-40px] whitespace-nowrap bg-emerald-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/40 border border-emerald-400"
                                        >
                                            ⚡ {currentOp}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                    LOCAL TIME
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
