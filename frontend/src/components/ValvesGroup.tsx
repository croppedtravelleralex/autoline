import { useState } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Chamber, ChamberValves, LineType } from '../types';
import { useSystemStateContext } from '../context/SystemStateContext';
// NOTE: 使用原生 CSS hover 提示替代 shadcn/ui tooltip 组件

interface ValvesGroupProps {
    chamber: Chamber;
    lineId: LineType;
}

// Simple Circular Progress for long press
const CircularProgress = ({ progress }: { progress: number }) => (
    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
        <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-amber-500/20 fill-none"
            strokeWidth="4"
        />
        <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-amber-500 fill-none transition-all duration-100"
            strokeWidth="4"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
        />
    </svg>
);

export const ValvesGroup = ({ chamber, lineId }: ValvesGroupProps) => {
    const { actions } = useSystemStateContext();
    const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
    const [pressProgress, setPressProgress] = useState(0);
    const [pressingValve, setPressingValve] = useState<string | null>(null);

    const handleLongPressStart = (valveId: string) => {
        setPressingValve(valveId);
        setPressProgress(0);
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / 3000) * 100, 100);
            setPressProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                actions.toggleValve(lineId, chamber.id, valveId);
                setPressingValve(null);
                setPressProgress(0);
            }
        }, 50);
        setLongPressTimer(interval as any);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer) clearInterval(longPressTimer);
        setLongPressTimer(null);
        setPressProgress(0);
        setPressingValve(null);
    };

    const getInterlock = (valveId: string): { disabled: boolean; reason?: string } => {
        // 1. Gate/Transfer Interlock (Pressure Difference)
        if (valveId === 'gate_valve' || valveId === 'transfer_valve') {
            // Mocking target pressure for comparison. 
            // In a real system, we'd find the adjacent chamber's pressure.
            const targetPressure = 1.0e-5; // Simplified: target high vacuum
            const diff = Math.abs(chamber.highVacPressure - targetPressure);
            if (diff > 1.0e-3) {
                return {
                    disabled: true,
                    reason: `压差超标: 当前 ${chamber.highVacPressure.toExponential(2)} Pa vs 目标 ${targetPressure.toExponential(2)} Pa`
                };
            }
        }

        // 2. Vent Valve Interlock
        if (valveId === 'vent_valve') {
            const isAnyGateOpen = chamber.valves.gate_valve === 'open' || chamber.valves.transfer_valve === 'open';
            if (chamber.temperature > 100) return { disabled: true, reason: '温控安全锁定: 腔温 > 100°C' };
            if (isAnyGateOpen) return { disabled: true, reason: '气动安全锁定: 插板阀处于开启状态' };
        }

        return { disabled: false };
    };

    const valves = [
        { id: 'gate_valve', label: '进样插板阀 (GATE)', color: 'emerald' },
        { id: 'transfer_valve', label: '传样插板阀 (TRANSFER)', color: 'emerald' },
        { id: 'foreline_valve', label: '主抽插板阀 (MAIN)', color: 'sky' },
        { id: 'roughing_valve', label: '粗抽阀 (ROUGH)', color: 'amber' },
        { id: 'vent_valve', label: '放气阀 (VENT)', color: 'red', longPress: true },
    ];

    return (
        <div className="grid grid-cols-1 gap-2.5">
            {valves.map((v) => {
                const interlock = getInterlock(v.id);
                const isPressed = pressingValve === v.id;
                const isOpen = chamber.valves[v.id as keyof ChamberValves] === 'open';

                const ButtonContent = (
                    <button
                        onMouseDown={() => v.longPress && !interlock.disabled && handleLongPressStart(v.id)}
                        onMouseUp={() => v.longPress && handleLongPressEnd()}
                        onMouseLeave={() => v.longPress && handleLongPressEnd()}
                        onClick={() => !v.longPress && !interlock.disabled && actions.toggleValve(lineId, chamber.id, v.id)}
                        disabled={interlock.disabled}
                        className={cn(
                            "relative overflow-hidden w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-300 group",
                            isOpen
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                : "bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20",
                            interlock.disabled && "opacity-50 cursor-not-allowed grayscale"
                        )}
                    >
                        {isPressed && <CircularProgress progress={pressProgress} />}

                        <div className="flex items-center gap-3 relative z-10">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-700",
                                interlock.disabled && "bg-red-500"
                            )} />
                            <span className="text-[11px] font-bold tracking-wide uppercase">{v.label}</span>
                        </div>

                        <div className="flex items-center gap-2 relative z-10">
                            {interlock.disabled ? (
                                <Lock size={12} className="text-red-500" />
                            ) : (
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                    isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"
                                )}>
                                    {isOpen ? 'Open' : 'Closed'}
                                </div>
                            )}
                            {v.longPress && !isOpen && !interlock.disabled && (
                                <span className="text-[8px] text-slate-500/60 font-medium">长按3秒</span>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                );

                if (interlock.disabled) {
                    return (
                        <div key={v.id} className="relative">
                            {ButtonContent}
                            <div className="absolute top-1/2 -right-1 translate-x-full -translate-y-1/2 ml-2 p-2 bg-red-900/90 border border-red-500/30 rounded text-[9px] text-white whitespace-nowrap z-50 shadow-xl opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
                                {interlock.reason}
                            </div>
                        </div>
                    );
                }

                return <div key={v.id}>{ButtonContent}</div>;
            })}
        </div>
    );
};
