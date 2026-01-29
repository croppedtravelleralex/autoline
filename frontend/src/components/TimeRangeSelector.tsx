import { useState } from 'react';

export type TimeRange = 'custom' | '1h' | '12h' | '24h';

interface TimeRangeSelectorProps {
    onTimeRangeChange: (startTime: number, endTime: number, rangeType: TimeRange) => void;
}

export function TimeRangeSelector({ onTimeRangeChange }: TimeRangeSelectorProps) {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1h');
    const [customStartTime, setCustomStartTime] = useState('');
    const [customEndTime, setCustomEndTime] = useState('');
    const [error, setError] = useState('');

    // 快捷时间选择处理
    const handleQuickSelect = (range: '1h' | '12h' | '24h') => {
        setSelectedRange(range);
        setError('');

        const now = Date.now();
        let startTime: number;

        switch (range) {
            case '1h':
                startTime = now - 3600 * 1000; // 1小时前
                break;
            case '12h':
                startTime = now - 12 * 3600 * 1000; // 12小时前
                break;
            case '24h':
                startTime = now - 24 * 3600 * 1000; // 24小时前
                break;
        }

        // 转换为秒（后端使用UNIX时间戳，单位秒）
        onTimeRangeChange(startTime / 1000, now / 1000, range);
    };

    // 自定义时间范围处理
    const handleCustomRange = () => {
        if (!customStartTime || !customEndTime) {
            setError('请选择开始和结束时间');
            return;
        }

        const startTime = new Date(customStartTime).getTime();
        const endTime = new Date(customEndTime).getTime();

        if (isNaN(startTime) || isNaN(endTime)) {
            setError('时间格式无效');
            return;
        }

        if (startTime >= endTime) {
            setError('结束时间必须晚于开始时间');
            return;
        }

        const now = Date.now();
        if (endTime > now) {
            setError('结束时间不能晚于当前时间');
            return;
        }

        setError('');
        setSelectedRange('custom');

        // 转换为秒
        onTimeRangeChange(startTime / 1000, endTime / 1000, 'custom');
    };

    // 获取当前时间的datetime-local格式（用于默认值）
    const getCurrentDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localTime = new Date(now.getTime() - offset);
        return localTime.toISOString().slice(0, 16);
    };



    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4">
                {/* 快捷选择按钮 */}
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">快捷选择:</span>
                    <div className="flex gap-2">
                        {(['1h', '12h', '24h'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => handleQuickSelect(range)}
                                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${selectedRange === range
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {range === '1h' ? '最近1小时' : range === '12h' ? '最近12小时' : '最近24小时'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 分隔线 */}
                <div className="h-6 w-px bg-gray-600"></div>

                {/* 自定义时间范围 */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-gray-400 text-sm">自定义范围:</span>

                    <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-xs">开始:</label>
                        <input
                            type="datetime-local"
                            value={customStartTime}
                            onChange={(e) => setCustomStartTime(e.target.value)}
                            max={getCurrentDateTime()}
                            className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-cyan-500 outline-none"
                            placeholder="开始时间"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-xs">结束:</label>
                        <input
                            type="datetime-local"
                            value={customEndTime}
                            onChange={(e) => setCustomEndTime(e.target.value)}
                            max={getCurrentDateTime()}
                            className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-cyan-500 outline-none"
                            placeholder="结束时间"
                        />
                    </div>

                    <button
                        onClick={handleCustomRange}
                        className="px-4 py-1.5 rounded text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                    >
                        查询
                    </button>
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="mt-2 text-red-400 text-sm">
                    ⚠ {error}
                </div>
            )}
        </div>
    );
}
