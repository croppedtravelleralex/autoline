import React, { useState, useEffect } from 'react';
import { X, Plus, Copy, Layout, ChevronRight, Library, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { LineData, LineTemplate } from '../types';
import { fetchTemplates, deleteTemplate } from '../services/api';

interface AddLineModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingLines: LineData[];
    onConfirm: (mode: 'standard' | 'duplicate' | 'template', id?: string) => Promise<void>;
}

export function AddLineModal({ isOpen, onClose, existingLines, onConfirm }: AddLineModalProps) {
    const [mode, setMode] = useState<'standard' | 'duplicate' | 'template'>('duplicate');
    const [sourceLineId, setSourceLineId] = useState<string>(existingLines[existingLines.length - 1]?.id || '');
    const [templateId, setTemplateId] = useState<string>('');
    const [templates, setTemplates] = useState<LineTemplate[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    // 追踪模板是否已加载，避免重复请求
    const templatesLoadedRef = React.useRef(false);

    // 仅在模态框打开时加载一次模板
    useEffect(() => {
        if (isOpen && !templatesLoadedRef.current) {
            loadTemplates();
            templatesLoadedRef.current = true;
        }
        if (!isOpen) {
            // 模态框关闭时重置标记，下次打开时重新加载
            templatesLoadedRef.current = false;
        }
    }, [isOpen]);

    // 单独处理 sourceLineId 的重置，与模板加载分开
    useEffect(() => {
        if (isOpen && existingLines.length > 0) {
            setSourceLineId(existingLines[existingLines.length - 1].id);
        }
    }, [isOpen, existingLines]);

    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const data = await fetchTemplates();
            setTemplates(data);
            if (data.length > 0) setTemplateId(data[0].id);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除此模板吗？')) return;
        try {
            await deleteTemplate(id);
            await loadTemplates();
        } catch (error: any) {
            alert(`删除失败: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const id = mode === 'duplicate' ? sourceLineId : (mode === 'template' ? templateId : undefined);
            await onConfirm(mode, id);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`创建失败: ${error.message || '未知错误'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/20 rounded-full">
                            <Plus className="w-5 h-5 text-sky-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">添加新线体</h3>
                            <p className="text-xs text-slate-400 mt-0.5">选择创建模式并配置基础参数</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/5">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {/* Option 1: Duplicate */}
                        <button
                            onClick={() => setMode('duplicate')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all group text-left",
                                mode === 'duplicate'
                                    ? "bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/20"
                                    : "bg-white/5 border-transparent hover:border-white/10"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                mode === 'duplicate' ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                            )}>
                                <Copy className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <div className={cn("font-bold text-sm", mode === 'duplicate' ? "text-white" : "text-slate-300")}>复制线体</div>
                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">基于已有线体克隆</div>
                            </div>
                        </button>

                        {/* Option 2: Template Library */}
                        <button
                            onClick={() => setMode('template')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all group text-left",
                                mode === 'template'
                                    ? "bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/20"
                                    : "bg-white/5 border-transparent hover:border-white/10"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                mode === 'template' ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                            )}>
                                <Library className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <div className={cn("font-bold text-sm", mode === 'template' ? "text-white" : "text-slate-300")}>从模板库</div>
                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">使用已保存模板</div>
                            </div>
                        </button>

                        {/* Option 3: Standard */}
                        <button
                            onClick={() => setMode('standard')}
                            className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all group text-left",
                                mode === 'standard'
                                    ? "bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/20"
                                    : "bg-white/5 border-transparent hover:border-white/10"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                mode === 'standard' ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                            )}>
                                <Layout className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                                <div className={cn("font-bold text-sm", mode === 'standard' ? "text-white" : "text-slate-300")}>标准模板</div>
                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">从零创建新产线</div>
                            </div>
                        </button>
                    </div>

                    {/* Mode Specific Settings */}
                    <div className="animate-in slide-in-from-top-2 duration-300 h-28">
                        {mode === 'duplicate' && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-sky-500" />
                                    选择来源线体
                                </label>
                                <select
                                    value={sourceLineId}
                                    onChange={(e) => setSourceLineId(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2rem' }}
                                >
                                    {existingLines.map((line, idx) => (
                                        <option key={line.id} value={line.id}>
                                            {idx + 1}# {line.name} ({line.anodeChambers.length + line.cathodeChambers.length} 腔体)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {mode === 'template' && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-sky-500" />
                                    选择现有模板
                                </label>
                                {isLoadingTemplates ? (
                                    <div className="py-3 text-slate-500 text-sm animate-pulse">正在加载模板库...</div>
                                ) : templates.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={templateId}
                                            onChange={(e) => setTemplateId(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all appearance-none cursor-pointer pr-24"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2rem' }}
                                        >
                                            {templates.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={(e) => handleDeleteTemplate(templateId, e)}
                                            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-500 transition-colors"
                                            title="删除模板"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-3 text-amber-500/60 text-sm italic">模板库为空，请先从已有线体另存为模板。</div>
                                )}
                            </div>
                        )}

                        {mode === 'standard' && (
                            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 flex items-start gap-3">
                                <Plus className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-slate-300 leading-relaxed">
                                    标准模板将创建一个包含基础进出样仓、烘烤仓的典型产线结构。你可以随后在编辑器中继续调整。
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-8 pt-4 border-t border-white/5 bg-white/5">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting || (mode === 'duplicate' && !sourceLineId) || (mode === 'template' && !templateId)}
                        className={cn(
                            "px-10 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                            "bg-sky-600 hover:bg-sky-500 hover:shadow-sky-900/40"
                        )}
                    >
                        {isSubmitting ? '正在创建...' : '即刻创建'}
                    </button>
                </div>
            </div>
        </div>
    );
}
