import { useState, useMemo } from 'react';
import { Clock, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Cart } from '../types';

/**
 * 时间轴条目类型
 */
interface TimelineBlock {
    id: string;
    cartNumber: string;
    processName: string;
    startTime: number; // Unix timestamp (ms)
    endTime: number | null; // Unix timestamp (ms), null = still running
    status: 'completed' | 'active' | 'error' | 'pending';
    chamberId: string;
    nextStep?: string; // 下一工段
    upcomingSteps?: string[]; // 将要执行的工段列表
}

interface ProcessTimelineProps {
    carts: Cart[];
}

// 时间范围选项
type TimeScale = '1h' | '6h' | '12h' | '24h';

const TIME_SCALES: { value: TimeScale; label: string; ms: number }[] = [
    { value: '1h', label: '1小时', ms: 60 * 60 * 1000 },
    { value: '6h', label: '6小时', ms: 6 * 60 * 60 * 1000 },
    { value: '12h', label: '12小时', ms: 12 * 60 * 60 * 1000 },
    { value: '24h', label: '24小时', ms: 24 * 60 * 60 * 1000 },
];

/**
 * 工艺时间轴组件（甘特图）
 * 以可视化方式展示多辆小车的工艺执行时间线
 */
export function ProcessTimeline({ carts }: ProcessTimelineProps) {
    const [timeScale, setTimeScale] = useState<TimeScale>('6h');
    const [timeOffset, setTimeOffset] = useState(0); // 时间偏移（用于左右滚动）

    // 当前时间范围
    const now = Date.now();
    const scaleDuration = TIME_SCALES.find(s => s.value === timeScale)?.ms || 6 * 60 * 60 * 1000;
    const timeStart = now - scaleDuration + timeOffset;
    const timeEnd = now + timeOffset;

    // 生成时间轴数据
    const timelineData = useMemo(() => {
        const data: { cartNumber: string; blocks: TimelineBlock[] }[] = [];

        // 按小车编号分组
        const cartNumbers = [...new Set(carts.map(c => c.number))].sort();

        cartNumbers.forEach(cartNumber => {
            const cart = carts.find(c => c.number === cartNumber);
            if (!cart) return;

            const blocks: TimelineBlock[] = [];

            // 如果有 steps，则使用 steps 数据
            if (cart.steps && cart.steps.length > 0) {
                cart.steps.forEach((step, index) => {
                    const startTime = step.startTime ? new Date(step.startTime).getTime() : now - (cart.steps!.length - index) * 30 * 60 * 1000;
                    const endTime = step.endTime ? new Date(step.endTime).getTime() : (step.status === 'active' ? null : startTime + 30 * 60 * 1000);

                    // 获取下一工段和将要执行的工段
                    const remainingSteps = cart.steps!.slice(index + 1);
                    const nextStep = remainingSteps[0]?.name;
                    const upcomingSteps = remainingSteps.slice(1, 3).map(s => s.name); // 取接下来2个

                    blocks.push({
                        id: `${cart.id}-step-${index}`,
                        cartNumber,
                        processName: step.name,
                        startTime,
                        endTime,
                        status: step.status === 'completed' ? 'completed' : step.status === 'active' ? 'active' : 'pending',
                        chamberId: cart.locationChamberId,
                        nextStep,
                        upcomingSteps
                    });
                });
            } else {
                // 没有 steps 时，基于当前任务生成一个模拟块
                const loadTime = cart.loadTime ? new Date(cart.loadTime).getTime() : now - 60 * 60 * 1000;
                blocks.push({
                    id: `${cart.id}-current`,
                    cartNumber,
                    processName: cart.currentTask || '待机',
                    startTime: loadTime,
                    endTime: cart.currentTask ? null : loadTime + 30 * 60 * 1000,
                    status: cart.currentTask ? 'active' : 'pending',
                    chamberId: cart.locationChamberId,
                    nextStep: cart.nextTask || undefined,
                    upcomingSteps: []
                });
            }

            data.push({ cartNumber, blocks });
        });

        return data;
    }, [carts, now]);

    // 状态颜色
    const getBlockColor = (status: TimelineBlock['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-500/80';
            case 'active': return 'bg-cyan-500/80 animate-pulse';
            case 'error': return 'bg-red-500/80';
            default: return 'bg-gray-600/80';
        }
    };

    // 计算时间轴标记
    const timeMarkers = useMemo(() => {
        const markers: { time: number; label: string }[] = [];
        const interval = scaleDuration / 6; // 6个标记点

        for (let i = 0; i <= 6; i++) {
            const time = timeStart + i * interval;
            const date = new Date(time);
            markers.push({
                time,
                label: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });
        }

        return markers;
    }, [timeStart, scaleDuration]);

    // 计算块的位置和宽度
    const getBlockStyle = (block: TimelineBlock) => {
        const blockStart = Math.max(block.startTime, timeStart);
        const blockEnd = block.endTime ? Math.min(block.endTime, timeEnd) : timeEnd;

        // 如果块完全在视野外，隐藏
        if (blockEnd < timeStart || block.startTime > timeEnd) {
            return { display: 'none' };
        }

        const left = ((blockStart - timeStart) / scaleDuration) * 100;
        const width = ((blockEnd - blockStart) / scaleDuration) * 100;

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100 - Math.max(0, left), Math.max(1, width))}%`,
        };
    };

    // 时间导航
    const handleTimeNav = (direction: 'left' | 'right') => {
        const step = scaleDuration / 4;
        setTimeOffset(prev => direction === 'left' ? prev - step : prev + step);
    };

    const handleReset = () => {
        setTimeOffset(0);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* 控制栏 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                {/* 时间范围选择 */}
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-sm">时间范围:</span>
                    <div className="flex gap-1">
                        {TIME_SCALES.map(scale => (
                            <button
                                key={scale.value}
                                onClick={() => setTimeScale(scale.value)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${timeScale === scale.value
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {scale.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 时间导航 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleTimeNav('left')}
                        className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors cursor-pointer"
                        title="向前"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors cursor-pointer"
                    >
                        现在
                    </button>
                    <button
                        onClick={() => handleTimeNav('right')}
                        className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors cursor-pointer"
                        title="向后"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 时间轴主体 */}
            <div className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                {/* 时间标尺 */}
                <div className="h-8 bg-gray-800 border-b border-gray-700 flex relative">
                    <div className="w-24 shrink-0 border-r border-gray-700"></div>
                    <div className="flex-1 relative">
                        {timeMarkers.map((marker, index) => (
                            <div
                                key={index}
                                className="absolute top-0 h-full flex flex-col items-center justify-center"
                                style={{ left: `${(index / 6) * 100}%` }}
                            >
                                <span className="text-xs text-gray-500">{marker.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 时间轴行 */}
                <div className="flex-1 overflow-auto">
                    {timelineData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            暂无小车数据
                        </div>
                    ) : (
                        timelineData.map(row => (
                            <div
                                key={row.cartNumber}
                                className="h-12 flex border-b border-gray-800 hover:bg-gray-800/30"
                            >
                                {/* 小车编号 */}
                                <div className="w-24 shrink-0 flex items-center justify-center border-r border-gray-800">
                                    <span className="text-yellow-400 font-mono text-sm">{row.cartNumber}</span>
                                </div>

                                {/* 时间轴区域 */}
                                <div className="flex-1 relative">
                                    {row.blocks.map(block => {
                                        const style = getBlockStyle(block);
                                        if (style.display === 'none') return null;

                                        return (
                                            <div
                                                key={block.id}
                                                className={`absolute top-2 h-8 rounded ${getBlockColor(block.status)} flex items-center overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-white/30`}
                                                style={style}
                                                title={`${block.processName}\n${block.chamberId}\n${new Date(block.startTime).toLocaleString('zh-CN')}`}
                                            >
                                                {/* 当前工艺名称 */}
                                                <span className="text-white text-xs font-bold px-2 truncate">
                                                    {block.processName}
                                                </span>

                                                {/* 下一工段标注 - 直接显示在块右侧 */}
                                                {block.nextStep && block.status === 'active' && (
                                                    <span className="ml-auto px-2 py-0.5 bg-black/40 text-amber-400 text-[10px] font-bold rounded-l flex items-center gap-1 whitespace-nowrap">
                                                        <span className="opacity-60">→</span> {block.nextStep}
                                                    </span>
                                                )}

                                                {/* 悬停提示 - 增强版 */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 border border-gray-600 rounded-lg p-3 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl min-w-[180px]">
                                                    <div className="text-cyan-400 font-bold text-sm mb-2">{block.processName}</div>
                                                    <div className="space-y-1 text-gray-400">
                                                        <div>工位: <span className="text-white">{block.chamberId}</span></div>
                                                        <div>开始: <span className="text-white">{new Date(block.startTime).toLocaleTimeString('zh-CN')}</span></div>
                                                        {block.endTime && (
                                                            <div>结束: <span className="text-white">{new Date(block.endTime).toLocaleTimeString('zh-CN')}</span></div>
                                                        )}
                                                    </div>

                                                    {/* 下一工段与后续流程 */}
                                                    {(block.nextStep || (block.upcomingSteps && block.upcomingSteps.length > 0)) && (
                                                        <div className="mt-3 pt-2 border-t border-gray-700">
                                                            {block.nextStep && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-amber-500 font-bold">下一工段:</span>
                                                                    <span className="text-white font-medium">{block.nextStep}</span>
                                                                </div>
                                                            )}
                                                            {block.upcomingSteps && block.upcomingSteps.length > 0 && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-gray-500">后续流程:</span>
                                                                    <span className="text-gray-300 text-[10px]">{block.upcomingSteps.join(' → ')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500/80"></div>
                    <span>已完成</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-cyan-500/80 animate-pulse"></div>
                    <span>进行中</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/80"></div>
                    <span>异常</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-600/80"></div>
                    <span>待机</span>
                </div>
            </div>
        </div>
    );
}
