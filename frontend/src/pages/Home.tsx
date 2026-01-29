import { useState, useEffect } from 'react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { LineSection } from '../components/LineSection';
import { CartControlModal } from '../components/CartControlModal';
import { LineEditorModal } from '../components/LineEditorModal';
import { CartTaskPanel } from '../components/CartTaskPanel';
import { CartProgressPanel } from '../components/CartProgressPanel';
import { DashboardLogPanel } from '../components/DashboardLogPanel';
import { OperationLogPanel } from '../components/OperationLogPanel';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadUnloadModal } from '../components/LoadUnloadModal';
import { ChamberSettingsModal } from '../components/ChamberSettingsModal';
import type { Cart, Chamber } from '../types';

import { useNavigate } from 'react-router-dom';
import { duplicateLine, deleteLine, updateLine, createCart, deleteCart } from '../services/api';

export function Home() {
    const navigate = useNavigate();
    const { state, actions } = useSystemStateContext();
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
    const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
    const [isLineEditorOpen, setIsLineEditorOpen] = useState(false);
    const [selectedLineId, setSelectedLineId] = useState<string>('');

    // 初始化选中 ID
    useEffect(() => {
        if (!selectedLineId && state?.lines?.[0]) {
            setSelectedLineId(state.lines[0].id);
        }
    }, [state?.lines, selectedLineId]);

    // Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'info' | 'danger';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info',
        onConfirm: () => { },
    });

    const closeDialog = () => setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    // Load/Unload Modal State
    const [loadUnloadModal, setLoadUnloadModal] = useState<{
        isOpen: boolean;
        type: 'load' | 'unload';
        lineId: string;
        chamberId: string;
        lineName: string; // for display
    }>({
        isOpen: false,
        type: 'load',
        lineId: '',
        chamberId: '',
        lineName: '',
    });

    // Update selected line if lines change and current selection is invalid
    useEffect(() => {
        if (state.lines.length > 0 && !state.lines.find(l => l.id === selectedLineId)) {
            setSelectedLineId(state.lines[0].id);
        }
    }, [state.lines, selectedLineId]);

    // Update selected cart when system state updates
    useEffect(() => {
        if (selectedCart) {
            const updated = state.carts.find(c => c.id === selectedCart.id);
            if (updated) setSelectedCart(updated);
        }
    }, [state.carts, selectedCart?.id]);

    // Get selected line and its data
    const selectedLine = state.lines.find(l => l.id === selectedLineId);
    const selectedLineIndex = state.lines.findIndex(l => l.id === selectedLineId) + 1;

    // Filter carts for selected line only
    const lineChamberIds = selectedLine
        ? [...(selectedLine.anodeChambers || []), ...(selectedLine.cathodeChambers || [])].map(c => c.id)
        : [];
    const lineCarts = state.carts.filter(cart => lineChamberIds.includes(cart.locationChamberId));

    // Derived logs for panels
    // DashboardLogPanel expects LogEntry[]. 
    // We can filter state.systemLogs for specific levels if needed.
    // Derived logs for panels
    const warningLogs = Array.isArray(state?.systemLogs)
        ? state.systemLogs.filter(l => l && (l.level === 'warn' || l.level === 'error'))
        : [];

    // Handler for Load/Unload click in LineSection
    const handleCartOperation = (lineId: string, chamberId: string, type: 'load' | 'unload') => {
        const line = state.lines.find(l => l.id === lineId);
        if (!line) return;
        setLoadUnloadModal({
            isOpen: true,
            type,
            lineId,
            chamberId,
            lineName: line.name
        });
    };

    // Handler for confirming Load/Unload actions
    const handleConfirmLoadUnload = async (data?: any) => {
        const { type, lineId, chamberId } = loadUnloadModal;
        try {
            if (type === 'load') {
                await createCart(lineId, chamberId, data);
            } else {
                // For unload, we need to find the cart in the chamber
                const cart = state.carts.find(c => c.locationChamberId === chamberId);
                if (cart) {
                    await deleteCart(cart.id);
                }
            }
            await actions.refreshState();
            setLoadUnloadModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background">
            <CartControlModal
                cart={selectedCart}
                lines={state.lines}
                onClose={() => setSelectedCart(null)}
                onMove={actions.moveCart}
                onDelete={(cartId) => {
                    setConfirmDialog({
                        isOpen: true,
                        title: '确认删除小车',
                        message: '确定要删除此小车吗？此操作无法撤销。',
                        variant: 'danger',
                        onConfirm: async () => {
                            try {
                                await actions.deleteCart(cartId);
                                setSelectedCart(null);
                            } catch (error) {
                                console.error(error);
                                alert('删除失败');
                            }
                        }
                    });
                }}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                onConfirm={() => {
                    confirmDialog.onConfirm();
                    closeDialog();
                }}
                onCancel={closeDialog}
            />

            <LoadUnloadModal
                isOpen={loadUnloadModal.isOpen}
                type={loadUnloadModal.type}
                lineName={loadUnloadModal.lineName}
                onConfirm={handleConfirmLoadUnload}
                onCancel={() => setLoadUnloadModal(prev => ({ ...prev, isOpen: false }))}
            />



            <LineEditorModal
                isOpen={isLineEditorOpen}
                onClose={() => setIsLineEditorOpen(false)}
                lines={state.lines}
                onRefresh={actions.refreshState}
            />

            <ChamberSettingsModal
                chamber={selectedChamber}
                onClose={() => setSelectedChamber(null)}
                onSave={async (chamberId, updates) => {
                    if (selectedLineId) {
                        await actions.updateChamber(selectedLineId, chamberId, updates);
                    }
                }}
            />

            {/* Main Content Grid: Top (Center+Right) + Bottom (Logs) */}
            {/* We use a flex-col for the main page structure: Top Area (Flex Row) / Bottom Area (Fixed Height) */}

            {/* Top Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center: Line Monitor (Scrollable) */}
                <div className="flex-1 overflow-auto bg-background dark:bg-slate-950/20 relative scrollbar-thin scrollbar-thumb-sky-900/20 flex flex-col">
                    <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

                    {/* Line Management Toolbar */}
                    <div className="shrink-0 sticky top-0 z-20 bg-background/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-border dark:border-white/5">

                        {/* Horizontal Line Selector */}
                        <div className="p-3 flex items-center gap-6 overflow-x-auto scrollbar-hide">
                            {state.lines.map((line, index) => (
                                <div key={line.id} className="flex items-center gap-1 group shrink-0">
                                    {/* 1# - 滚动到对应线体区域 */}
                                    <button
                                        onClick={() => setSelectedLineId(line.id)}
                                        className={`px-3 py-1.5 text-base font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-lg ${selectedLineId === line.id
                                            ? 'bg-sky-500 text-white shadow-sky-900/50'
                                            : 'bg-card text-muted-foreground hover:bg-sky-500 hover:text-white dark:bg-sky-600 dark:text-white shadow-sm'
                                            }`}
                                        title={`${line.name} - 点击查看`}
                                    >
                                        {index + 1}#
                                    </button>

                                    {/* Action Buttons - Inline, visible on hover */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-10">
                                        {/* 编辑键 - 进入腔体增删改移 */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/lines/${line.id}`);
                                            }}
                                            className="p-1 hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 rounded transition-colors cursor-pointer"
                                            title="编辑此线体 (腔体增删改移)"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>



                                        {/* Only show delete if there's more than 1 line */}
                                        {state.lines.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmDialog({
                                                        isOpen: true,
                                                        title: '确认删除线体',
                                                        message: `确定要删除线体 ${index + 1}# ("${line.name}") 吗？此操作不可恢复！`,
                                                        variant: 'danger',
                                                        onConfirm: async () => {
                                                            try {
                                                                await deleteLine(line.id);
                                                                await actions.refreshState();
                                                                // If deleted line was selected, switch to first line
                                                                if (selectedLineId === line.id && state.lines.length > 1) {
                                                                    const remainingLines = state.lines.filter(l => l.id !== line.id);
                                                                    setSelectedLineId(remainingLines[0]?.id || '');
                                                                }
                                                            } catch (err: any) {
                                                                alert(err.message);
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="p-1 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded transition-colors cursor-pointer"
                                                title="删除此线体"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 全局添加按钮 - 始终在最后 */}
                            <button
                                onClick={() => {
                                    if (state.lines.length === 0) return;
                                    const lastLine = state.lines[state.lines.length - 1];
                                    const nextIndex = state.lines.length + 1;

                                    setConfirmDialog({
                                        isOpen: true,
                                        title: '确认添加线体',
                                        message: `确定要以 "${lastLine.name}" 为模板创建新的 ${nextIndex}# 线体吗？`,
                                        variant: 'info',
                                        onConfirm: async () => {
                                            try {
                                                const newLine = await duplicateLine(lastLine.id);
                                                // 自动重命名为 "N号线"
                                                // 注意：newLine 返回的是后端对象，可能字段命名风格不同 (snake_case vs camelCase)
                                                // 但 updateLine 需要 camelCase 的 chambers。
                                                // 前端 duplicateLine 返回的是 response.json()，通常是 snake_case (Pydantic model dump)
                                                // 或者我们在 api.ts 里没有做转换。
                                                // 稳妥起见，我们重新 fetch 或者直接用 createLine? 不，用户要复制模板。
                                                // 最简单的办法：先刷新，找到最新的那条，然后改名。

                                                // 另一种策略：duplicateLine 后，后端其实已经生成了名字 (Copy)。
                                                // 我们拿到 newLine.id，直接 updateLine。
                                                // 假设 newLine 结构包含 id。

                                                await updateLine(
                                                    newLine.id,
                                                    `${nextIndex}号线`,
                                                    newLine.anode_chambers || newLine.anodeChambers,
                                                    newLine.cathode_chambers || newLine.cathodeChambers
                                                );

                                                await actions.refreshState();
                                            } catch (err: any) {
                                                alert(err.message);
                                            }
                                        }
                                    });
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-card hover:bg-sky-600 text-muted-foreground hover:text-white dark:bg-slate-800 dark:text-slate-400 transition-all shadow-lg hover:shadow-sky-900/50 hover:scale-110 cursor-pointer shrink-0 border border-border dark:border-white/5"
                                title="添加新线体 (复制最后一条)"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {selectedLine && (
                            <div className="bg-card dark:bg-slate-900/50 rounded-2xl border border-border dark:border-white/5 p-4 shadow-lg">
                                <LineSection
                                    line={selectedLine}
                                    carts={lineCarts}
                                    onToggleValve={actions.toggleValve}
                                    onTogglePump={actions.togglePump}
                                    onCartClick={setSelectedCart}
                                    onCartOperation={handleCartOperation}
                                    onOpenSettings={setSelectedChamber}
                                    lineIndex={selectedLineIndex}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar (Fixed Width) */}
                <div className="w-[320px] border-l border-border dark:border-cyan-900/30 bg-muted/95 dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950/90 backdrop-blur-sm flex flex-col shrink-0">
                    {/* Top 60%: Tasks */}
                    <div className="h-[60%] border-b border-border dark:border-cyan-900/20 overflow-hidden bg-background/50 dark:bg-cyan-950/10">
                        <CartTaskPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />
                    </div>
                    {/* Bottom 40%: Progress */}
                    <div className="flex-1 overflow-hidden bg-background/30 dark:bg-emerald-950/10">
                        <CartProgressPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />
                    </div>
                </div>
            </div>

            {/* Bottom Area: Logs (Fixed Height) */}
            <div className="h-48 shrink-0 border-t border-border bg-background dark:bg-slate-950/80 backdrop-blur-md grid grid-cols-3 divide-x divide-border dark:divide-white/10">
                <div className="bg-sky-500/5 dark:bg-sky-950/20">
                    <DashboardLogPanel
                        title="系统运行日志"
                        logs={state.systemLogs}
                        colorClass="text-sky-600 dark:text-sky-400"
                    />
                </div>
                <div className="bg-amber-500/5 dark:bg-amber-950/20">
                    <DashboardLogPanel
                        title="警示与报警"
                        logs={warningLogs}
                        colorClass="text-amber-600 dark:text-amber-400"
                    />
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-950/20">
                    <OperationLogPanel
                        logs={state.operationLogs}
                        lines={state.lines}
                    />
                </div>
            </div>
        </div >
    );
}
