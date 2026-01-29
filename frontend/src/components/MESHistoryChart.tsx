import { useState, useEffect } from 'react';
import type { Cart, LineData } from '../types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TimeRangeSelector, type TimeRange } from './TimeRangeSelector';
import { fetchCartHistory, type HistoryDataPoint } from '../api/history';

interface MESHistoryChartProps {
    lines: LineData[];
    carts?: Cart[]; // Optional now, kept for compatibility if needed but unused for selection
}

export function MESHistoryChart({ lines }: MESHistoryChartProps) {
    const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);

    // Selection state
    const [selectedLineId, setSelectedLineId] = useState<string>('');
    const [selectedChamberId, setSelectedChamberId] = useState<string>('');
    const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'vacuum'>('temperature');

    const [timeRange, setTimeRange] = useState<{ start: number; end: number; type: TimeRange }>({
        start: Date.now() / 1000 - 3600, // 默认1小时前
        end: Date.now() / 1000,
        type: '1h'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-select first line and first chamber
    useEffect(() => {
        if (lines.length > 0) {
            if (!selectedLineId) {
                setSelectedLineId(lines[0].id);
            }
        }
    }, [lines, selectedLineId]);

    // Auto-select first chamber when line changes
    useEffect(() => {
        if (selectedLineId) {
            const line = lines.find(l => l.id === selectedLineId);
            if (line) {
                const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
                if (allChambers.length > 0 && !allChambers.find(c => c.id === selectedChamberId)) {
                    setSelectedChamberId(allChambers[0].id);
                }
            }
        }
    }, [selectedLineId, lines, selectedChamberId]);

    // Fetch history when selection changes
    useEffect(() => {
        if (!selectedChamberId) {
            setHistoryData([]);
            return;
        }

        const loadHistoryData = async () => {
            setLoading(true);
            setError('');

            try {
                // We use fetchCartHistory but pass chamber ID - the backend supports generic entity IDs
                const data = await fetchCartHistory(
                    selectedChamberId,
                    selectedMetric,
                    timeRange.start,
                    timeRange.end
                );
                setHistoryData(data);
            } catch (err) {
                console.error('Failed to load history data:', err);
                setError('加载历史数据失败');
                setHistoryData([]);
            } finally {
                setLoading(false);
            }
        };

        loadHistoryData();
    }, [selectedChamberId, selectedMetric, timeRange]);

    // Get current line and chamber for display
    const currentLine = lines.find(l => l.id === selectedLineId);
    const availableChambers = currentLine
        ? [...(currentLine.anodeChambers || []), ...(currentLine.cathodeChambers || [])]
        : [];
    const currentChamber = availableChambers.find(c => c.id === selectedChamberId);

    // Update time range handler
    const handleTimeRangeChange = (startTime: number, endTime: number, rangeType: TimeRange) => {
        setTimeRange({ start: startTime, end: endTime, type: rangeType });
    };

    // Formatters
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        switch (timeRange.type) {
            case '1h':
                return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            case '12h':
            case '24h':
            case 'custom':
                return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            default:
                return date.toLocaleTimeString('zh-CN');
        }
    };

    const formatYAxis = (value: number) => {
        if (selectedMetric === 'vacuum') return value.toExponential(1);
        return value.toFixed(1);
    };

    const getMetricLabel = () => {
        return selectedMetric === 'temperature' ? '温度 (℃)' : '真空度 (Pa)';
    };

    const getMetricColor = () => {
        return selectedMetric === 'temperature' ? '#ef4444' : '#06b6d4';
    };

    return (
        <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-4 h-full overflow-hidden flex flex-col gap-4">
            <h2 className="text-cyan-400 text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">📈</span>
                历史趋势图 (腔体数据)
            </h2>

            {/* Controls */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />

                    <div className="text-gray-500 text-xs ml-auto">
                        数据点: {historyData.length}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-gray-950/50 p-2 rounded border border-gray-800">
                    {/* Line Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">线体:</span>
                        <select
                            value={selectedLineId}
                            onChange={(e) => setSelectedLineId(e.target.value)}
                            className="bg-gray-800 text-white px-3 py-1 rounded text-sm border border-gray-700 focus:border-cyan-500 outline-none min-w-[120px]"
                        >
                            {lines.map((line) => (
                                <option key={line.id} value={line.id}>{line.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chamber Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">腔体:</span>
                        <select
                            value={selectedChamberId}
                            onChange={(e) => setSelectedChamberId(e.target.value)}
                            className="bg-gray-800 text-white px-3 py-1 rounded text-sm border border-gray-700 focus:border-cyan-500 outline-none min-w-[160px]"
                        >
                            {availableChambers.map((chamber) => (
                                <option key={chamber.id} value={chamber.id}>
                                    {chamber.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Metric Selector */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex gap-2">
                            {(['temperature', 'vacuum'] as const).map((metric) => (
                                <button
                                    key={metric}
                                    onClick={() => setSelectedMetric(metric)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedMetric === metric
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {metric === 'temperature' ? '温度' : '真空度'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-cyan-400">
                        <div className="animate-pulse">正在加载数据...</div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-red-400">
                        ⚠ {error}
                    </div>
                ) : historyData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                        <div className="text-4xl">📊</div>
                        <div>暂无历史数据</div>
                        {currentChamber && (
                            <div className="text-xs text-gray-600">
                                腔体 {currentChamber.name} 在所选时间范围内没有数据记录
                            </div>
                        )}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={historyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatTime}
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                tickFormatter={formatYAxis}
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                domain={selectedMetric === 'vacuum' ? ['auto', 'auto'] : [0, 'auto']}
                                scale={selectedMetric === 'vacuum' ? 'log' : 'auto'}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #06b6d4',
                                    borderRadius: '4px',
                                }}
                                labelFormatter={(label: any) => formatTime(label as number)}
                                formatter={(value: any) => [formatYAxis(value as number), getMetricLabel()]}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={getMetricColor()}
                                strokeWidth={2}
                                dot={false}
                                name={getMetricLabel()}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
