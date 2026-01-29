import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSystemStateContext } from '../context/SystemStateContext';
import { useUser } from '../context/UserContext';
import { LineSection } from '../components/LineSection';
import { CartControlModal } from '../components/CartControlModal';
import { LoadUnloadModal } from '../components/LoadUnloadModal';
import { CartTaskPanel } from '../components/CartTaskPanel';
import { CartProgressPanel } from '../components/CartProgressPanel';
import { DashboardLogPanel } from '../components/DashboardLogPanel';
import { OperationLogPanel } from '../components/OperationLogPanel';
import { ChamberSettingsModal } from '../components/ChamberSettingsModal';
import type { Cart, Chamber } from '../types';

export function LineView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state, actions } = useSystemStateContext();
    const { checkPermission } = useUser();
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
    const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'load' | 'unload';
        lineId: string;
        chamberId: string;
        lineName: string;
        lineType: 'anode' | 'cathode'; // 'anode' | 'cathode'
    } | null>(null);

    // Find the current line
    const line = state.lines.find(l => l.id === id);
    const lineIndex = state.lines.findIndex(l => l.id === id) + 1;

    // Update selected cart when system state updates
    useEffect(() => {
        if (selectedCart) {
            const updated = state.carts.find(c => c.id === selectedCart.id);
            if (updated) setSelectedCart(updated);
        }
    }, [state.carts, selectedCart?.id]);

    // Filter carts for this line only
    const lineChamberIds = line
        ? [...(line.anodeChambers || []), ...(line.cathodeChambers || [])].map(c => c.id)
        : [];
    const lineCarts = state.carts.filter(cart => lineChamberIds.includes(cart.locationChamberId));

    // Derived logs
    const warningLogs = state.systemLogs.filter(l => l.level === 'warn' || l.level === 'error');

    // Handlers
    const handleCartOperation = (lineId: string, chamberId: string, type: 'load' | 'unload') => {
        if (!checkPermission('operator')) {
            alert("权限不足：只有操作员及以上角色可以执行此操作");
            return;
        }
        if (!line) return;

        // Determine line type (anode vs cathode) based on chamberId or logic
        // Simplified check: assume anode chambers usually have 'a' and cathode 'c' in ID or check lists
        let lineType: 'anode' | 'cathode' = 'anode';
        if (line.cathodeChambers?.some(c => c.id === chamberId)) {
            lineType = 'cathode';
        }

        setModalConfig({
            isOpen: true,
            type,
            lineId,
            chamberId,
            lineName: line.name,
            lineType
        });
    };

    const handleModalConfirm = async (data: any) => {
        if (!modalConfig) return;

        try {
            if (modalConfig.type === 'load') {
                await actions.createCart(modalConfig.lineId, modalConfig.chamberId, data);
            } else {
                // For unload, we need cartId. Find cart in that chamber
                const cart = lineCarts.find(c => c.locationChamberId === modalConfig.chamberId);
                if (cart) {
                    await actions.deleteCart(cart.id);
                }
            }
            setModalConfig(null);
        } catch (error) {
            console.error(error);
            alert('操作失败');
        }
    };

    if (!line) {
        return (
            <div className="flex items-center justify-center h-full bg-background text-white">
                <div className="text-center">
                    <p className="text-2xl font-bold mb-2">线体未找到</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                    >
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background">
            <CartControlModal
                cart={selectedCart}
                lines={state.lines}
                onClose={() => setSelectedCart(null)}
                onMove={actions.moveCart}
                onDelete={async (cartId) => {
                    if (!checkPermission('operator')) {
                        alert("权限不足");
                        return;
                    }
                    if (confirm('确认删除此小车吗？')) {
                        try {
                            await actions.deleteCart(cartId);
                            setSelectedCart(null);
                        } catch (error) {
                            console.error(error);
                            alert('删除失败');
                        }
                    }
                }}
                onUpdateCart={actions.updateCart}
            />

            {modalConfig && (
                <LoadUnloadModal
                    isOpen={modalConfig.isOpen}
                    type={modalConfig.type}
                    lineName={modalConfig.lineName}
                    lineType={modalConfig.lineType}
                    onConfirm={handleModalConfirm}
                    onCancel={() => setModalConfig(null)}
                />
            )}

            <ChamberSettingsModal
                chamber={selectedChamber}
                onClose={() => setSelectedChamber(null)}
                onSave={async (chamberId, updates) => {
                    if (id) {
                        await actions.updateChamber(id, chamberId, updates);
                    }
                }}
            />

            {/* Top Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center: Line Monitor (Scrollable) */}
                <div className="flex-1 overflow-auto bg-background dark:bg-slate-950/20 relative scrollbar-thin scrollbar-thumb-sky-900/20 flex flex-col">
                    <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

                    {/* Header */}
                    <div className="shrink-0 sticky top-0 z-20 bg-background/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-border dark:border-white/5">
                        <div className="p-3 flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-muted dark:hover:bg-white/10 rounded-full transition-colors group"
                            >
                                <ArrowLeft className="w-6 h-6 text-muted-foreground group-hover:text-foreground dark:text-slate-400 dark:group-hover:text-white" />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-sky-400">{lineIndex}#</span>
                                <span className="text-2xl font-black text-foreground dark:text-white tracking-wider uppercase">{line.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Line Content */}
                    <div className="p-4">
                        <div className="bg-card dark:bg-slate-900/50 rounded-2xl border border-border dark:border-white/5 p-4 shadow-lg">
                            <LineSection
                                line={line}
                                carts={lineCarts}
                                onToggleValve={actions.toggleValve}
                                onTogglePump={actions.togglePump}
                                onCartClick={setSelectedCart}
                                onCartOperation={handleCartOperation}
                                onOpenSettings={setSelectedChamber}
                                lineIndex={lineIndex}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar (Fixed Width) */}
                <div className="w-[320px] border-l border-border dark:border-cyan-900/30 bg-muted/95 dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950/90 backdrop-blur-sm flex flex-col shrink-0">
                    {/* Top 60%: Tasks */}
                    <div className="h-[60%] border-b border-border dark:border-cyan-900/20 overflow-hidden bg-background/50 dark:bg-cyan-950/10">
                        <CartTaskPanel carts={lineCarts} lines={[line]} />
                    </div>
                    {/* Bottom 40%: Progress */}
                    <div className="flex-1 overflow-hidden bg-background/30 dark:bg-emerald-950/10">
                        <CartProgressPanel carts={lineCarts} lines={[line]} />
                    </div>
                </div>
            </div>

            {/* Bottom Area: Logs (Fixed Height) */}
            <div className="h-48 shrink-0 border-t border-white/10 bg-slate-950/80 backdrop-blur-md grid grid-cols-3 divide-x divide-white/10">
                <div className="bg-sky-950/20">
                    <DashboardLogPanel
                        title="SYSTEM LOGS"
                        logs={state.systemLogs}
                        colorClass="text-sky-400"
                    />
                </div>
                <div className="bg-amber-950/20">
                    <DashboardLogPanel
                        title="ALERTS & WARNINGS"
                        logs={warningLogs}
                        colorClass="text-amber-400"
                    />
                </div>
                <div className="bg-emerald-950/20">
                    <OperationLogPanel
                        logs={state.operationLogs}
                        lines={state.lines}
                    />
                </div>
            </div>
        </div>
    );
}
