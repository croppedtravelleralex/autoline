import type { Cart } from '../types';
import { useState } from 'react';

// MES参数配置
const MES_PARAMS = {
    anode: [
        { key: 'temperature', label: '温度 (℃)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'outerTemp', label: '外温 (℃)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'vacuum', label: '真空度 (Pa)', format: (v: number | null | undefined) => v?.toExponential(2) || '-' },
        { key: 'eGunVoltage', label: '电子枪电压 (kV)', format: (v: number | null | undefined) => v?.toFixed(2) || '-' },
        { key: 'eGunCurrent', label: '电子枪电流 (µA)', format: (v: number | null | undefined) => v?.toFixed(0) || '-' },
        { key: 'indiumTemp', label: '铟封温度 (℃)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'sealPressure', label: '压封压力 (N)', format: (v: number | null | undefined) => v?.toFixed(0) || '-' },
        { key: 'batchNo', label: '批次号', format: (v: string | null | undefined) => v || '-' },
        { key: 'recipeVer', label: '配方版本', format: (v: string | null | undefined) => v || '-' },
    ],
    cathode: [
        { key: 'temperature', label: '温度 (℃)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'outerTemp', label: '外温 (℃)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'vacuum', label: '真空度 (Pa)', format: (v: number | null | undefined) => v?.toExponential(2) || '-' },
        { key: 'csCurrent', label: '铯源电流 (A)', format: (v: number | null | undefined) => v?.toFixed(2) || '-' },
        { key: 'o2Pressure', label: 'O₂分压 (Pa)', format: (v: number | null | undefined) => v?.toExponential(2) || '-' },
        { key: 'photoCurrent', label: '光电流 (µA)', format: (v: number | null | undefined) => v?.toFixed(0) || '-' },
        { key: 'growthProgress', label: '生长进度 (%)', format: (v: number | null | undefined) => v?.toFixed(1) || '-' },
        { key: 'batchNo', label: '批次号', format: (v: string | null | undefined) => v || '-' },
        { key: 'recipeVer', label: '配方版本', format: (v: string | null | undefined) => v || '-' },
    ],
};

interface MESDataTableProps {
    carts: Cart[];
}

export function MESDataTable({ carts }: MESDataTableProps) {
    const [selectedParams, setSelectedParams] = useState<Set<string>>(
        new Set(['temperature', 'vacuum', 'batchNo'])
    );
    const [selectedCartType, setSelectedCartType] = useState<'anode' | 'cathode' | 'all'>('all');

    // 过滤小车
    const filteredCarts = carts.filter((cart) => {
        if (selectedCartType === 'all') return true;
        if (selectedCartType === 'anode') return cart.number.startsWith('A');
        if (selectedCartType === 'cathode') return cart.number.startsWith('C');
        return true;
    });

    // 获取参数配置
    const getParams = (cart: Cart) => {
        return cart.number.startsWith('A') ? MES_PARAMS.anode : MES_PARAMS.cathode;
    };

    // 切换参数选择
    const toggleParam = (key: string) => {
        const newSet = new Set(selectedParams);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedParams(newSet);
    };

    // 获取所有可用参数（合并阴阳极）
    const allParams = Array.from(
        new Set([...MES_PARAMS.anode, ...MES_PARAMS.cathode].map((p) => p.key))
    ).map((key) => {
        const param = [...MES_PARAMS.anode, ...MES_PARAMS.cathode].find((p) => p.key === key);
        return param!;
    });

    return (
        <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-4 h-full overflow-hidden flex flex-col">
            <h2 className="text-cyan-400 text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                MES 数据统计表
            </h2>

            {/* 过滤器 */}
            <div className="mb-4 space-y-3">
                {/* 小车类型选择 */}
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">小车类型:</span>
                    <div className="flex gap-2">
                        {(['all', 'anode', 'cathode'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedCartType(type)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${selectedCartType === type
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {type === 'all' ? '全部' : type === 'anode' ? '阳极' : '阴极'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 参数选择器 */}
                <div className="border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-400 text-sm mb-2">选择显示参数:</div>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {allParams.map((param) => (
                            <label
                                key={param.key}
                                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-800 p-1 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedParams.has(param.key)}
                                    onChange={() => toggleParam(param.key)}
                                    className="w-3 h-3 accent-cyan-500"
                                />
                                <span className="text-gray-300">{param.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* 数据表格 */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr>
                            <th className="text-left p-2 text-cyan-400 border-b border-gray-700">小车编号</th>
                            <th className="text-left p-2 text-cyan-400 border-b border-gray-700">当前位置</th>
                            <th className="text-left p-2 text-cyan-400 border-b border-gray-700">工艺状态</th>
                            {allParams
                                .filter((p) => selectedParams.has(p.key))
                                .map((param) => (
                                    <th key={param.key} className="text-left p-2 text-cyan-400 border-b border-gray-700">
                                        {param.label}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCarts.length === 0 ? (
                            <tr>
                                <td colSpan={3 + selectedParams.size} className="text-center p-4 text-gray-500">
                                    暂无数据
                                </td>
                            </tr>
                        ) : (
                            filteredCarts.map((cart) => {
                                const params = getParams(cart);
                                return (
                                    <tr key={cart.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-2 text-yellow-400 font-mono">{cart.number}</td>
                                        <td className="p-2 text-gray-300">{cart.locationChamberId}</td>
                                        <td className="p-2 text-gray-300">{cart.currentTask}</td>
                                        {params
                                            .filter((p) => selectedParams.has(p.key))
                                            .map((param) => {
                                                const value = (cart as any)[param.key];
                                                return (
                                                    <td key={param.key} className="p-2 text-gray-300 font-mono">
                                                        {param.format(value)}
                                                    </td>
                                                );
                                            })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
