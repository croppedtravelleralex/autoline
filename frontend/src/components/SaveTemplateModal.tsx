import React, { useState } from 'react';
import { X, Save, FileText, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { saveAsTemplate } from '../services/api';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    lineId: string;
    lineName: string;
    onSuccess: () => void;
}

export function SaveTemplateModal({ isOpen, onClose, lineId, lineName, onSuccess }: SaveTemplateModalProps) {
    const [name, setName] = useState(`${lineName} 模板`);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) return alert('请输入模板名称');
        setIsSubmitting(true);
        try {
            await saveAsTemplate(lineId, name, description);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`保存失败: ${error.message || '未知错误'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-sky-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/20 rounded-full">
                            <Save className="w-5 h-5 text-sky-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">存为模板</h3>
                            <p className="text-xs text-slate-400 mt-0.5">将 "{lineName}" 的配置录入模板库</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/5">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-sky-500" />
                            模板名称
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="输入模板名称，如：标准产线 V1.0"
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 ml-1 flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-500" />
                            模板描述 (可选)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="简要说明此模板的适用场景或特殊配置..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all h-24 resize-none"
                        />
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-400 leading-relaxed">
                            注：模板仅保存腔体结构与选型，不包含当前线体上的动态状态（如温度、真空度、小车等）。
                        </div>
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
                        onClick={handleSave}
                        disabled={isSubmitting || !name.trim()}
                        className={cn(
                            "px-10 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                            "bg-sky-600 hover:bg-sky-500 hover:shadow-sky-900/40"
                        )}
                    >
                        {isSubmitting ? '正在存入...' : '存入模板库'}
                    </button>
                </div>
            </div>
        </div>
    );
}
