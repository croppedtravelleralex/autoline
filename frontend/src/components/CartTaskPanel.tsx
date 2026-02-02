import type { Cart, LineData } from '../types';
import { ListTodo } from 'lucide-react';
import { CollapsiblePanel } from './CollapsiblePanel';

interface CartTaskPanelProps {
    carts: Cart[];
    lines: LineData[];
}

export const CartTaskPanel = ({ carts, lines }: CartTaskPanelProps) => (
    <CollapsiblePanel
        id="cart-task-panel"
        title="小车待办事项"
        icon={<ListTodo className="w-3 h-3" />}
        colorClass="text-sky-600 dark:text-sky-400"
        count={`${carts.length}辆`}
        defaultExpanded={true}
    >
        <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-2 scrollbar-thin scrollbar-thumb-sky-900/30">
            {(Array.isArray(lines) ? lines : []).map(line => {
                const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
                const lineCarts = (Array.isArray(carts) ? carts : []).filter(cart =>
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
                                    className="bg-muted/30 dark:bg-slate-900/50 rounded px-1.5 py-1 border border-border dark:border-white/5 flex items-center gap-1.5 group/item hover:border-sky-500/30 hover:bg-muted/50 transition-all cursor-pointer"
                                >
                                    {/* 左侧：状态指示器 + 编号 */}
                                    <div className="w-0.5 h-4 bg-sky-500/20 dark:bg-sky-500/30 rounded-full group-hover/item:bg-sky-500 transition-colors flex-shrink-0" />
                                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 font-mono min-w-[44px] max-w-[80px] truncate flex-shrink-0" title={cart.number}>{cart.number}</span>

                                    {/* 中间：任务信息 - 自适应布局防止重叠 */}
                                    <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
                                        <span className="text-[9px] text-foreground/80 dark:text-slate-400 truncate font-medium flex-[1.2] min-w-0" title={cart.currentTask}>
                                            {cart.currentTask}
                                        </span>
                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                            <span className="text-[8px] text-muted-foreground/50 dark:text-slate-600 flex-shrink-0">→</span>
                                            <span className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold truncate min-w-0" title={cart.nextTask}>
                                                {cart.nextTask}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {carts.length === 0 && <div className="text-[9px] text-muted-foreground dark:text-slate-600 text-center py-2">暂无在线小车</div>}
        </div>
    </CollapsiblePanel>
);
