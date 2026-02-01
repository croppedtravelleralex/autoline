import { useState } from 'react';
import { X, Plus, Edit2, Copy, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { createLine, updateLine, duplicateLine } from '../services/api';
import type { LineData } from '../types';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface LineEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    lines: LineData[];
    onRefresh?: () => Promise<void>;
}

export const LineEditorModal = ({ isOpen, onClose, lines, onRefresh }: LineEditorModalProps) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newLineName, setNewLineName] = useState('');
    const [newLineType, setNewLineType] = useState('anode');
    const [isAdding, setIsAdding] = useState(false);

    // 快捷键
    useKeyboardShortcut([
        { key: 'Escape', handler: onClose },
        {
            key: 'Enter',
            handler: () => {
                if (isAdding) handleCreate();
                else if (editingId) handleUpdate(editingId);
            }
        }
    ], isOpen);

    const handleCreate = async () => {
        if (!newLineName.trim()) return;
        try {
            await createLine(newLineType, newLineName);
            setNewLineName('');
            setIsAdding(false);
            await onRefresh?.();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;
        try {
            await updateLine(id, editName);
            setEditingId(null);
            await onRefresh?.();
        } catch (error: any) {
            alert(error.message);
        }
    };



    const handleDuplicate = async (id: string) => {
        try {
            await duplicateLine(id);
            await onRefresh?.();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-700 bg-muted/30 dark:bg-slate-950/50">
                    <h2 className="text-lg font-bold text-foreground dark:text-white tracking-wide">线体管理 / Line Editor</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Add New Line Section */}
                    {isAdding ? (
                        <div className="bg-muted/30 dark:bg-slate-800/50 rounded-lg p-4 border border-border dark:border-slate-700 space-y-3">
                            <h3 className="text-sm font-semibold text-sky-600 dark:text-sky-400">新增线体</h3>
                            <div className="flex gap-3">
                                <select
                                    value={newLineType}
                                    onChange={e => setNewLineType(e.target.value)}
                                    className="bg-background dark:bg-slate-950 border border-border dark:border-slate-700 rounded px-3 py-2 text-sm text-foreground dark:text-white focus:outline-none focus:border-sky-500"
                                >
                                    <option value="anode">阳极线基础结构 (Anode Base)</option>
                                    <option value="cathode">阴极线基础结构 (Cathode Base)</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="输入线体名称..."
                                    value={newLineName}
                                    onChange={e => setNewLineName(e.target.value)}
                                    className="flex-1 bg-background dark:bg-slate-950 border border-border dark:border-slate-700 rounded px-3 py-2 text-sm text-foreground dark:text-white focus:outline-none focus:border-sky-500 placeholder:text-muted-foreground dark:placeholder:text-slate-600"
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
                    )}

                    {/* Line List */}
                    <div className="space-y-3">
                        {lines.map((line, idx) => (
                            <div
                                key={line.id}
                                className="flex items-center justify-between p-3 bg-muted/20 dark:bg-slate-800/30 border border-border dark:border-slate-700/50 rounded-lg group hover:border-sky-500/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400">
                                        {idx + 1}
                                    </div>
                                    {editingId === line.id ? (
                                        <input
                                            autoFocus
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="bg-background dark:bg-slate-950 border border-sky-500 rounded px-2 py-1 text-sm text-foreground dark:text-white outline-none"
                                        />
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground dark:text-slate-200">{line.name}</span>
                                            <span className="text-[10px] text-muted-foreground dark:text-slate-500 uppercase tracking-wider">{line.id}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {editingId === line.id ? (
                                        <button
                                            onClick={() => handleUpdate(line.id)}
                                            className="p-1.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 rounded transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingId(line.id);
                                                setEditName(line.name);
                                            }}
                                            className="p-1.5 hover:bg-muted dark:hover:bg-slate-700 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white rounded transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDuplicate(line.id)}
                                        className="p-1.5 hover:bg-sky-500/20 text-muted-foreground dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded transition-colors"
                                        title="克隆线体"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
