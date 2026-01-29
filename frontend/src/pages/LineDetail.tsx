import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { updateLine } from '../services/api';
import type { LineData, Chamber } from '../types';
import { cn } from '../lib/utils';

// Chamber Type Mapping for Localization
const CHAMBER_TYPES: Record<string, string> = {
    load_lock: '进样仓',
    bake: '烘烤仓',
    cleaning: '清刷仓',
    docking: '对接仓',
    sealing: '铟封仓',
    unload: '出样仓',
    growth: '生长仓',
    process: '工艺仓',
    transfer: '传输腔',
};

const CHAMBER_TYPE_OPTIONS = Object.entries(CHAMBER_TYPES).map(([key, label]) => ({
    value: key,
    label: label
}));

export function LineDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useSystemStateContext();
    const [line, setLine] = useState<LineData | null>(null);
    const [lineName, setLineName] = useState('');
    const [anodeChambers, setAnodeChambers] = useState<Chamber[]>([]);
    const [cathodeChambers, setCathodeChambers] = useState<Chamber[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // 获取线体序号 (用于显示 1#阳极线 等)
    const lineIndex = state.lines.findIndex(l => l.id === id) + 1;

    useEffect(() => {
        if (!id || !state.lines) return;
        // 如果有未保存的修改，不要用后台轮询的数据覆盖本地状态
        if (isDirty) return;

        const found = state.lines.find(l => l.id === id);
        if (found) {
            // 只有当ID变化或者第一次加载时（或者非dirty状态下的数据更新）才更新
            // 这里简单做一个对比，如果数据完全一样就不更新，避免无谓渲染?
            // 但其实最主要的是防覆盖。只要 !isDirty，就允许覆盖（保持实时性）。
            // 这种逻辑下，如果用户还没改，后台变了，界面会跟着变。一旦改了，就锁住。
            setLine(found);
            setLineName(found.name);
            setAnodeChambers(found.anodeChambers || []);
            setCathodeChambers(found.cathodeChambers || []);
        }
    }, [id, state.lines, isDirty]);

    const handleSave = async () => {
        if (!line) return;
        try {
            // 使用后端返回的数据更新本地状态，避免轮询覆盖
            const updatedLine = await updateLine(line.id, lineName, anodeChambers, cathodeChambers);

            // 立即用响应数据更新本地状态
            setLine(updatedLine);
            setLineName(updatedLine.name);
            setAnodeChambers(updatedLine.anodeChambers || []);
            setCathodeChambers(updatedLine.cathodeChambers || []);

            alert('线体配置已保存成功！');
            setIsDirty(false);
        } catch (err: any) {
            alert(`保存失败: ${err.message}`);
        }
    };

    // 通用拖拽处理函数
    const handleDragEnd = (result: any, chambers: Chamber[], setChambers: (c: Chamber[]) => void) => {
        if (!result.destination) return;
        const items = Array.from(chambers);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setChambers(items);
        setIsDirty(true);
    };

    // 通用添加腔体函数
    const addChamber = (index: number, chambers: Chamber[], setChambers: (c: Chamber[]) => void, prefix: 'a' | 'c') => {
        const newChamber: Chamber = {
            id: `${line?.id}-${prefix}-new-${Date.now()}`,
            lineId: line?.id || '',
            name: '新建腔体',
            type: 'process' as const,
            temperature: 20,
            highVacPressure: 0,
            forelinePressure: 0,
            state: 'idle',
            valves: {
                gate_valve: 'closed',
                transfer_valve: 'closed',
                roughing_valve: 'closed',
                foreline_valve: 'closed',
                vent_valve: 'closed'
            },
            molecularPump: false,
            roughingPump: false,
            hasCart: false,
            cartId: undefined
        };
        const newChambers = [...chambers];
        newChambers.splice(index + 1, 0, newChamber);
        setChambers(newChambers);
        setIsDirty(true);
    };

    // 通用删除腔体函数 (检查最少1个)
    const removeChamber = (chamberId: string, chambers: Chamber[], setChambers: (c: Chamber[]) => void, typeName: string) => {
        if (chambers.length <= 1) {
            alert(`${typeName}至少需要保留1个腔体！`);
            return;
        }
        if (!confirm('确定要删除该腔体吗？')) return;

        setChambers(chambers.filter(c => c.id !== chamberId));
        setIsDirty(true);
    };

    // 通用更新腔体名称
    const updateChamberName = (cId: string, name: string, chambers: Chamber[], setChambers: (c: Chamber[]) => void) => {
        setChambers(chambers.map(c => c.id === cId ? { ...c, name } : c));
        setIsDirty(true);
    };

    // 通用更新腔体类型
    const updateChamberType = (cId: string, type: string, chambers: Chamber[], setChambers: (c: Chamber[]) => void) => {
        setChambers(chambers.map(c => c.id === cId ? { ...c, type: type as any } : c));
        setIsDirty(true);
    };

    if (!line) return <div className="text-white p-10 flex items-center justify-center h-full">加载线体数据中...</div>;

    // 渲染腔体编辑区域的组件
    const renderChamberSection = (
        title: string,
        chambers: Chamber[],
        setChambers: (c: Chamber[]) => void,
        droppableId: string,
        prefix: 'a' | 'c',
        typeName: string
    ) => (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 px-4 py-2 bg-gradient-to-r from-sky-600/30 to-transparent rounded-lg border-l-4 border-sky-500">
                {lineIndex}#{title}
            </h3>
            <DragDropContext onDragEnd={(result) => handleDragEnd(result, chambers, setChambers)}>
                <Droppable droppableId={droppableId} direction="horizontal" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex items-center gap-4 px-4 min-w-max pb-4 overflow-x-auto"
                        >
                            {chambers.map((chamber, index) => (
                                <Draggable key={chamber.id} draggableId={chamber.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            style={{
                                                ...provided.draggableProps.style,
                                                // Manually add rotation during drag to avoid fighting with dnd transform
                                                transform: snapshot.isDragging
                                                    ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                                    : provided.draggableProps.style?.transform,
                                            }}
                                            className={cn(
                                                "relative w-44 bg-slate-900/80 border border-white/10 rounded-xl p-4",
                                                !snapshot.isDragging && "transition-all duration-300",
                                                snapshot.isDragging && "ring-2 ring-sky-500 shadow-2xl z-50"
                                            )}
                                        >
                                            {/* Drag Handle */}
                                            <div {...provided.dragHandleProps} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                                            </div>

                                            {/* Delete Button - 只在腔体数 > 1 时显示 */}
                                            {chambers.length > 1 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeChamber(chamber.id, chambers, setChambers, typeName);
                                                    }}
                                                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors z-20"
                                                    title="删除腔体"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Chamber Name */}
                                            <div className="mt-4 mb-3">
                                                <label className="text-[10px] uppercase text-slate-500 tracking-wider">名称</label>
                                                <input
                                                    type="text"
                                                    value={chamber.name}
                                                    onChange={(e) => updateChamberName(chamber.id, e.target.value, chambers, setChambers)}
                                                    className="w-full mt-1 bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                />
                                            </div>

                                            {/* Chamber Type */}
                                            <div>
                                                <label className="text-[10px] uppercase text-slate-500 tracking-wider">类型</label>
                                                <select
                                                    value={chamber.type}
                                                    onChange={(e) => updateChamberType(chamber.id, e.target.value, chambers, setChambers)}
                                                    className="w-full mt-1 bg-slate-800 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none cursor-pointer"
                                                >
                                                    {CHAMBER_TYPE_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Add Chamber Button */}
                                            <button
                                                onClick={() => addChamber(index, chambers, setChambers, prefix)}
                                                className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-sky-600 hover:bg-sky-500 rounded-full flex items-center justify-center shadow-lg text-white transition-all hover:scale-110"
                                                title="在此后添加腔体"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div >
    );

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-slate-900 flex items-center justify-between sticky top-0 z-30 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-sky-400">{lineIndex}#</span>
                            <input
                                value={lineName}
                                onChange={(e) => {
                                    setLineName(e.target.value);
                                    setIsDirty(true);
                                }}
                                placeholder="输入线体名称..."
                                className="bg-transparent text-2xl font-black focus:outline-none border-b-2 border-transparent focus:border-sky-500 hover:border-white/20 transition-colors uppercase tracking-wider placeholder:text-slate-600/50"
                            />
                        </div>
                        <span className="text-xs font-mono text-slate-500">ID: {line.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && <span className="text-amber-400 text-xs italic font-bold">● 未保存修改</span>}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded font-bold tracking-wide transition-all shadow-lg",
                            isDirty
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/40 transform hover:-translate-y-0.5"
                                : "bg-slate-800 text-slate-600 cursor-not-allowed"
                        )}
                    >
                        <Save className="w-4 h-4" />
                        保存配置
                    </button>
                    <button
                        onClick={() => {
                            if (isDirty && !confirm("放弃所有未保存的修改？")) return;
                            navigate('/');
                        }}
                        className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors"
                        title="关闭 / Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-auto p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                {renderChamberSection('阳极线', anodeChambers, setAnodeChambers, 'anode-chambers', 'a', '阳极线')}
                {renderChamberSection('阴极线', cathodeChambers, setCathodeChambers, 'cathode-chambers', 'c', '阴极线')}
            </div>
        </div>
    );
}
