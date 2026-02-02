import type { Cart, LineData } from '../types';
import { Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsiblePanel } from './CollapsiblePanel';

interface CartProgressPanelProps {
    carts: Cart[];
    lines: LineData[];
}

export const CartProgressPanel = ({ carts, lines }: CartProgressPanelProps) => (
    <CollapsiblePanel
        id="cart-progress-panel"
        title="工艺进度监控"
        icon={<Timer className="w-3 h-3" />}
        colorClass="text-emerald-600 dark:text-emerald-400"
        count={`${carts.length}辆`}
        defaultExpanded={true}
    >
        <div
            key={lines[0]?.id || 'empty'}
            className="flex-1 overflow-y-auto px-1.5 py-1 space-y-2 scrollbar-thin scrollbar-thumb-emerald-900/30"
        >
            {lines.map(line => {
                const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
                const lineCarts = (Array.isArray(carts) ? carts : []).filter(cart =>
                    allChambers.some(chamber => chamber.id === cart.locationChamberId)
                );

                if (lineCarts.length === 0) return null;

                return (
                    <div key={line.id} className="space-y-0.5">
                        {/* 紧凑的线体标题 */}
                        <div className="flex items-center gap-1 px-0.5 py-0.5">
                            <div className="w-0.5 h-2 bg-emerald-500/50 rounded-sm" />
                            <h4 className="text-[9px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-wider">{line.name}</h4>
                        </div>

                        {/* 紧凑的进度条列表 */}
                        <div className="space-y-1 pl-1.5 border-l border-border dark:border-white/5 ml-0.5">
                            {lineCarts.map(cart => (
                                <div key={cart.id} className="space-y-0.5">
                                    {/* 第一行：编号 + 时间信息 + 百分比 */}
                                    <div className="flex items-center gap-2 text-[9px] min-w-0">
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold min-w-[44px] max-w-[80px] truncate flex-shrink-0" title={cart.number}>{cart.number}</span>
                                        <div className="flex items-center gap-1 text-muted-foreground dark:text-slate-500 flex-1 min-w-0 overflow-hidden">
                                            <span className="truncate flex-shrink-0" title={`总用时: ${cart.totalTime}`}>{cart.totalTime}</span>
                                            <span className="text-muted-foreground/20 dark:text-slate-700 flex-shrink-0">|</span>
                                            <span className="text-sky-600 dark:text-sky-400 font-medium truncate" title={`剩余时间: ${cart.remainingTime}`}>剩{cart.remainingTime}</span>
                                        </div>
                                        <span className="font-mono text-emerald-500/80 dark:text-emerald-300/80 font-bold flex-shrink-0 ml-auto pl-1 whitespace-nowrap">
                                            {cart.progress?.toFixed(0)}%
                                        </span>
                                    </div>
                                    {/* 第二行：进度条 - 带 Shimmer 动效 */}
                                    <div className="h-1 w-full bg-muted/80 dark:bg-slate-800/80 rounded-full overflow-hidden border border-border/10 dark:border-transparent relative">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-sky-400 to-emerald-500 relative overflow-hidden"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cart.progress || 0}%` }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                        >
                                            {/* Shimmer 流光层 */}
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                                style={{
                                                    backgroundSize: '200% 100%',
                                                    animation: 'shimmer 2s infinite linear'
                                                }}
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </CollapsiblePanel>
);
