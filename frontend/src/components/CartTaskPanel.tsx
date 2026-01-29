import type { Cart, LineData } from '../types';
import { ListTodo } from 'lucide-react';

export const CartTaskPanel = ({ carts, lines }: { carts: Cart[], lines: LineData[] }) => (
    <div className="bg-card dark:bg-slate-950/40 border border-border dark:border-white/5 rounded-xl flex flex-col h-full overflow-hidden relative group">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
        {/* 紧凑的标题栏 */}
        <div className="px-2 py-1.5 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-white/[0.02] flex items-center gap-1.5">
            <ListTodo className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <h3 className="text-[10px] font-bold text-foreground dark:text-white tracking-wider">小车待办事项</h3>
            <span className="ml-auto text-[9px] text-muted-foreground dark:text-slate-500 font-mono">{carts.length}辆</span>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-2 scrollbar-thin scrollbar-thumb-sky-900/30">
            {lines.map(line => {
                const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
                const lineCarts = carts.filter(cart =>
                    allChambers.some(chamber => chamber.id === cart.locationChamberId)
                );

                if (lineCarts.length === 0) return null;

                return (
                    <div key={line.id} className="space-y-0.5">
                        {/* 紧凑的线体标题 */}
                        <div className="flex items-center gap-1 px-0.5 py-0.5">
                            <div className="w-0.5 h-2 bg-sky-500/50 rounded-sm" />
                            <h4 className="text-[9px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-wider">{line.name}</h4>
                            <span className="text-[8px] text-muted-foreground/80 dark:text-slate-600 ml-auto">{lineCarts.length}辆</span>
                        </div>

                        {/* 紧凑的小车列表 - 单行显示 */}
                        <div className="space-y-0.5">
                            {lineCarts.map(cart => (
                                <div
                                    key={cart.id}
                                    className="bg-muted/40 dark:bg-slate-900/50 rounded px-1.5 py-1 border border-border dark:border-white/5 flex items-center gap-1.5 group/item hover:border-sky-500/20 transition-colors cursor-pointer"
                                >
                                    {/* 左侧：状态指示器 + 编号 */}
                                    <div className="w-0.5 h-4 bg-sky-500/30 rounded-full group-hover/item:bg-sky-500 transition-colors flex-shrink-0" />
                                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 font-mono w-10 flex-shrink-0">{cart.number}</span>

                                    {/* 中间：当前任务 - 可截断 */}
                                    <span className="text-[9px] text-muted-foreground dark:text-slate-400 truncate flex-1 min-w-0">{cart.currentTask}</span>

                                    {/* 右侧：待办任务 */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-[8px] text-muted-foreground dark:text-slate-600">→</span>
                                        <span className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold">{cart.nextTask}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {carts.length === 0 && <div className="text-[9px] text-muted-foreground dark:text-slate-600 text-center py-2">暂无在线小车</div>}
        </div>
    </div>
);
