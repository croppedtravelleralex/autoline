
import { useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'info' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    variant = 'info',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {variant === 'danger' ? (
                            <div className="p-2 bg-red-500/20 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                        ) : (
                            <div className="p-2 bg-sky-500/20 rounded-full">
                                <Info className="w-5 h-5 text-sky-500" />
                            </div>
                        )}
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-300 leading-relaxed text-base">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 bg-slate-950/50 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium border border-transparent hover:border-white/10"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={cn(
                            "px-6 py-2 rounded-lg text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0",
                            variant === 'danger'
                                ? "bg-red-600 hover:bg-red-500 hover:shadow-red-900/40"
                                : "bg-sky-600 hover:bg-sky-500 hover:shadow-sky-900/40"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
