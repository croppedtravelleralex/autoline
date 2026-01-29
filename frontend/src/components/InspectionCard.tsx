import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Chamber } from '../types';

interface InspectionCardProps {
    chamber: Chamber;
    lineName: string;
    variant?: 'default' | 'compact';
    metricName?: string;
    metricValue?: string | number;
    metricUnit?: string;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({
    chamber,
    lineName,
    variant = 'default',
    metricName,
    metricValue,
    metricUnit
}) => {
    // 基础状态判定
    const isError = chamber.state === 'error';
    const isWarning = chamber.state === 'warning';

    // 模拟健康分
    const healthScore = isError ? 45 : isWarning ? 75 : 100;

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-xl p-3 h-28 flex flex-col justify-between transition-all group hover:bg-white/[0.04]",
                    isError && "ring-1 ring-red-500/50 bg-red-500/[0.05]",
                    isWarning && "ring-1 ring-orange-500/40 bg-orange-500/[0.05]"
                )}
            >
                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={32} strokeWidth={1} />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
                            {lineName} {chamber.name}
                        </span>
                        <div className={cn(
                            "w-1 h-1 rounded-full",
                            isError ? "bg-red-500 animate-pulse" : isWarning ? "bg-orange-500" : "bg-emerald-500"
                        )} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">{metricName || '设备状态'}</div>
                </div>

                <div className="flex-1 flex items-center">
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "text-lg font-black tracking-tighter",
                            isError ? "text-red-400" : isWarning ? "text-orange-400" : "text-white"
                        )}>
                            {metricValue || (isError ? 'FAIL' : 'PASS')}
                        </span>
                        {metricUnit && <span className="text-[9px] font-bold text-slate-600">{metricUnit}</span>}
                    </div>
                </div>

                {/* 极致紧凑进度条 */}
                <div className="mt-2 space-y-1">
                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${healthScore}%` }}
                            className={cn(
                                "h-full transition-all duration-700",
                                isError ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-sky-500"
                            )}
                        />
                    </div>
                    <div className="flex justify-between text-[7px] font-bold text-slate-600 uppercase tracking-widest">
                        <span>Status</span>
                        <span className={isError ? "text-red-500" : isWarning ? "text-orange-500" : "text-emerald-500"}>
                            {isError ? 'Abnormal' : isWarning ? 'Warning' : 'Normal'}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // 原始 Default 模式（已由上个页面重构过）
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative group bg-card/60 dark:bg-slate-900/40 border border-border dark:border-white/5 rounded-xl p-4 transition-all duration-300",
                isError && "alarm-glow-red border-red-500/50 z-10"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">{lineName}</span>
                    <h3 className="text-xs font-black text-foreground dark:text-white">{chamber.name}</h3>
                </div>
                <div className={cn(
                    "px-1.5 py-0.5 rounded-md text-[9px] font-black border",
                    isError ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                )}>
                    {isError ? 'ERROR' : 'NORMAL'}
                </div>
            </div>

            <div className="h-1 w-full bg-slate-800 rounded-full mb-4 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} className={cn("h-full", isError ? "bg-red-500" : "bg-emerald-500")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-[8px] font-bold text-slate-500 mb-1">VALUE</div>
                    <div className="text-sm font-mono font-black text-white">{metricValue || '--'}</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-[8px] font-bold text-slate-500 mb-1">UNIT</div>
                    <div className="text-sm font-mono font-black text-slate-400">{metricUnit || '--'}</div>
                </div>
            </div>
        </motion.div>
    );
};
