import { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Save, X } from 'lucide-react';
import { createLine, updateLine, deleteLine, duplicateLine } from '../services/api';
import { useSystemStateContext } from '../context/SystemStateContext';
import { useUser } from '../context/UserContext';

export function LineEditor() {
    const { state } = useSystemStateContext();
    const { user } = useUser();
    const lines = state.lines;

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newLineName, setNewLineName] = useState('');
    const [newLineType, setNewLineType] = useState('anode');
    const [isAdding, setIsAdding] = useState(false);

    const checkPermission = () => {
        if (user?.role !== 'admin') {
            alert('权限不足：仅管理员可进行此操作');
            return false;
        }
        return true;
    };

    const handleCreate = async () => {
        if (!checkPermission()) return;
        if (!newLineName.trim()) return;
        try {
            await createLine(newLineType, newLineName);
            setNewLineName('');
            setIsAdding(false);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!checkPermission()) return;
        if (!editName.trim()) return;
        try {
            await updateLine(id, editName);
            setEditingId(null);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!checkPermission()) return;
        if (!confirm(`确定要删除线体 "${name}" 吗？此操作不可恢复！`)) return;
        try {
            await deleteLine(id);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDuplicate = async (id: string) => {
        if (!checkPermission()) return;
        try {
            await duplicateLine(id);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="h-full p-6 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-950/50">
                    <h2 className="text-lg font-bold text-white tracking-wide">线体管理 / Line Editor</h2>
                    {!isAdmin && <span className="text-xs text-amber-500 font-mono px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20">只读模式 (View Only)</span>}
                </div>

                <div className="p-6 space-y-6">
                    {/* Add New Line Section */}
                    {isAdmin && (
                        isAdding ? (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
                                <h3 className="text-sm font-semibold text-sky-400">新增线体</h3>
                                <div className="flex gap-3">
                                    <select
                                        value={newLineType}
                                        onChange={e => setNewLineType(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                                    >
                                        <option value="anode">阳极线结构 (Anode Base)</option>
                                        <option value="cathode">阴极线结构 (Cathode Base)</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="输入线体名称..."
                                        value={newLineName}
                                        onChange={e => setNewLineName(e.target.value)}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                                    />
                                    <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition-colors">
                                        创建
                                    </button>
                                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors">
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>添加新线体</span>
                            </button>
                        )
                    )}

                    {/* Line List */}
                    <div className="space-y-3">
                        {lines.map(line => (
                            <div key={line.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 flex items-center justify-between group hover:border-slate-600 transition-colors">
                                {editingId === line.id ? (
                                    <div className="flex-1 flex gap-3 mr-4">
                                        <input
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 bg-slate-950 border border-sky-500 rounded px-3 py-1.5 text-sm text-white focus:outline-none"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdate(line.id)} className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20">
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-white text-lg">{line.name}</h3>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{line.id}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {(line.anodeChambers?.length || 0) + (line.cathodeChambers?.length || 0)} 个腔体
                                        </div>
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDuplicate(line.id)}
                                            title="复制线体"
                                            className="p-2 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 rounded transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(line.id);
                                                setEditName(line.name);
                                            }}
                                            title="重命名"
                                            className="p-2 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(line.id, line.name)}
                                            title="删除线体"
                                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
