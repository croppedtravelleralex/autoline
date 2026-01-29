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
        <div className="bg-slate-950/60 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden backdrop-blur-sm shadow-inner group">
            <div className="px-3 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                    <h3 className="text-xs font-bold text-white/90">{title}</h3>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse shadow-[0_0_5px]`} />
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px] scrollbar-thin scrollbar-thumb-slate-800">
                {logs?.map((log) => (
                    <div key={log.id} className="flex gap-2 items-start opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-slate-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={cn(
                            "break-all",
                            log.level === 'error' ? 'text-red-400' :
                                log.level === 'warn' ? 'text-amber-400' :
                                    log.level === 'success' ? 'text-emerald-400' : 'text-slate-300'
                        )}>
                            {log.content}
                        </span>
                    </div>
                ))}
                {(!logs || logs.length === 0) && <div className="text-slate-700 italic px-2">暂无日志数据...</div>}
            </div>
        </div>
    );
};
