import { useState } from 'react';
import { BarChart3, History, Clock, TrendingUp, Download } from 'lucide-react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { MESDataTable } from '../components/MESDataTable';
import { MESHistoryChart } from '../components/MESHistoryChart';
import { CartProcessHistory } from '../components/CartProcessHistory';
import { ProcessTimeline } from '../components/ProcessTimeline';

// 标签页类型
type TabType = 'realtime' | 'history' | 'timeline' | 'trends';

interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabConfig[] = [
    { id: 'realtime', label: '实时数据', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'history', label: '工艺历史', icon: <History className="w-4 h-4" /> },
    { id: 'timeline', label: '时间轴', icon: <Clock className="w-4 h-4" /> },
    { id: 'trends', label: '趋势图', icon: <TrendingUp className="w-4 h-4" /> },
];

/**
 * 数据统计页面
 * 提供实时数据、工艺历史、时间轴和趋势图等多维度数据展示
 */
export function Statistics() {
    const { state } = useSystemStateContext();
    const [activeTab, setActiveTab] = useState<TabType>('realtime');

    // 渲染标签页内容
    const renderTabContent = () => {
        switch (activeTab) {
            case 'realtime':
                return <MESDataTable carts={state.carts} />;
            case 'history':
                return <CartProcessHistory carts={state.carts} />;
            case 'timeline':
                return <ProcessTimeline carts={state.carts} />;
            case 'trends':
                return <MESHistoryChart lines={state.lines} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* 页面标题栏 */}
            <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-gray-800">
                <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                    数据统计
                </h1>
            </div>

            {/* 标签页导航 - 移动端横向滚动 */}
            <div className="px-3 md:px-6 py-2 md:py-3 border-b border-gray-800 bg-gray-900/50 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 min-w-max">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 p-3 md:p-6 overflow-hidden">
                <div className="h-full">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}
