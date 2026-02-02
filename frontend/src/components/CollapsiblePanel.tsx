import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollapsiblePanelProps {
    id: string; // 用于 localStorage 持久化
    title: string;
    icon?: ReactNode;
    colorClass?: string;
    count?: number | string;
    defaultExpanded?: boolean;
    children: ReactNode;
    className?: string;
}

/**
 * 可收起/展开的面板组件
 * - 支持 localStorage 持久化展开/收起状态
 * - 包含 Framer Motion 动画
 * - 统一的标题栏设计
 */
export const CollapsiblePanel = ({
    id,
    title,
    icon,
    colorClass = 'text-sky-500',
    count,
    defaultExpanded = true,
    children,
    className
}: CollapsiblePanelProps) => {
    const storageKey = `panel_collapsed_${id}`;

    // 从 localStorage 读取初始状态
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window === 'undefined') return defaultExpanded;
        const stored = localStorage.getItem(storageKey);
        return stored !== null ? stored === 'true' : defaultExpanded;
    });

    // 持久化到 localStorage
    useEffect(() => {
        localStorage.setItem(storageKey, String(isExpanded));
    }, [isExpanded, storageKey]);

    const toggle = () => setIsExpanded(prev => !prev);

    return (
        <div className={cn(
            "flex flex-col h-full overflow-hidden bg-card dark:bg-slate-950/40 border border-border dark:border-white/5 rounded-xl relative group/panel transition-all duration-300",
            !isExpanded && "h-auto",
            className
        )}>
            {/* 标题栏 - 始终可见 */}
            <div
                className="px-2 py-1.5 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-white/[0.02] flex items-center gap-1.5 cursor-pointer select-none shrink-0"
                onClick={toggle}
                onDoubleClick={toggle}
            >
                {icon && <span className={cn("w-3 h-3", colorClass)}>{icon}</span>}
                <h3 className={cn("text-[10px] font-bold tracking-wider", colorClass)}>{title}</h3>
                {count !== undefined && (
                    <span className="ml-auto text-[9px] text-muted-foreground dark:text-slate-500 font-mono mr-1">
                        {count}
                    </span>
                )}
                <button
                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    title={isExpanded ? "收起" : "展开"}
                >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>

            {/* 内容区域 - 带动画 */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="flex-1 overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
