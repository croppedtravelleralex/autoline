import { useSystemStateContext } from '../context/SystemStateContext';
import { LogPanel } from '../components/LogPanel';
import { Activity } from 'lucide-react';

export function OperationLogs() {
    const { state } = useSystemStateContext();

    return (
        <div className="h-full p-6">
            <LogPanel
                title="操作审计日志 (AUDIT LOG)"
                icon={Activity}
                logs={state.operationLogs}
                colorClass="text-emerald-400"
            />
        </div>
    );
}
