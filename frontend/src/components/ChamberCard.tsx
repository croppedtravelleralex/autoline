import type { Chamber, Cart, LineType, ChamberValves } from '../types';
import { Truck, Activity, Wind, Zap, Disc } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface ChamberCardProps {
    chamber: Chamber;
    lineId: LineType;
    carts: Cart[];
    onToggleValve: (lineId: LineType, chamberId: string, valveName: keyof ChamberValves) => void;
    onTogglePump: (lineId: LineType, chamberId: string, pumpType: 'molecular' | 'roughing') => void;
    onToggleIndiumSealing?: (lineId: LineType, chamberId: string) => void;
    onCartClick?: (cart: Cart) => void;
    onOpenSettings?: (chamber: Chamber) => void;
    isReadOnly?: boolean;
}

// 呼吸灯状态指示器
// status: 'running' = 绿色 | 'warning' = 黄色 | 'error' = 红色 | 'off' = 灰色
type LEDStatus = 'running' | 'warning' | 'error' | 'off';

const BreathingLED = ({
    active,
    label,
    onClick,
    status = 'off'
}: {
    active: boolean,
    label: string,
    icon?: any,
    onClick?: () => void,
    status?: LEDStatus
}) => {
    // 根据 active 状态自动推断 LED 状态
    const ledStatus: LEDStatus = active ? 'running' : status;

    const colorConfig = {
        running: {
            bg: 'bg-emerald-500',
            shadow: 'shadow-[0_0_6px_#10b981]',
            animate: 'animate-pulse'
        },
        warning: {
            bg: 'bg-amber-500',
            shadow: 'shadow-[0_0_6px_#f59e0b]',
            animate: 'animate-pulse'
        },
        error: {
            bg: 'bg-red-500',
            shadow: 'shadow-[0_0_6px_#ef4444]',
            animate: 'animate-[pulse_0.5s_ease-in-out_infinite]'
        },
        off: {
            bg: 'bg-slate-600',
            shadow: '',
            animate: ''
        }
    };

    const config = colorConfig[ledStatus];

    return (
        <div
            className="flex flex-col items-center justify-center cursor-pointer group/led gap-0.5"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            title={label}
        >
            {/* 小圆点 LED */}
            <div className="relative">
                {ledStatus !== 'off' && (
                    <div className={cn(
                        "absolute inset-0 rounded-full blur-[2px] opacity-70",
                        config.bg,
                        config.animate
                    )} />
                )}
                <div className={cn(
                    "relative w-2 h-2 rounded-full transition-all duration-300",
                    config.bg,
                    config.shadow,
                    config.animate,
                    "group-hover/led:scale-125"
                )} />
            </div>
            {/* 设备名称 */}
            <span className={cn(
                "text-[7px] font-bold leading-none transition-colors",
                ledStatus === 'running' ? "text-emerald-400" :
                    ledStatus === 'warning' ? "text-amber-400" :
                        ledStatus === 'error' ? "text-red-400" : "text-slate-500"
            )}>
                {label}
            </span>
        </div>
    );
};

const CompactValue = ({ value, unit, label, colorClass }: { value: string | number, unit?: string, label: string, colorClass: string }) => (
    <div className="flex items-center justify-between w-full h-5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{label}</span>
        <span className={cn("text-[13px] font-mono-data font-black tracking-tighter", colorClass)}>
            {value}
            {unit && <span className="text-[9px] ml-0.5 opacity-60 font-medium">{unit}</span>}
        </span>
    </div>
);

/**
 * StatusLED - 状态指示灯组件
 * 用于显示设备或状态的开关状态，支持激活、错误状态及点击交互
 */
interface StatusLEDProps {
    active: boolean;
    label: string;
    error?: boolean;
    onClick?: () => void;
}

export const StatusLED: React.FC<StatusLEDProps> = ({ active, label, error, onClick }) => (
    <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={onClick}
    >
        <div
            className={cn(
                "w-3 h-3 rounded-full transition-all",
                error ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                    active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" :
                        "bg-slate-600"
            )}
        />
        <span className="text-xs text-slate-300">{label}</span>
    </div>
);

