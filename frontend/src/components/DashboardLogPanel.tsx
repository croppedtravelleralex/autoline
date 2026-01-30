import type { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { useRef, useEffect } from 'react';

export const DashboardLogPanel = ({ title, logs, colorClass }: { title: string, logs: LogEntry[] | undefined, colorClass: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-3 py-1.5 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
                <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", colorClass)}>{title}</h3>
                <span className="text-[9px] text-muted-foreground dark:text-slate-600 font-mono bg-background/50 dark:bg-white/5 px-1.5 rounded">{logs?.length || 0}</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-1 space-y-0.5 font-mono text-[10px] scrollbar-thin scrollbar-thumb-muted-foreground/20 dark:scrollbar-thumb-white/5 hover:scrollbar-thumb-muted-foreground/30 dark:hover:scrollbar-thumb-white/10">
                {(Array.isArray(logs) ? logs : []).map((log) => (
                    <div key={log.id} className="flex gap-2 hover:bg-muted dark:hover:bg-white/[0.03] px-2 py-0.5 rounded-sm transition-colors group">
                        <span className="text-muted-foreground dark:text-slate-600 shrink-0 group-hover:text-foreground dark:group-hover:text-slate-500 transition-colors">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                        <span className={cn("break-all leading-tight opacity-80 group-hover:opacity-100 dark:text-slate-300 text-foreground",
                            log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                                log.level === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                                    log.level === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground dark:text-slate-300'
                        )}>{log.content}</span>
                    </div>
                ))}
                {(!logs || logs.length === 0) && <div className="text-muted-foreground dark:text-slate-800 italic px-2 py-2 text-center text-[9px]">NO DATA</div>}
            </div>
        </div>
    );
};
