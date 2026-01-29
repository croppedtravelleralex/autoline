import { useState, useMemo } from 'react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { ListTodo, AlertTriangle, Activity, Download, Filter } from 'lucide-react';
import type { LogEntry } from '../types';
import { cn } from '../lib/utils';

type LogTab = 'system' | 'warning' | 'operation';

// CSV 导出工具函数
const exportToCSV = (logs: LogEntry[], filename: string) => {
    if (!logs || logs.length === 0) {
        alert('没有可导出的日志数据');
        return;
    }

    const headers = ['时间戳', '类型', '级别', '内容'];
    const rows = logs.map(log => [
        new Date(log.timestamp).toLocaleString('zh-CN'),
        log.type === 'system' ? '系统日志' : '操作日志',
        log.level === 'info' ? '信息' : log.level === 'warn' ? '警告' : log.level === 'error' ? '错误' : '成功',
        `"${log.content.replace(/"/g, '""')}"` // 处理内容中的引号
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
};

// 日志项组件
const LogItem = ({ log }: { log: LogEntry }) => (
    <div className="flex gap-3 items-start py-2 px-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
        <span className="text-slate-600 shrink-0 font-mono text-xs">
            [{new Date(log.timestamp).toLocaleTimeString('zh-CN')}]
        </span>
        <span className={cn(
            "break-all text-sm flex-1",
            log.level === 'error' ? 'text-red-400' :
                log.level === 'warn' ? 'text-amber-400' :
                    log.level === 'success' ? 'text-emerald-400' : 'text-slate-300'
        )}>
            {log.content}
        </span>
        <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded shrink-0",
            log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                    log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
        )}>
            {log.level === 'info' ? '信息' : log.level === 'warn' ? '警告' : log.level === 'error' ? '错误' : '成功'}
        </span>
    </div>
);

// 标签按钮组件
const TabButton = ({
    active,
    onClick,
    icon: Icon,
    label,
    count,
    colorClass
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    count: number;
    colorClass: string;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm",
            active
                ? `bg-gradient-to-r ${colorClass} text-white shadow-lg`
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
        )}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
            active ? "bg-white/20" : "bg-slate-700"
        )}>
            {count}
        </span>
    </button>
);

export function RunLogs() {
    const { state } = useSystemStateContext();
    const [activeTab, setActiveTab] = useState<LogTab>('system');

    // 根据标签页筛选日志
    const filteredLogs = useMemo(() => {
        switch (activeTab) {
            case 'system':
                return state.systemLogs || [];
            case 'warning':
                // 合并系统日志和操作日志中的警告和错误
                const allLogs = [...(state.systemLogs || []), ...(state.operationLogs || [])];
                return allLogs.filter(log => log.level === 'warn' || log.level === 'error');
            case 'operation':
                return state.operationLogs || [];
            default:
                return [];
        }
    }, [activeTab, state.systemLogs, state.operationLogs]);

    // 计算各类日志数量
    const counts = useMemo(() => {
        const allLogs = [...(state.systemLogs || []), ...(state.operationLogs || [])];
        return {
            system: state.systemLogs?.length || 0,
            warning: allLogs.filter(log => log.level === 'warn' || log.level === 'error').length,
            operation: state.operationLogs?.length || 0,
        };
    }, [state.systemLogs, state.operationLogs]);

    // 获取当前标签的导出文件名
    const getExportFilename = () => {
        switch (activeTab) {
            case 'system': return '系统日志';
            case 'warning': return '警告日志';
            case 'operation': return '操作日志';
            default: return '日志';
        }
    };

    return (
        <div className="h-full flex flex-col p-6 gap-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ListTodo className="w-6 h-6 text-sky-400" />
                    <h1 className="text-xl font-bold text-white">运行日志中心</h1>
                </div>
                <div className="text-sm text-slate-500">
                    共 {(state.systemLogs?.length || 0) + (state.operationLogs?.length || 0)} 条日志
                </div>
            </div>

            {/* 标签页切换 + 导出按钮 */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <TabButton
                        active={activeTab === 'system'}
                        onClick={() => setActiveTab('system')}
                        icon={ListTodo}
                        label="系统日志"
                        count={counts.system}
                        colorClass="from-sky-600 to-sky-700"
                    />
                    <TabButton
                        active={activeTab === 'warning'}
                        onClick={() => setActiveTab('warning')}
                        icon={AlertTriangle}
                        label="警告/错误"
                        count={counts.warning}
                        colorClass="from-amber-600 to-orange-700"
                    />
                    <TabButton
                        active={activeTab === 'operation'}
                        onClick={() => setActiveTab('operation')}
                        icon={Activity}
                        label="操作日志"
                        count={counts.operation}
                        colorClass="from-purple-600 to-purple-700"
                    />
                </div>

                {/* 导出按钮组 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportToCSV(filteredLogs, getExportFilename())}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium border border-emerald-500/30"
                    >
                        <Download className="w-4 h-4" />
                        导出当前 CSV
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors text-sm font-medium">
                            <Download className="w-4 h-4" />
                            导出全部
                        </button>
                        {/* 下拉菜单 */}
                        <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <button
                                onClick={() => exportToCSV(state.systemLogs || [], '系统日志')}
                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 rounded-t-lg flex items-center gap-2"
                            >
                                <ListTodo className="w-3.5 h-3.5 text-sky-400" />
                                系统日志
                            </button>
                            <button
                                onClick={() => {
                                    const allLogs = [...(state.systemLogs || []), ...(state.operationLogs || [])];
                                    exportToCSV(allLogs.filter(log => log.level === 'warn' || log.level === 'error'), '警告日志');
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"
                            >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                警告/错误
                            </button>
                            <button
                                onClick={() => exportToCSV(state.operationLogs || [], '操作日志')}
                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 rounded-b-lg flex items-center gap-2"
                            >
                                <Activity className="w-3.5 h-3.5 text-purple-400" />
                                操作日志
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 日志列表区域 */}
            <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm shadow-inner">
                <div className="h-full overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => <LogItem key={log.id} log={log} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <Filter className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm">暂无{getExportFilename()}数据</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
