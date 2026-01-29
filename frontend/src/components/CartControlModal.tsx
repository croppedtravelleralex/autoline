import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Truck, Timer, MapPin, Thermometer, Zap, FlaskConical, Package, Edit2, Check, Trash2 } from 'lucide-react';
import type { Cart, LineData } from '../types';
import { useToast } from '../context/ToastContext';

interface CartControlModalProps {
    cart: Cart | null;
    lines: LineData[]; // 用于查找腔体名称
    onClose: () => void;
    onMove: (cartId: string, direction: 'forward' | 'backward') => void;
    onUpdateCart?: (cartId: string, updates: Partial<Cart>) => Promise<any>;
    onDelete?: (cartId: string) => void;
}

// 校验数值是否有效
const isValidNumber = (value: any): value is number => {
    return typeof value === 'number' && !isNaN(value);
};

// 格式化温度类字段 (保留两位小数)
const formatTemperature = (value?: number | null) => {
    if (!isValidNumber(value)) return '--';
    return value.toFixed(2);
};

// 格式化真空度显示
const formatVacuum = (value?: number | null) => {
    if (!isValidNumber(value)) return '--';
    if (value < 0.01) return value.toExponential(1);
    return value.toFixed(2);
};

// 格式化完整日期时间 (YYYY-MM-DD HH:mm:ss)
const formatFullDateTime = (iso?: string | null) => {
    if (!iso) return '--';
    try {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return '--';
        const Y = date.getFullYear();
        const M = String(date.getMonth() + 1).padStart(2, '0');
        const D = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${Y}-${M}-${D} ${h}:${m}:${s}`;
    } catch {
        return '--';
    }
};

// 格式化步序时间 (MM-DD HH:mm)
const formatStepTime = (iso?: string | null) => {
    if (!iso) return '--';
    try {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return '--';
        const M = String(date.getMonth() + 1).padStart(2, '0');
        const D = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${M}-${D} ${h}:${m}`;
    } catch {
        return '--';
    }
};

