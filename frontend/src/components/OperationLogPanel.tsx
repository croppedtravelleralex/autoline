import { useState, useRef, useEffect } from 'react';
import type { LogEntry, LineData } from '../types';
import { cn } from '../lib/utils';
import { FileText } from 'lucide-react';

interface OperationLogPanelProps {
    logs: LogEntry[];
    lines: LineData[];
    className?: string;
}

export const OperationLogPanel = ({ logs, lines, className }: OperationLogPanelProps) => {
    const [activeLineId, setActiveLineId] = useState<string>('all');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter logs based on activeLineId
    // Note: Since LogEntry currently doesn't strictly have lineId, 
    // we perform a "best effort" filter or just show all for now if strict mapping is missing.
    // Ideally, we would map chamber names in log content to lines, or update backend to send lineId.
    // For this UI implementation, we will show all logs when 'all' is selected, 
    // and for specific lines, we (optionally) try to filter or just show a placeholder if no keyword matches.
    // A simple heuristic: if log content contains line name or chamber name belonging to the line.

    const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => {
        if (!log || typeof log.content !== 'string') return false;
        if (activeLineId === 'all') return true;
        const line = (Array.isArray(lines) ? lines : []).find(l => l && l.id === activeLineId);
        if (!line) return false;

        const lineIndex = (Array.isArray(lines) ? lines : []).indexOf(line) + 1;
        const targetFlag = `${lineIndex}#`;

        // 检查日志是否包含任何产线标识（如 1#, 2# 等）
        const allFlags = (Array.isArray(lines) ? lines : []).map((_, idx) => `${idx + 1}#`);
        const hasAnyFlag = allFlags.some(flag => log.content.includes(flag));

        if (hasAnyFlag) {
            // 如果含有标识，必须严格匹配当前选中的编号
            return log.content.includes(targetFlag);
        }

        // 如果日志中完全没有编号标识（如系统级日志或旧数据），则回退到按腔体名称匹配
        const anodeChambers = Array.isArray(line.anodeChambers) ? line.anodeChambers : [];
        const cathodeChambers = Array.isArray(line.cathodeChambers) ? line.cathodeChambers : [];
        const allChambers = [...anodeChambers, ...cathodeChambers];
        const hasChamberName = allChambers.some(c => c && typeof c.name === 'string' && log.content.includes(c.name));
        return hasChamberName;
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [filteredLogs]);

    return (
        <div className={cn("flex flex-col h-full overflow-hidden bg-slate-950/60 backdrop-blur-md border-l border-white/5", className)}>
            {/* Header with Tabs */}
            <div className="flex flex-col border-b border-white/5 bg-white/[0.02]">
                <div className="px-3 py-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">操作日志</h3>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-2 pb-0 gap-1 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveLineId('all')}
                        className={cn(
                            "px-3 py-1 text-[9px] font-mono border-b-2 transition-colors whitespace-nowrap uppercase",
                            activeLineId === 'all'
                                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        全部
                    </button>
                    {Array.isArray(lines) && lines.map((line, index) => (
                        <button
                            key={line.id}
                            onClick={() => setActiveLineId(line.id)}
                            className={cn(
                                "px-3 py-1 text-[9px] font-mono border-b-2 transition-colors max-w-[80px] truncate",
                                activeLineId === line.id
                                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                    : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                            title={line.name}
                        >
                            {index + 1}#
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-1 space-y-0.5 font-mono text-[10px] scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10">
                {filteredLogs.map((log) => {
                    // Handle seconds vs milliseconds
                    let ts = log.timestamp;
                    if (ts < 10000000000) ts *= 1000;

                    const date = new Date(ts);
                    const timeStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

                    return (
                        <div key={log.id} className="flex gap-1.5 hover:bg-white/[0.03] px-2 py-1 rounded-sm transition-colors group">
                            <span className="text-slate-600 shrink-0 group-hover:text-slate-500 transition-colors whitespace-nowrap">
                                {timeStr}
                            </span>
                            <span className="text-slate-300 break-all leading-tight opacity-90 group-hover:opacity-100">
                                {log.content}
                            </span>
                        </div>
                    );
                })}
                {filteredLogs.length === 0 && (
                    <div className="text-slate-700 italic px-2 py-4 text-center text-[9px]">
                        暂无{activeLineId === 'all' ? '系统' : '该线体'}操作日志
                    </div>
                )}
            </div>
        </div>
    );
};
