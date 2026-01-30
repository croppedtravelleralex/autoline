import type { Cart, LineData } from '../types';
import { Timer } from 'lucide-react';
import { motion } from 'framer-motion';

export const CartProgressPanel = ({ carts, lines }: { carts: Cart[], lines: LineData[] }) => (
    <div className="bg-card dark:bg-slate-950/40 border border-border dark:border-white/5 rounded-xl flex flex-col h-full overflow-hidden relative group">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        {/* 紧凑的标题栏 */}
        <div className="px-2 py-1.5 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-white/[0.02] flex items-center gap-1.5">
            <Timer className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-[10px] font-bold text-foreground dark:text-white tracking-wider">工艺进度监控</h3>
            <span className="ml-auto text-[9px] text-muted-foreground dark:text-slate-500 font-mono">{carts.length}辆</span>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-2 scrollbar-thin scrollbar-thumb-emerald-900/30">
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
                                    <div className="flex items-center gap-1.5 text-[9px]">
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold w-10 flex-shrink-0">{cart.number}</span>
                                        <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-500 flex-1 min-w-0">
                                            <span className="truncate">{cart.totalTime}</span>
                                            <span className="text-muted-foreground/50 dark:text-slate-600">|</span>
                                            <span className="text-sky-600 dark:text-sky-400 truncate">剩{cart.remainingTime}</span>
                                        </div>
                                        <span className="font-mono text-emerald-500/80 dark:text-emerald-300/80 font-semibold flex-shrink-0">
                                            {cart.progress?.toFixed(0)}%
                                        </span>
                                    </div>
                                    {/* 第二行：进度条 - 更细更紧凑 */}
                                    <div className="h-1 w-full bg-muted dark:bg-slate-800/80 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cart.progress || 0}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);