// 参数显示组件
const ParamRow = ({ label, value, unit, highlight }: { label: string; value: string | number | undefined | null; unit?: string; highlight?: boolean }) => {
    const displayValue = (typeof value === 'number') ? (isValidNumber(value) ? value : '--') : (value ?? '--');

    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-slate-500">{label}</span>
            <span className={`text-[11px] font-mono ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                {displayValue}{displayValue !== '--' && unit && <span className="text-muted-foreground dark:text-slate-500 ml-0.5">{unit}</span>}
            </span>
        </div>
    );
};

export const CartControlModal = ({ cart, lines, onClose, onMove, onUpdateCart, onDelete }: CartControlModalProps) => {
    const [isEditingNumber, setIsEditingNumber] = useState(false);
    const [editedNumber, setEditedNumber] = useState(cart?.number || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(cart?.name || '');
    const { showToast } = useToast();

    // Sync state when cart changes
    useEffect(() => {
        if (cart) {
            setEditedNumber(cart.number);
            setEditedName(cart.name || '');
            setIsEditingNumber(false);
            setIsEditingName(false);
        }
    }, [cart?.id]);

    if (!cart) return null;

    // 查找腔体名称
    const findChamberName = (chamberId: string): string => {
        for (const line of lines) {
            const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
            const chamber = allChambers.find(c => c.id === chamberId);
            if (chamber) return chamber.name;
        }
        return chamberId; // 如果找不到，返回ID
    };

    // 判断是阳极还是阴极小车
    const isAnodeCart = cart.number.startsWith('A');
    const chamberName = findChamberName(cart.locationChamberId);

    // 保存编号
    const handleSaveNumber = async () => {
        if (onUpdateCart && editedNumber.trim()) {
            try {
                await onUpdateCart(cart.id, { number: editedNumber.trim() });
                setIsEditingNumber(false);
            } catch (error) {
                console.error('编号保存失败:', error);
                showToast('保存失败，请重试', 'error');
            }
        } else {
            setIsEditingNumber(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-card dark:bg-slate-900 border border-border dark:border-sky-500/30 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-sky-900/20 overflow-hidden"
                >
                    {/* Header - 紧凑设计 */}
                    <div className="relative bg-muted/50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 border-b border-border dark:border-white/5 px-4 py-3 flex items-center justify-between">
                        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                                <Truck className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                            </div>
                            <div className="flex-1">
                                {/* 可编辑的名称（主标题） */}
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="text-lg font-bold text-foreground dark:text-white bg-muted dark:bg-slate-800 border border-border dark:border-sky-500/50 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            autoFocus
                                            placeholder="输入小车名称..."
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    if (onUpdateCart && editedName.trim()) {
                                                        try {
                                                            await onUpdateCart(cart.id, { name: editedName.trim() });
                                                            setIsEditingName(false);
                                                        } catch (error) {
                                                            console.error('名称保存失败:', error);
                                                            showToast('保存失败，请重试', 'error');
                                                        }
                                                    } else {
                                                        setIsEditingName(false);
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (onUpdateCart && editedName.trim()) {
                                                    try {
                                                        await onUpdateCart(cart.id, { name: editedName.trim() });
                                                        setIsEditingName(false);
                                                    } catch (error) {
                                                        console.error('名称保存失败:', error);
                                                        showToast('保存失败，请重试', 'error');
                                                    }
                                                } else {
                                                    setIsEditingName(false);
                                                }
                                            }}
                                            className="p-1 bg-emerald-500/20 rounded hover:bg-emerald-500/30"
                                        >
                                            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/name mb-1">
                                        <h2
                                            className="text-lg font-bold text-foreground dark:text-white tracking-tight cursor-text"
                                            onDoubleClick={() => setIsEditingName(true)}
                                        >
                                            {cart.name || (isAnodeCart ? '阳极小车' : '阴极小车')}
                                        </h2>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="p-1 opacity-0 group-hover/name:opacity-100 hover:bg-muted dark:hover:bg-white/10 rounded transition-all"
                                        >
                                            <Edit2 className="w-3 h-3 text-muted-foreground dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400" />
                                        </button>
                                    </div>
                                )}

                                {/* 可编辑的编号（副标题） */}
                                {isEditingNumber ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={editedNumber}
                                            onChange={(e) => setEditedNumber(e.target.value)}
                                            className="text-[11px] font-black text-sky-400 bg-muted dark:bg-slate-800 border border-border dark:border-sky-500/50 rounded px-2 py-0.5 w-24 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNumber()}
                                        />
                                        <button onClick={handleSaveNumber} className="p-0.5 bg-sky-500/20 rounded hover:bg-sky-500/30">
                                            <Check className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/num">
                                        <span className="text-[11px] font-black text-sky-500 dark:text-sky-400 tracking-widest">{cart.number}</span>
                                        <button
                                            onClick={() => { setEditedNumber(cart.number); setIsEditingNumber(true); }}
                                            className="p-0.5 opacity-0 group-hover/num:opacity-100 hover:bg-muted dark:hover:bg-white/10 rounded transition-all"
                                        >
                                            <Edit2 className="w-2.5 h-2.5 text-muted-foreground dark:text-slate-500 hover:text-sky-500 dark:hover:text-sky-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(cart.id);
                                    }}
                                    className="p-2 hover:bg-red-500/20 rounded-full transition-colors group/del"
                                    title="删除小车"
                                >
                                    <Trash2 className="w-5 h-5 text-muted-foreground dark:text-slate-400 group-hover/del:text-red-500 dark:group-hover/del:text-red-400" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted dark:hover:bg-white/10 rounded-full transition-colors text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content - 紧凑的参数展示 */}
                    <div className="p-4 space-y-4">
                        {/* 基础信息行 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 text-[9px] font-bold uppercase mb-1">
                                    <MapPin className="w-3 h-3" /> 当前位置
                                </div>
                                <div className="text-sm font-bold text-foreground dark:text-white truncate">{chamberName}</div>
                            </div>
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 text-[9px] font-bold uppercase mb-1">
                                    <Timer className="w-3 h-3" /> 工序进度
                                </div>
                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{cart.progress?.toFixed(1)}%</div>
                            </div>
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 text-[9px] font-bold uppercase mb-1">
                                    <Timer className="w-3 h-3" /> 剩余时间
                                </div>
                                <div className="text-sm font-bold text-sky-600 dark:text-sky-400">{cart.remainingTime}</div>
                            </div>
                        </div>

                        {/* MES 参数区域 - 分组显示 */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* 环境参数 */}
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2.5 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase mb-2 border-b border-border dark:border-white/5 pb-1">
                                    <Thermometer className="w-3 h-3" /> 环境参数
                                </div>
                                <div className="space-y-0.5">
                                    <ParamRow label="温度" value={formatTemperature(cart.temperature)} unit="°C" highlight />
                                    <ParamRow label="目标温度" value={formatTemperature(cart.targetTemp)} unit="°C" />
                                    <ParamRow label="真空度" value={formatVacuum(cart.vacuum)} unit="Pa" highlight />
                                    <ParamRow label="目标真空" value={formatVacuum(cart.targetVacuum)} unit="Pa" />
                                </div>
                            </div>

                            {/* 工艺参数（根据阳极/阴极显示不同内容） */}
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2.5 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase mb-2 border-b border-border dark:border-white/5 pb-1">
                                    <Zap className="w-3 h-3" /> {isAnodeCart ? '阳极工艺' : '阴极工艺'}
                                </div>
                                <div className="space-y-0.5">
                                    {isAnodeCart ? (
                                        <>
                                            <ParamRow label="电子枪电压" value={cart.eGunVoltage} unit="kV" />
                                            <ParamRow label="发射电流" value={cart.eGunCurrent} unit="µA" />
                                            <ParamRow label="铟封温度" value={formatTemperature(cart.indiumTemp)} unit="°C" />
                                            <ParamRow label="压封压力" value={cart.sealPressure} unit="N" />
                                        </>
                                    ) : (
                                        <>
                                            <ParamRow label="铯源电流" value={cart.csCurrent} unit="A" />
                                            <ParamRow label="氧分压" value={formatVacuum(cart.o2Pressure)} unit="Pa" />
                                            <ParamRow label="光电流" value={cart.photoCurrent} unit="µA" highlight />
                                            <ParamRow label="生长进度" value={cart.growthProgress} unit="%" highlight />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 物料追溯 */}
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2.5 border border-border dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 text-[9px] font-bold uppercase mb-2 border-b border-border dark:border-white/5 pb-1">
                                    <Package className="w-3 h-3" /> 物料追溯
                                </div>
                                <div className="space-y-0.5">
                                    <ParamRow label="批次号" value={cart.batchNo || cart.content} />
                                    <ParamRow label="配方版本" value={cart.recipeVer} />
                                    <ParamRow label="进样时间" value={formatFullDateTime(cart.loadTime)} />
                                </div>
                            </div>

                            {/* 工序信息 */}
                            <div className="bg-muted/50 dark:bg-slate-950/50 rounded-lg p-2.5 border border-border dark:border-white/5 col-span-2">
                                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-[9px] font-bold uppercase mb-2 border-b border-border dark:border-white/5 pb-1">
                                    <FlaskConical className="w-3 h-3" /> 工序详细信息
                                </div>

                                {/* 步骤列表 */}
                                <div className="space-y-1 mb-2">
                                    <div className="grid grid-cols-5 gap-2 text-[9px] text-muted-foreground dark:text-slate-500 font-bold px-1.5 pb-1 border-b border-border dark:border-white/5">
                                        <span className="col-span-1">工序名称</span>
                                        <span className="col-span-1">状态</span>
                                        <span className="col-span-1 text-center">开始/结束</span>
                                        <span className="col-span-1 text-center">持续时间</span>
                                        <span className="col-span-1 text-right">预计时长</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                                        {cart.steps && cart.steps.length > 0 ? (
                                            cart.steps.map(step => {
                                                const isActive = step.status === 'active';
                                                const isCompleted = step.status === 'completed';

                                                return (
                                                    <div key={step.id} className={`grid grid-cols-5 gap-2 px-1.5 py-1 rounded text-[9px] items-center ${isActive ? 'bg-purple-100 dark:bg-purple-500/10 border border-purple-500/20' : 'hover:bg-muted dark:hover:bg-white/5'}`}>
                                                        <span className={`col-span-1 font-medium truncate ${isActive ? 'text-purple-700 dark:text-purple-300' : isCompleted ? 'text-muted-foreground dark:text-slate-400' : 'text-muted-foreground/70 dark:text-slate-600'}`}>
                                                            {step.name}
                                                        </span>
                                                        <div className="col-span-1 flex items-center gap-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-purple-500 dark:bg-purple-400 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'}`} />
                                                            <span className={isActive ? 'text-foreground dark:text-white' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground dark:text-slate-600'}>
                                                                {step.status === 'active' ? '进行中' : step.status === 'completed' ? '已完成' : '未开始'}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1 text-center flex flex-col leading-none gap-0.5">
                                                            {step.startTime && <span className="text-foreground dark:text-slate-300">{formatStepTime(step.startTime)}</span>}
                                                            {step.endTime && <span className="text-muted-foreground dark:text-slate-500">{formatStepTime(step.endTime)}</span>}
                                                            {!step.startTime && <span className="text-muted-foreground/50 dark:text-slate-700">--</span>}
                                                        </div>
                                                        <div className="col-span-1 text-center font-mono text-muted-foreground dark:text-slate-400">
                                                            {step.duration || '--'}
                                                        </div>
                                                        <div className="col-span-1 text-right font-mono text-muted-foreground dark:text-slate-500">
                                                            {step.estimatedDuration}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center text-[10px] text-muted-foreground dark:text-slate-600 py-2">暂无工序记录</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1 border-t border-border dark:border-white/5 text-[9px]">
                                    <span className="text-muted-foreground dark:text-slate-500">当前工序: <span className="text-purple-600 dark:text-purple-400 font-bold ml-1">{cart.currentTask}</span></span>
                                    <span className="text-muted-foreground dark:text-slate-500">总预计: <span className="text-foreground dark:text-slate-300 font-mono ml-1">{cart.totalTime}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* 移动控制 */}
                        <div className="space-y-2">
                            <h3 className="text-[9px] text-muted-foreground dark:text-slate-500 font-bold uppercase tracking-widest">移动控制</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onMove(cart.id, 'backward')}
                                    className="h-11 flex items-center justify-center gap-2 bg-muted/80 dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 border border-border dark:border-white/10 hover:border-sky-500/50 rounded-lg transition-all group cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4 text-muted-foreground dark:text-slate-400 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors" />
                                    <span className="font-bold text-sm text-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white">后退</span>
                                </button>
                                <button
                                    onClick={() => onMove(cart.id, 'forward')}
                                    className="h-11 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 border border-transparent shadow-lg shadow-sky-500/20 rounded-lg transition-all group cursor-pointer"
                                >
                                    <span className="font-bold text-sm text-white">前进</span>
                                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <p className="text-[9px] text-muted-foreground dark:text-slate-500 text-center">
                                * 移动需满足：(1) 路径上的插板阀已打开 (2) 目标腔体无车
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
