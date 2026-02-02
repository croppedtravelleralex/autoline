import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Edit2, Save, Trash2 } from 'lucide-react';
import type { LineData } from '../types';

interface LineButtonProps {
    line: LineData;
    index: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onEdit: (lineId: string) => void;
    onSaveTemplate: (lineId: string, lineName: string) => void;
    onDelete: (lineId: string) => void;
    showDelete: boolean;
}

// 极简动画配置 - 使用 tween 替代 spring 以提升性能
const quickTransition = { duration: 0.15, ease: 'easeOut' as const };
const actionTransition = { duration: 0.12, ease: 'easeOut' as const };

export const LineButton = memo(({
    line,
    index,
    isSelected,
    onSelect,
    onEdit,
    onSaveTemplate,
    onDelete,
    showDelete
}: LineButtonProps) => {
    // 内联稳定的事件处理器
    const handleClick = useCallback(() => {
        onSelect(line.id);
    }, [onSelect, line.id]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(line.id);
    }, [onEdit, line.id]);

    const handleSave = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSaveTemplate(line.id, line.name);
    }, [onSaveTemplate, line.id, line.name]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(line.id);
    }, [onDelete, line.id]);

    return (
        <div className="flex items-center shrink-0 relative">
            <motion.button
                onClick={handleClick}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "font-bold rounded-md cursor-pointer whitespace-nowrap relative px-2.5 py-1 text-xs sm:text-sm transition-colors duration-200",
                    isSelected
                        ? 'text-white'
                        : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-500/20'
                )}
            >
                <span className="relative z-10">{index + 1}#</span>
                {isSelected && (
                    <motion.div
                        layoutId="active-line-pill"
                        className="absolute inset-0 bg-sky-500 shadow-lg shadow-sky-500/40 rounded-md"
                        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
                    />
                )}
            </motion.button>

            {/* Action Buttons - 使用纯 opacity 动画，避免宽度变化导致的布局偏移 */}
            <div
                className={cn(
                    "flex items-center ml-0.5 transition-opacity duration-100",
                    isSelected ? "opacity-100" : "opacity-0 pointer-events-none w-0 overflow-hidden"
                )}
            >
                <button
                    onClick={handleEdit}
                    className="p-1.5 hover:bg-amber-500/20 text-white/70 hover:text-amber-400 rounded transition-colors cursor-pointer"
                    title="编辑"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={handleSave}
                    className="p-1.5 hover:bg-sky-500/20 text-white/70 hover:text-sky-300 rounded transition-colors cursor-pointer"
                    title="存为模板"
                >
                    <Save className="w-3.5 h-3.5" />
                </button>

                {showDelete && (
                    <button
                        onClick={handleDelete}
                        className="p-1.5 hover:bg-red-500/20 text-white/70 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="删除"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // 自定义比较函数 - 只比较关键 props
    return (
        prevProps.line.id === nextProps.line.id &&
        prevProps.line.name === nextProps.line.name &&
        prevProps.index === nextProps.index &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.showDelete === nextProps.showDelete
        // 注意：我们故意忽略回调函数的比较，因为它们只是触发器
    );
});

LineButton.displayName = 'LineButton';
