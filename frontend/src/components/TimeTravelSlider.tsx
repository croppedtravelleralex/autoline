import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, History, Link, Link2Off, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { fetchSnapshotRange, fetchSnapshotAt, fetchEvents } from '../services/api';
import { cn } from '../lib/utils';

export const TimeTravelSlider = ({ onClose }: { onClose: () => void }) => {
    const { state, playback, actions } = useSystemStateContext();
    const [range, setRange] = useState<{ start: number; end: number } | null>(null);
    const [internalTime, setInternalTime] = useState<number>(playback?.currentTime || Date.now() / 1000);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [previewSnapshot, setPreviewSnapshot] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    // 每线体独立的本地时间状态，用于流畅拖拽
    const [lineLocalTimes, setLineLocalTimes] = useState<Record<string, number>>({});
    // 防抖定时器引用
    const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // 防抖处理线体滑块拖拽
    const handleLineSliderChange = useCallback((lineId: string, value: number) => {
        // 立即更新本地状态，保证流畅
        setLineLocalTimes(prev => ({ ...prev, [lineId]: value }));

        // 清除之前的定时器
        if (debounceTimersRef.current[lineId]) {
            clearTimeout(debounceTimersRef.current[lineId]);
        }

        // 300ms 后才调用 API
        debounceTimersRef.current[lineId] = setTimeout(() => {
            actions.setPlaybackTime(lineId, value);
        }, 300);
    }, [actions]);


    // Fetch range on mount
    useEffect(() => {
        const getRange = async () => {
            const r = await fetchSnapshotRange();
            if (r.start && r.end) {
                setRange({ start: r.start, end: r.end });
                setInternalTime(r.end);

                // Fetch events for initial range
                const evts = await fetchEvents(r.start, r.end);
                setEvents(evts);
            }
        };
        getRange();
    }, []);

    // Sync internal time with global playback time
    useEffect(() => {
        if (playback?.currentTime) {
            setInternalTime(playback.currentTime);
        }
    }, [playback?.currentTime]);

    // Handle range updates (every 30s)
    useEffect(() => {
        const timer = setInterval(async () => {
            const r = await fetchSnapshotRange();
            if (r.start && r.end) {
                setRange({ start: r.start, end: r.end });
            }
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!range) return;
            const step = e.shiftKey ? 600 : 60; // 10 min vs 1 min
            if (e.key === 'ArrowLeft') {
                const next = Math.max(range.start, internalTime - step);
                setInternalTime(next);
                actions.setPlaybackTime('all', next);
            } else if (e.key === 'ArrowRight') {
                const next = Math.min(range.end, internalTime + step);
                setInternalTime(next);
                actions.setPlaybackTime('all', next);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [range, internalTime, actions]);

    const handleHoverMove = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!range) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const time = range.start + percent * (range.end - range.start);
        setHoverTime(time);

        // Debounced or simple fetch for preview
        try {
            const snap = await fetchSnapshotAt(time);
            setPreviewSnapshot(snap);
        } catch (e) { }
    };

    const formatTime = (ts: number) => {
        return new Date(ts * 1000).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setInternalTime(val);
        actions.setPlaybackTime('all', val);
    };

    const quickSelect = (hours: number) => {
        if (!range) return;
        const target = range.end - hours * 3600;
        const final = Math.max(range.start, target);
        setInternalTime(final);
        actions.setPlaybackTime('all', final);
    };

    if (!range) return null;

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-[100]"
        >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <History className="w-5 h-5 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-amber-500 font-bold tracking-wider">时间回溯模式 (PLAYBACK)</h3>
                            <p className="text-xs text-amber-500/60 font-mono">{formatTime(internalTime)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-amber-500/70 hover:text-amber-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Main Timeline Control */}
                    <div className="space-y-4 relative">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>{formatTime(range.start)}</span>
                            <span>{formatTime(range.end)}</span>
                        </div>

                        <div
                            className="relative h-12 flex items-center group cursor-pointer"
                            onMouseMove={handleHoverMove}
                            onMouseLeave={() => { setHoverTime(null); setPreviewSnapshot(null); }}
                        >
                            {/* Base Track */}
                            <div className="absolute inset-x-0 h-1.5 bg-slate-800 rounded-full" />

                            {/* Played Progress */}
                            <div
                                className="absolute left-0 h-1.5 bg-amber-500/30 rounded-full"
                                style={{ width: `${((internalTime - range.start) / (range.end - range.start)) * 100}%` }}
                            />

                            {/* Event Markers from Backend */}
                            {events.map((evt, i) => {
                                const pos = ((evt.timestamp - range.start) / (range.end - range.start)) * 100;
                                if (pos < 0 || pos > 100) return null;
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "absolute w-1.5 h-1.5 rounded-full z-[5]",
                                            evt.level === 'error' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                                                evt.level === 'warning' ? "bg-amber-500" : "bg-sky-500/50"
                                        )}
                                        style={{ left: `${pos}%` }}
                                        title={`${evt.type}: ${evt.content}`}
                                    />
                                );
                            })}

                            <input
                                type="range"
                                min={range.start}
                                max={range.end}
                                step={10}
                                value={internalTime}
                                onChange={handleMainChange}
                                className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer z-10"
                            />

                            {/* Indicator Thumb */}
                            <div
                                className="absolute w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 shadow-xl pointer-events-none"
                                style={{ left: `calc(${((internalTime - range.start) / (range.end - range.start)) * 100}% - 8px)` }}
                            />

                            {/* Hover Preview Tooltip */}
                            {hoverTime && (
                                <div
                                    className="absolute -top-32 w-48 bg-slate-800 border border-amber-500/50 rounded-lg shadow-2xl p-2 z-20 pointer-events-none"
                                    style={{ left: `calc(${((hoverTime - range.start) / (range.end - range.start)) * 100}% - 96px)` }}
                                >
                                    <div className="text-[10px] font-mono text-amber-500 mb-1">{formatTime(hoverTime)}</div>
                                    {previewSnapshot ? (
                                        <div className="space-y-1">
                                            {previewSnapshot.lines.map((l: any) => (
                                                <div key={l.id} className="flex justify-between text-[8px] text-slate-400">
                                                    <span>{l.name}</span>
                                                    <span className="text-slate-200">{(l.anodeChambers[0]?.temperature || 25).toFixed(1)}℃</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-8 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-r border-b border-amber-500/50 rotate-45" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => actions.setPlaybackTime('all', internalTime - 60)}
                                className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1.5">
                                {[0.5, 1, 12, 24, 168].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => quickSelect(h)}
                                        className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 border border-white/5 rounded text-[9px] text-slate-400 hover:text-amber-400 transition-all font-bold"
                                    >
                                        {h < 24 ? `${h}h` : h === 168 ? '7d' : `${h / 24}d`}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => actions.setPlaybackTime('all', internalTime + 60)}
                                className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Per-Line Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        {state.lines.map(line => {
                            const lineSnap = playback?.snapshots[line.id];
                            const lineTime = lineSnap?.timestamp || range.end;
                            const isSync = lineSnap?.isSynchronized ?? true;

                            return (
                                <div
                                    key={line.id}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all space-y-2 relative group",
                                        isSync ? "bg-slate-800/40 border-white/5" : "bg-amber-500/5 border-amber-500/30"
                                    )}
                                >
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">{line.name}</span>
                                            {isSync ? (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/10 text-sky-500 rounded text-[8px] font-bold">
                                                    <Link className="w-2.5 h-2.5" /> 已联动
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded text-[8px] font-bold animate-pulse">
                                                    <Link2Off className="w-2.5 h-2.5" /> 独立模式
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-amber-500/80">
                                            {formatTime(lineTime)}
                                        </span>
                                    </div>

                                    <input
                                        type="range"
                                        min={range.start}
                                        max={range.end}
                                        step={10}
                                        value={lineLocalTimes[line.id] ?? lineTime}
                                        onChange={(e) => handleLineSliderChange(line.id, parseFloat(e.target.value))}
                                        className={cn(
                                            "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500",
                                            isSync ? "bg-slate-700" : "bg-amber-500/20"
                                        )}
                                    />

                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={() => actions.setPlaybackTime(line.id, range.end)}
                                            className="text-[9px] text-slate-500 hover:text-sky-400 font-bold tracking-tight transition-colors"
                                        >
                                            [ 追至实时 ]
                                        </button>
                                        {!isSync && (
                                            <button
                                                onClick={() => actions.setLineSync(line.id, true)}
                                                className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-slate-900 rounded text-[9px] font-black uppercase hover:bg-amber-400 transition-colors shadow-lg shadow-amber-900/40"
                                            >
                                                同步至全局
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Ambient Background Glow when active */}
            <div className="fixed inset-0 pointer-events-none border-[10px] border-amber-500/10 z-[-1] animate-pulse" />
        </motion.div>
    );
};
