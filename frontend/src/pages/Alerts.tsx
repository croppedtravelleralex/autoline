import { AlertTriangle } from 'lucide-react';

export function Alerts() {
    return (
        <div className="h-full p-6 flex flex-col items-center justify-center text-slate-500">
            <AlertTriangle className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-slate-400">系统警告模块</h2>
            <p className="mt-2 text-sm">暂无活跃警告</p>
        </div>
    );
}