export const ChamberCard: React.FC<ChamberCardProps> = ({ chamber, lineId, carts, onToggleValve, onTogglePump, onToggleIndiumSealing, onCartClick, onOpenSettings, isReadOnly }) => {

    const formatSci = (num: number) => {
        return num.toExponential(1).replace('+', '');
    };


    return (
        <motion.div
            layout
            initial={false}
            className={cn(
                "shrink-0 w-[165px] bg-[#0b0e1b]/95 backdrop-blur-md border border-sky-500/20 rounded-xl shadow-2xl overflow-hidden group/card hover:border-sky-400/50 transition-all duration-300",
                isReadOnly ? "cursor-default opacity-95" : "cursor-pointer"
            )}
            onClick={() => !isReadOnly && onOpenSettings?.(chamber)}
        >
            {/* 紧凑型 Header */}
            <header className="px-2.5 py-1.5 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-200 tracking-tight truncate max-w-[100px] leading-none">{chamber.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {chamber.isHeating && (
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316] animate-pulse" />
                    )}
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        chamber.state === 'error' ? "bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" :
                            chamber.state === 'warning' ? "bg-amber-500 shadow-[0_0_8px_#f59e0b] shadow-amber-500/50" : "bg-sky-500/40"
                    )} />
                </div>
            </header>

            {/* Body */}
            <div className="p-2 space-y-2">
                {/* 垂直堆叠数据布局 */}
                <div className="flex flex-col gap-1.5 px-0.5">
                    <CompactValue
                        label="高级规"
                        value={formatSci(chamber.highVacPressure)}
                        colorClass="text-sky-400"
                    />
                    <CompactValue
                        label="前级规"
                        value={formatSci(chamber.forelinePressure)}
                        colorClass="text-amber-500/80"
                    />
                    <CompactValue
                        label="内温"
                        value={chamber.temperature.toFixed(1)}
                        unit="°C"
                        colorClass="text-emerald-400"
                    />
                    <CompactValue
                        label="外温"
                        value={chamber.outerTemperature ? chamber.outerTemperature.toFixed(1) : '0.0'}
                        unit="°C"
                        colorClass="text-orange-400"
                    />
                </div>

                {/* 迷你载具区域 */}
                <div
                    className={cn(
                        "min-h-[22px] bg-sky-500/5 border border-sky-500/10 rounded-lg flex items-center justify-center gap-1 p-0.5 relative group/cart",
                        !isReadOnly && carts.length > 0 && "hover:bg-sky-500/10 transition-all"
                    )}
                    onClick={(e) => {
                        if (!isReadOnly && carts.length === 1 && onCartClick) {
                            e.stopPropagation();
                            onCartClick(carts[0]);
                        }
                    }}
                >
                    {carts.length > 0 ? (
                        carts.map((cart) => (
                            <div
                                key={cart.id}
                                className="flex items-center gap-1 text-sky-400 font-black bg-sky-500/10 rounded px-1.5 py-0.5"
                            >
                                <Truck className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-mono-data tracking-tighter">{cart.number.replace('A-', '').replace('C-', '')}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-[8px] text-slate-700 font-black tracking-widest uppercase py-0.5">空仓</span>
                    )}
                </div>

                {/* 状态位网格 (3x2 紧凑设计) */}
                <div className="grid grid-cols-6 gap-1">
                    <BreathingLED
                        active={chamber.molecularPump}
                        label="分子泵"
                        icon={Activity}
                        onClick={() => !isReadOnly && onTogglePump(lineId, chamber.id, 'molecular')}
                    />
                    <BreathingLED
                        active={chamber.valves.gate_valve === 'open'}
                        label="插板阀"
                        icon={Zap}
                        onClick={() => !isReadOnly && onToggleValve(lineId, chamber.id, 'gate_valve')}
                    />
                    <BreathingLED
                        active={chamber.roughingPump}
                        label="粗抽泵"
                        icon={Disc}
                        onClick={() => !isReadOnly && onTogglePump(lineId, chamber.id, 'roughing')}
                    />
                    <BreathingLED
                        active={chamber.valves.roughing_valve === 'open'}
                        label="粗抽阀"
                        icon={Wind}
                        onClick={() => !isReadOnly && onToggleValve(lineId, chamber.id, 'roughing_valve')}
                    />
                    <BreathingLED
                        active={chamber.valves.foreline_valve === 'open'}
                        label="前级阀"
                        icon={Disc}
                        onClick={() => !isReadOnly && onToggleValve(lineId, chamber.id, 'foreline_valve')}
                    />
                    <BreathingLED
                        active={chamber.valves.vent_valve === 'open'}
                        label="放气阀"
                        icon={Wind}
                        onClick={() => !isReadOnly && onToggleValve(lineId, chamber.id, 'vent_valve')}
                    />
                    {/* 铟封仓专属 - 铟封功能呼吸灯 */}
                    {chamber.type === 'sealing' && (
                        <BreathingLED
                            active={chamber.indiumSealing ?? false}
                            label="铟封"
                            onClick={() => !isReadOnly && onToggleIndiumSealing?.(lineId, chamber.id)}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};
