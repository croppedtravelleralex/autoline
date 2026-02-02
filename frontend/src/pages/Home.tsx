import { useState, useEffect, useCallback } from 'react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { LineSection } from '../components/LineSection';
import { CartControlModal } from '../components/CartControlModal';
import { LineEditorModal } from '../components/LineEditorModal';
import { AddLineModal } from '../components/AddLineModal';
import { SaveTemplateModal } from '../components/SaveTemplateModal';
import { CartTaskPanel } from '../components/CartTaskPanel';
import { CartProgressPanel } from '../components/CartProgressPanel';
import { DashboardLogPanel } from '../components/DashboardLogPanel';
import { OperationLogPanel } from '../components/OperationLogPanel';
import { Trash2, Edit2, Plus, ChevronDown, ChevronUp, ListTodo, Activity, FileText, AlertTriangle, Terminal, Save, Copy } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadUnloadModal } from '../components/LoadUnloadModal';
import { ChamberSettingsModal } from '../components/ChamberSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Cart, Chamber } from '../types';
import { LineButton } from '../components/LineButton';

import { useNavigate } from 'react-router-dom';
import { duplicateLine, deleteLine, updateLine, createLine, createFromTemplate, createCart, deleteCart } from '../services/api';

export function Home() {
    const navigate = useNavigate();
    const { state, actions } = useSystemStateContext();
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
    const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
    const [isLineEditorOpen, setIsLineEditorOpen] = useState(false);
    const [selectedLineId, setSelectedLineId] = useState<string>(() => {
        return localStorage.getItem('selectedLineId') || '';
    });
    const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
    const [saveTemplateModal, setSaveTemplateModal] = useState<{ isOpen: boolean; lineId: string; lineName: string }>({
        isOpen: false,
        lineId: '',
        lineName: ''
    });
    const [isBottomPanelExpanded, setIsBottomPanelExpanded] = useState(false);
    const [activeMobilePanel, setActiveMobilePanel] = useState<'tasks' | 'progress' | 'system' | 'warning' | 'operation'>('tasks');

    // 初始化选中 ID（若 localStorage 无值或已删除的线体）
    useEffect(() => {
        const storedId = localStorage.getItem('selectedLineId');
        const lineExists = state?.lines?.some(l => l.id === storedId);

        if (!selectedLineId || !lineExists) {
            if (Array.isArray(state?.lines) && state.lines[0]) {
                setSelectedLineId(state.lines[0].id);
            }
        }
    }, [state?.lines]);

    // 持久化线体选择到 localStorage
    useEffect(() => {
        if (selectedLineId) {
            localStorage.setItem('selectedLineId', selectedLineId);
        }
    }, [selectedLineId]);

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
        lineIndex: number; // 线体序号
        dailySeq: number;  // 当天该线体进样次数
        lineType: 'anode' | 'cathode' | undefined; // 阳极或阴极
    }>({
        isOpen: false,
        type: 'load',
        lineId: '',
        chamberId: '',
        lineName: '',
        lineIndex: 1,
        dailySeq: 1,
        lineType: undefined,
    });

    // Update selected line if lines change and current selection is invalid
    useEffect(() => {
        if (Array.isArray(state?.lines) && state.lines.length > 0 && !state.lines.find(l => l?.id === selectedLineId)) {
            setSelectedLineId(state.lines[0].id);
        }
    }, [state?.lines, selectedLineId]);

    // Update selected cart when system state updates
    useEffect(() => {
        if (selectedCart && Array.isArray(state?.carts)) {
            const updated = state.carts.find(c => c?.id === selectedCart.id);
            if (updated) setSelectedCart(updated);
        }
    }, [state?.carts, selectedCart?.id]);

    // Get selected line and its data
    const selectedLine = Array.isArray(state?.lines) ? state.lines.find(l => l?.id === selectedLineId) : undefined;
    const selectedLineIndex = Array.isArray(state?.lines) ? state.lines.findIndex(l => l?.id === selectedLineId) + 1 : 0;

    // Filter carts for selected line only
    const lineChamberIds = selectedLine
        ? [...(selectedLine.anodeChambers || []), ...(selectedLine.cathodeChambers || [])].filter(Boolean).map(c => c.id)
        : [];
    const lineCarts = Array.isArray(state?.carts) ? state.carts.filter(cart => cart && lineChamberIds.includes(cart.locationChamberId)) : [];

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

        // 计算线体序号 (1-based)
        const lineIndex = state.lines.findIndex(l => l.id === lineId) + 1;

        // 判断是阳极还是阴极腔体
        const anodeChamberIds = (line.anodeChambers || []).map(c => c.id);
        const cathodeChamberIds = (line.cathodeChambers || []).map(c => c.id);
        const lineType: 'anode' | 'cathode' | undefined =
            anodeChamberIds.includes(chamberId) ? 'anode' :
                cathodeChamberIds.includes(chamberId) ? 'cathode' : undefined;

        // 计算当天该线体的进样次数 (基于同类型小车数量 + 1)
        const relevantChamberIds = lineType === 'cathode' ? cathodeChamberIds : anodeChamberIds;
        const typeCarts = state.carts.filter(c => relevantChamberIds.includes(c.locationChamberId));
        const dailySeq = typeCarts.length + 1;

        setLoadUnloadModal({
            isOpen: true,
            type,
            lineId,
            chamberId,
            lineName: line.name,
            lineIndex,
            dailySeq,
            lineType,
        });
    };

    // Handler for confirming Load/Unload actions
    const handleConfirmLoadUnload = async (data?: any) => {
        const { type, lineId, chamberId, lineType } = loadUnloadModal;
        try {
            if (type === 'load') {
                // 传递 polarity (lineType) 给后端，让后端自动查找入口腔体
                await createCart(lineId, chamberId, lineType || 'anode', data);
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


    const handleAddLine = async (mode: 'standard' | 'duplicate' | 'template', id?: string) => {
        try {
            const nextIndex = state.lines.length + 1;
            const lineName = `${nextIndex}号线`;

            if (mode === 'standard') {
                await createLine('standard', lineName);
            } else if (mode === 'template' && id) {
                await createFromTemplate(id, lineName);
            } else if (mode === 'duplicate' && id) {
                // duplicateLine in backend already sets the unique ID and "N号线" name
                await duplicateLine(id);
            }
            await actions.refreshState();
        } catch (err: any) {
            throw err;
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background">
            <CartControlModal
                cart={selectedCart}
                lines={state.lines}
                onClose={() => setSelectedCart(null)}
                onMove={actions.moveCart}
                onUpdateCart={actions.updateCart}
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
                lineId={loadUnloadModal.lineId}
                lineIndex={loadUnloadModal.lineIndex}
                dailySeq={loadUnloadModal.dailySeq}
                lineType={loadUnloadModal.lineType}
                onConfirm={handleConfirmLoadUnload}
                onCancel={() => setLoadUnloadModal(prev => ({ ...prev, isOpen: false }))}
            />



            <LineEditorModal
                isOpen={isLineEditorOpen}
                onClose={() => setIsLineEditorOpen(false)}
                lines={Array.isArray(state?.lines) ? state.lines : []}
                onRefresh={actions.refreshState}
            />

            <AddLineModal
                isOpen={isAddLineModalOpen}
                onClose={() => setIsAddLineModalOpen(false)}
                existingLines={state.lines}
                onConfirm={handleAddLine}
            />

            <SaveTemplateModal
                isOpen={saveTemplateModal.isOpen}
                onClose={() => setSaveTemplateModal(prev => ({ ...prev, isOpen: false }))}
                lineId={saveTemplateModal.lineId}
                lineName={saveTemplateModal.lineName}
                onSuccess={() => {
                    // Maybe show a toast or refresh something if needed
                }}
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
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                {/* Center: Line Monitor (Scrollable) */}
                <div className="flex-1 overflow-auto bg-background dark:bg-slate-950/20 relative scrollbar-thin scrollbar-thumb-sky-900/10 dark:scrollbar-thumb-sky-900/20 flex flex-col min-h-[50vh] md:min-h-0">
                    <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-10 pointer-events-none" />

                    {/* Line Management Toolbar */}
                    <div className="shrink-0 sticky top-0 z-20 bg-background/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-border dark:border-white/5">

                        {/* Horizontal Line Selector */}
                        <div className="p-2 sm:p-3 flex items-center gap-1.5 overflow-x-auto hide-scrollbar sm:scrollbar-hide">
                            <>
                                {Array.isArray(state?.lines) && state.lines.map((line, index) => {
                                    if (!line) return null;
                                    return (
                                        <LineButton
                                            key={line.id}
                                            line={line}
                                            index={index}
                                            isSelected={selectedLineId === line.id}
                                            onSelect={setSelectedLineId}
                                            onEdit={(id) => {
                                                navigate(`/lines/${encodeURIComponent(id)}`);
                                            }}
                                            onSaveTemplate={(id, name) => {
                                                setSaveTemplateModal({
                                                    isOpen: true,
                                                    lineId: id,
                                                    lineName: name
                                                });
                                            }}
                                            onDelete={(id) => {
                                                setConfirmDialog({
                                                    isOpen: true,
                                                    title: '确认删除线体',
                                                    message: `确定要删除 ${line.name} 吗？与之关联的所有小车也将被删除。此操作无法撤销。`,
                                                    variant: 'danger',
                                                    onConfirm: async () => {
                                                        try {
                                                            await actions.deleteLine(id);
                                                            // If we deleted the selected line, select the first one
                                                            if (selectedLineId === id && state.lines.length > 0) {
                                                                const remaining = state.lines.filter(l => l.id !== id);
                                                                if (remaining.length > 0) {
                                                                    setSelectedLineId(remaining[0].id);
                                                                } else {
                                                                    setSelectedLineId('');
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.error(error);
                                                            alert('删除线体失败');
                                                        }
                                                    }
                                                });
                                            }}
                                            showDelete={state.lines.length > 1}
                                        />
                                    );
                                })}
                            </>

                            {/* 全局添加按钮 - 始终在最后 */}
                            <button
                                onClick={() => setIsAddLineModalOpen(true)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-card hover:bg-sky-600 text-muted-foreground hover:text-white dark:bg-slate-800 dark:text-slate-400 transition-all shadow-lg hover:shadow-sky-900/50 hover:scale-110 cursor-pointer shrink-0 border border-border dark:border-white/5"
                                title="添加新线体"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-2 sm:p-4 min-h-0 flex-1 overflow-auto mobile-scroll-hint">
                        {selectedLine && (
                            <div className="bg-card dark:bg-slate-900/50 rounded-xl sm:rounded-2xl border border-border dark:border-white/5 p-2 sm:p-4 shadow-lg overflow-x-auto scrollbar-thin">
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

                {/* Right: Sidebar (Fixed Width on Desktop, HIDDEN on Mobile as it moves to bottom) */}
                <div className="hidden md:flex w-[320px] border-l border-border dark:border-cyan-900/30 bg-muted/95 dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950/90 backdrop-blur-sm flex-col shrink-0 h-full overflow-hidden">
                    {/* Top 60%: Tasks */}
                    <div className="h-[60%] border-b border-border dark:border-cyan-900/20 overflow-hidden bg-background/50 dark:bg-cyan-950/10 shrink-0">
                        <CartTaskPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />
                    </div>
                    {/* Bottom 40%: Progress */}
                    <div className="flex-1 overflow-hidden bg-background/30 dark:bg-emerald-950/10">
                        <CartProgressPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />
                    </div>
                </div>
            </div>

            {/* Bottom Area: Unified Panels (Desktop: 3 Logs Col, Mobile: 5 Tabs Switcher) */}
            <div className={`shrink-0 border-t border-border bg-background dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300 relative ${isBottomPanelExpanded ? 'h-[450px] md:h-56' : 'h-11 md:h-11'}`}>
                {/* Mobile Panel Switcher & Toggle */}
                <div className="md:hidden flex flex-col h-full overflow-hidden">
                    {/* Switcher Bar */}
                    <div className="flex items-center justify-between px-2 h-11 border-b border-border/50 shrink-0 bg-muted/30">
                        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                            {[
                                { id: 'tasks', icon: ListTodo, label: '待办' },
                                { id: 'progress', icon: Activity, label: '进度' },
                                { id: 'system', icon: Terminal, label: '运行' },
                                { id: 'warning', icon: AlertTriangle, label: '警示' },
                                { id: 'operation', icon: FileText, label: '操作' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (activeMobilePanel === tab.id && isBottomPanelExpanded) {
                                            setIsBottomPanelExpanded(false);
                                        } else {
                                            setActiveMobilePanel(tab.id as any);
                                            setIsBottomPanelExpanded(true);
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeMobilePanel === tab.id && isBottomPanelExpanded
                                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <tab.icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsBottomPanelExpanded(!isBottomPanelExpanded)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-2"
                        >
                            {isBottomPanelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                    </div>

                    {/* Mobile Active Panel Content */}
                    <div className={`flex-1 overflow-hidden transition-opacity duration-200 ${isBottomPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {activeMobilePanel === 'tasks' && <CartTaskPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />}
                        {activeMobilePanel === 'progress' && <CartProgressPanel carts={lineCarts} lines={selectedLine ? [selectedLine] : []} />}
                        {activeMobilePanel === 'system' && (
                            <DashboardLogPanel
                                id="system-log-mobile"
                                title="系统运行日志"
                                logs={state.systemLogs}
                                colorClass="text-sky-600 dark:text-sky-400"
                                icon="terminal"
                            />
                        )}
                        {activeMobilePanel === 'warning' && (
                            <DashboardLogPanel
                                id="warning-log-mobile"
                                title="警示与报警"
                                logs={warningLogs}
                                colorClass="text-amber-600 dark:text-amber-400"
                                icon="warning"
                            />
                        )}
                        {activeMobilePanel === 'operation' && (
                            <OperationLogPanel
                                logs={state.operationLogs}
                                lines={state.lines}
                            />
                        )}
                    </div>
                </div>

                {/* Desktop View (Grid with Control Header) */}
                <div className="hidden md:flex flex-col h-full overflow-hidden">
                    {/* Desktop Toolbar */}
                    <div
                        className="flex items-center justify-between px-4 h-11 border-b border-border dark:border-white/5 bg-muted/20 cursor-pointer select-none shrink-0"
                        onDoubleClick={() => setIsBottomPanelExpanded(!isBottomPanelExpanded)}
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                <Terminal size={12} className="text-sky-500" />
                                监控控制台
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500">
                                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500" /> 运行正常</span>
                                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-amber-500" /> {warningLogs.length} 条未读警报</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBottomPanelExpanded(!isBottomPanelExpanded)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                            title={isBottomPanelExpanded ? "收起面板" : "展开面板"}
                        >
                            {isBottomPanelExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                    </div>

                    <div className={`grid h-full grid-cols-3 divide-x divide-border dark:divide-white/10 overflow-hidden transition-opacity duration-300 ${isBottomPanelExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="bg-sky-500/5 dark:bg-sky-950/20 h-full overflow-hidden shrink-0">
                            <DashboardLogPanel
                                id="system-log-desktop"
                                title="系统运行日志"
                                logs={state.systemLogs}
                                colorClass="text-sky-600 dark:text-sky-400"
                                icon="terminal"
                            />
                        </div>
                        <div className="bg-amber-500/5 dark:bg-amber-950/20 h-full overflow-hidden shrink-0">
                            <DashboardLogPanel
                                id="warning-log-desktop"
                                title="警示与报警"
                                logs={warningLogs}
                                colorClass="text-amber-600 dark:text-amber-400"
                                icon="warning"
                            />
                        </div>
                        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 h-full overflow-hidden shrink-0">
                            <OperationLogPanel
                                logs={state.operationLogs}
                                lines={state.lines}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
