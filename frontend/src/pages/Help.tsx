import { HelpCircle } from 'lucide-react';

export function Help() {
    return (
        <div className="h-full p-6 flex flex-col items-center justify-center text-slate-500">
            <HelpCircle className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-slate-400">帮助中心</h2>
            <p className="mt-2 text-sm">系统使用说明与文档</p>
        </div>
    );
}
