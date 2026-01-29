import { useState, useEffect } from 'react';
import { X, RefreshCw, FileText } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface LoadUnloadModalProps {
    isOpen: boolean;
    type: 'load' | 'unload'; // load: 进样(填数据), unload: 出样(确认)
    lineName: string;
    lineType?: 'anode' | 'cathode'; // 新增: 用于过滤配方
    onConfirm: (data?: any) => void;
    onCancel: () => void;
}

interface MESData {
    batchNo: string;
    materialCode: string;
    quantity: number;
    operator: string;
    workOrder: string;
    recipeId: string;
}

// 随机生成 MES 数据
const generateRandomData = () => ({
    batchNo: `BATCH-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    materialCode: `MAT-${Math.floor(Math.random() * 10000)}`,
    quantity: 24,
    operator: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
    workOrder: `WO${Date.now().toString().slice(-8)}`,
    recipeId: ''
});

export function LoadUnloadModal({ isOpen, type, lineName, lineType, onConfirm, onCancel }: LoadUnloadModalProps) {
    const [data, setData] = useState<MESData>(generateRandomData());
    const { recipes } = useSettings();

    // 过滤适用配方
    const availableRecipes = recipes.filter(r =>
        !lineType || r.targetLineType === lineType
    );

    useEffect(() => {
        if (isOpen && type === 'load') {
            const initialData = generateRandomData();
            // 自动选择默认配方
            const defaultRecipe = availableRecipes.find(r => r.isDefault);
            if (defaultRecipe) {
                initialData.recipeId = defaultRecipe.id;
            } else if (availableRecipes.length > 0) {
                initialData.recipeId = availableRecipes[0].id;
            }
            setData(initialData);
        }
    }, [isOpen, type, lineType, recipes]); // accessibleRecipes depends on recipes and lineType

    if (!isOpen) return null;

    const handleRandomize = () => {
        const newData = generateRandomData();
        // Keep selected recipe
        newData.recipeId = data.recipeId;
        setData(newData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-white/10 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border dark:border-white/5 bg-muted dark:bg-slate-950">
                    <h3 className="text-lg font-bold text-foreground dark:text-white">
                        {type === 'load' ? '进样信息录入' : '出样确认'}
                        <span className="ml-2 text-sm font-normal text-muted-foreground dark:text-slate-400">({lineName} {lineType === 'anode' ? '阳极' : lineType === 'cathode' ? '阴极' : ''})</span>
                    </h3>
                    <button onClick={onCancel} className="text-muted-foreground dark:text-slate-500 hover:text-foreground dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {type === 'load' ? (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground dark:text-slate-400">MES 参数对接</span>
                                <button
                                    onClick={handleRandomize}
                                    className="text-xs flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    随机生成
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block flex items-center">
                                        <FileText className="w-3 h-3 mr-1" />
                                        工艺配方
                                    </label>
                                    <select
                                        value={data.recipeId}
                                        onChange={e => setData({ ...data, recipeId: e.target.value })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none appearance-none"
                                    >
                                        <option value="">请选择配方...</option>
                                        {availableRecipes.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} (v{r.version}) {r.isDefault ? '[默认]' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block">工单号</label>
                                    <input
                                        value={data.workOrder}
                                        onChange={e => setData({ ...data, workOrder: e.target.value })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block">批次号</label>
                                    <input
                                        value={data.batchNo}
                                        onChange={e => setData({ ...data, batchNo: e.target.value })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block">物料编码</label>
                                    <input
                                        value={data.materialCode}
                                        onChange={e => setData({ ...data, materialCode: e.target.value })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block">数量 (pcs)</label>
                                    <input
                                        type="number"
                                        value={data.quantity}
                                        onChange={e => setData({ ...data, quantity: parseInt(e.target.value) })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <label className="text-xs text-muted-foreground dark:text-slate-500 block">操作员</label>
                                    <input
                                        value={data.operator}
                                        onChange={e => setData({ ...data, operator: e.target.value })}
                                        className="w-full bg-muted/50 dark:bg-slate-800 border border-border dark:border-white/10 rounded px-2 py-1.5 text-sm text-foreground dark:text-white focus:ring-1 focus:ring-sky-500 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="text-muted-foreground dark:text-slate-300 text-lg">确认要执行出样操作吗？</p>
                            <p className="text-muted-foreground/70 dark:text-slate-500 text-sm mt-2">该操作将移除当前出样仓内的小车。</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-muted/30 dark:bg-slate-950/50 border-t border-border dark:border-white/5">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5 transition-colors font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(data)}
                        className={`px-6 py-2 rounded-lg text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${type === 'load'
                            ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-900/40"
                            : "bg-amber-600 hover:bg-amber-500 hover:shadow-amber-900/40"
                            }`}
                    >
                        {type === 'load' ? '确认进样' : '确认出样'}
                    </button>
                </div>
            </div>
        </div>
    );
}
