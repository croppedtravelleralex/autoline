import { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';
import { cn } from '../lib/utils';

export const LogPanel = ({ title, icon: Icon, logs, colorClass }: { title: string, icon: any, logs: LogEntry[] | undefined, colorClass: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="bg-card dark:bg-slate-950/60 border border-border dark:border-white/5 rounded-xl flex flex-col h-full overflow-hidden backdrop-blur-sm shadow-inner group">
            <div className="px-3 py-2 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                    <h3 className="text-xs font-bold text-foreground dark:text-white/90">{title}</h3>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse shadow-[0_0_5px]`} />
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px] scrollbar-thin scrollbar-thumb-muted dark:scrollbar-thumb-slate-800">
                {logs?.map((log) => (
                    <div key={log.id} className="flex gap-2 items-start opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-muted-foreground dark:text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={cn(
                            "break-all",
                            log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                                log.level === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                                    log.level === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground dark:text-slate-300'
                        )}>
                            {log.content}
                        </span>
                    </div>
                ))}
                {(!logs || logs.length === 0) && <div className="text-muted-foreground dark:text-slate-700 italic px-2">暂无日志数据...</div>}
            </div>
        </div>
    );
};
