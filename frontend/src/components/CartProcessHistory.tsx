import { useState, useMemo } from 'react';
import { Download, Filter, Calendar, Search } from 'lucide-react';
import type { Cart } from '../types';

/**
 * 工艺历史记录类型
 * NOTE: 基于现有 Cart.steps 数据生成
 */
interface ProcessRecord {
    id: string;
    cartNumber: string;
    processName: string;
    chamberId: string;
    startTime: string;
    endTime: string | null;
    duration: string;
    status: 'completed' | 'active' | 'error' | 'pending';
    batchNo: string;
}

interface CartProcessHistoryProps {
    carts: Cart[];
}

/**
 * 小车工艺历史组件
 * 展示所有小车的工艺执行记录，支持筛选与导出
 */
export function CartProcessHistory({ carts }: CartProcessHistoryProps) {
    // 筛选状态
    const [selectedCartNumbers, setSelectedCartNumbers] = useState<Set<string>>(new Set());
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'active' | 'error'>('all');
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });

    // 从 carts 中提取所有可用的小车编号
    const availableCartNumbers = useMemo(() => {
        return [...new Set(carts.map(c => c.number))].sort();
    }, [carts]);

    // 生成工艺历史记录（基于 steps）
    const processRecords = useMemo<ProcessRecord[]>(() => {
        const records: ProcessRecord[] = [];

        carts.forEach(cart => {
            // 如果有 steps 数据，使用 steps
            if (cart.steps && cart.steps.length > 0) {
                cart.steps.forEach((step, index) => {
                    records.push({
                        id: `${cart.id}-step-${index}`,
                        cartNumber: cart.number,
                        processName: step.name,
                        chamberId: cart.locationChamberId,
                        startTime: step.startTime || '-',
                        endTime: step.endTime || null,
                        duration: step.duration || step.estimatedDuration || '-',
                        status: step.status === 'completed' ? 'completed' : step.status === 'active' ? 'active' : 'pending',
                        batchNo: cart.batchNo || '-'
                    });
                });
            } else {
                // 没有 steps 时，基于当前状态生成单条记录
                records.push({
                    id: `${cart.id}-current`,
                    cartNumber: cart.number,
                    processName: cart.currentTask || '待机',
                    chamberId: cart.locationChamberId,
                    startTime: cart.loadTime || new Date().toISOString(),
                    endTime: null,
                    duration: cart.totalTime || '-',
                    status: cart.currentTask ? 'active' : 'pending',
                    batchNo: cart.batchNo || '-'
                });
            }
        });

        return records;
    }, [carts]);

    // 应用筛选
    const filteredRecords = useMemo(() => {
        return processRecords.filter(record => {
            // 小车编号筛选
            if (selectedCartNumbers.size > 0 && !selectedCartNumbers.has(record.cartNumber)) {
                return false;
            }
            // 状态筛选
            if (selectedStatus !== 'all' && record.status !== selectedStatus) {
                return false;
            }
            // 搜索文本
            if (searchText) {
                const search = searchText.toLowerCase();
                if (!record.cartNumber.toLowerCase().includes(search) &&
                    !record.processName.toLowerCase().includes(search) &&
                    !record.batchNo.toLowerCase().includes(search)) {
                    return false;
                }
            }
            return true;
        });
    }, [processRecords, selectedCartNumbers, selectedStatus, searchText]);

    // 切换小车编号选择
    const toggleCartNumber = (number: string) => {
        const newSet = new Set(selectedCartNumbers);
        if (newSet.has(number)) {
            newSet.delete(number);
        } else {
            newSet.add(number);
        }
        setSelectedCartNumbers(newSet);
    };

    // 状态颜色映射
    const getStatusStyle = (status: ProcessRecord['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-400 bg-green-500/10';
            case 'active':
                return 'text-cyan-400 bg-cyan-500/10 animate-pulse';
            case 'error':
                return 'text-red-400 bg-red-500/10';
            default:
                return 'text-gray-400 bg-gray-500/10';
        }
    };

    const getStatusLabel = (status: ProcessRecord['status']) => {
        switch (status) {
            case 'completed': return '✓ 完成';
            case 'active': return '⚡ 进行中';
            case 'error': return '✕ 异常';
            default: return '○ 待机';
        }
    };

    // 导出 CSV
    const handleExportCsv = () => {
        const headers = ['小车编号', '工艺名称', '工位', '开始时间', '结束时间', '持续时长', '状态', '批次号'];
        const rows = filteredRecords.map(r => [
            r.cartNumber,
            r.processName,
            r.chamberId,
            r.startTime,
            r.endTime || '-',
            r.duration,
            getStatusLabel(r.status),
            r.batchNo
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `工艺历史_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* 筛选栏 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                {/* 第一行: 搜索 + 状态 + 导出 */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* 搜索框 */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="搜索小车编号、工艺名称、批次号..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                    </div>

                    {/* 状态筛选 */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="all">全部状态</option>
                            <option value="completed">已完成</option>
                            <option value="active">进行中</option>
                            <option value="error">异常</option>
                        </select>
                    </div>

                    {/* 导出按钮 */}
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        导出 CSV
                    </button>
                </div>

                {/* 第二行: 小车编号快速筛选 */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400 text-sm">小车:</span>
                    {availableCartNumbers.map(num => (
                        <button
                            key={num}
                            onClick={() => toggleCartNumber(num)}
                            className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${selectedCartNumbers.has(num)
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                    {selectedCartNumbers.size > 0 && (
                        <button
                            onClick={() => setSelectedCartNumbers(new Set())}
                            className="text-xs text-gray-500 hover:text-gray-300 underline cursor-pointer"
                        >
                            清除筛选
                        </button>
                    )}
                </div>
            </div>

            {/* 数据表格 */}
            <div className="flex-1 overflow-auto bg-gray-900/50 border border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">小车编号</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">工艺名称</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">工位</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">开始时间</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">结束时间</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">时长</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">状态</th>
                            <th className="text-left p-3 text-cyan-400 border-b border-gray-700 font-medium">批次号</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center p-8 text-gray-500">
                                    暂无匹配的工艺记录
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map(record => (
                                <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                    <td className="p-3 text-yellow-400 font-mono">{record.cartNumber}</td>
                                    <td className="p-3 text-white">{record.processName}</td>
                                    <td className="p-3 text-gray-300">{record.chamberId}</td>
                                    <td className="p-3 text-gray-300 font-mono text-xs">
                                        {record.startTime !== '-' ? new Date(record.startTime).toLocaleString('zh-CN') : '-'}
                                    </td>
                                    <td className="p-3 text-gray-300 font-mono text-xs">
                                        {record.endTime ? new Date(record.endTime).toLocaleString('zh-CN') : '-'}
                                    </td>
                                    <td className="p-3 text-gray-300">{record.duration}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusStyle(record.status)}`}>
                                            {getStatusLabel(record.status)}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-400 font-mono text-xs">{record.batchNo}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 底部统计 */}
            <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>共 {filteredRecords.length} 条记录</span>
                <span>
                    完成: {filteredRecords.filter(r => r.status === 'completed').length} |
                    进行中: {filteredRecords.filter(r => r.status === 'active').length} |
                    异常: {filteredRecords.filter(r => r.status === 'error').length}
                </span>
            </div>
        </div>
    );
}
