import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { ValveState } from '../types';

interface InterChamberValveProps {
    isOpen: boolean;
    state: ValveState;
    onClick: () => void;
    isReadOnly?: boolean;
}

export const InterChamberValve = ({ isOpen, state, onClick, isReadOnly }: InterChamberValveProps) => {
    // 状态颜色映射
    const getStatusColor = () => {
        if (isOpen) return 'text-emerald-500';
        if (state === 'opening' || state === 'closing') return 'text-amber-500';
        return 'text-slate-500'; // Closed & Idle
    };

    const isMoving = state === 'opening' || state === 'closing';

    return (
        <div className="flex flex-col items-center justify-center relative w-6 h-32 shrink-0 mx-0 group">
            {/* 管道背景连线 (Visual Guide) */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10" />

            {/* 阀门主体容器 */}
            <motion.button
                onClick={() => !isReadOnly && onClick()}
                className={cn(
                    "relative w-full h-full p-0.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-700/50",
                    isReadOnly ? "cursor-default" : "cursor-pointer"
                )}
                whileHover={isReadOnly ? {} : { scale: 1.02 }}
                whileTap={isReadOnly ? {} : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                {/* 工业风插板阀 SVG 图标 - 高度调整为 128px (h-32) */}
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 128"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    className={cn("transition-colors duration-300", getStatusColor())}
                >
                    {/* 阀体外壳 (Housing) - 缩短版 */}
                    <path
                        d="M4 8H20V120H4V8Z"
                        className="fill-slate-900 stroke-current stroke-2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* 顶部和底部机械结构细节 */}
                    <path d="M6 14H18 M6 114H18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    <rect x="8" y="4" width="8" height="4" className="fill-current opacity-50" />
                    <rect x="8" y="120" width="8" height="4" className="fill-current opacity-50" />

                    {/* 连接部位 (Flanges) - 对应管道位置 (居中 64) */}
                    <path d="M2 48H4M2 80H4 M20 48H22M20 80H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

                    {/* 内部导轨 (Rails) */}
                    <path
                        d="M8 16V112M16 16V112"
                        className="stroke-slate-700/50"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* 闸板 (Gate) - 动画核心 */}
                    {/* 闸板初始状态(关闭)：高度约 96 (112-16) */}
                    <motion.rect
                        x="6"
                        y="16"
                        width="12"
                        height="96"
                        rx="1"
                        className="fill-current opacity-20"
                        initial={false}
                        animate={{
                            height: isOpen ? 0 : 96,
                            opacity: isOpen ? 0 : 0.8,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            mass: 0.8
                        }}
                    />

                    {/* 闸板底部边缘 - 跟随上方 Rect 变化 */}
                    <motion.path
                        d="M6 0H18"
                        className="stroke-current"
                        strokeWidth="2"
                        initial={false}
                        animate={{
                            translateY: isOpen ? 16 : 112, // 16是顶部，112是底部
                            opacity: isOpen ? 0 : 1
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            mass: 0.8
                        }}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* 中间状态指示灯 (LED) - 居中 (64) */}
                    <circle cx="12" cy="64" r="2" className={cn(
                        "transition-colors duration-300",
                        isOpen ? "fill-emerald-400" : (isMoving ? "fill-amber-400 animate-pulse" : "fill-red-900")
                    )} />
                </svg>

                {/* 状态文本标签 - 垂直排列 */}
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 whitespace-nowrap bg-slate-900/95 px-1.5 py-0.5 rounded border border-slate-700 shadow-xl backdrop-blur-sm">
                        {state.toUpperCase()}
                    </span>
                </div>
            </motion.button>
        </div>
    );
};
