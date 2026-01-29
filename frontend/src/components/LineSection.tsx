import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChamberCard } from './ChamberCard';
import { InterChamberValve } from './InterChamberValve';
import { LinePlaybackButton } from './LinePlaybackButton';
import { LinePlaybackPanel } from './LinePlaybackPanel';
import { useSystemStateContext } from '../context/SystemStateContext';
import type { LineData, Cart, LineType, ChamberValves, Chamber } from '../types';

interface LineSectionProps {
    line: LineData;
    carts: Cart[];
    onToggleValve: (lineId: LineType, chamberId: string, valveName: keyof ChamberValves) => void;
    onTogglePump: (lineId: LineType, chamberId: string, pumpType: 'molecular' | 'roughing') => void;
    onCartClick: (cart: Cart) => void;
    onCartOperation: (lineId: string, chamberId: string, type: 'load' | 'unload') => void;
    onOpenSettings?: (chamber: Chamber) => void;
    lineIndex: number; // 线体序号用于显示 1#
}

interface ChamberRowProps {
    chambers: Chamber[];
    lineId: string;
    carts: Cart[];
    onToggleValve: LineSectionProps['onToggleValve'];
    onTogglePump: LineSectionProps['onTogglePump'];
    onToggleIndiumSealing: (lineId: LineType, chamberId: string) => void;
    onCartClick: LineSectionProps['onCartClick'];
    onCartOperation: LineSectionProps['onCartOperation'];
    onOpenSettings?: LineSectionProps['onOpenSettings'];
    title: string;
    lineIndex: number;
    isPlaybackActive: boolean;
}

// 渲染单个腔体行（阳极或阴极）
const ChamberRow = ({
    chambers,
    lineId,
    carts,
    onToggleValve,
    onTogglePump,
    onToggleIndiumSealing,
    onCartClick,
    onCartOperation,
    onOpenSettings,
    title,
    lineIndex,
    isPlaybackActive,
}: ChamberRowProps) => {
    const loadChamber = chambers[0];
    const unloadChamber = chambers[chambers.length - 1];

    // 进样条件: 第一个腔体存在 且 没有小车 且 非回放模式
    const canLoad = !isPlaybackActive && loadChamber && !carts.find(c => c.locationChamberId === loadChamber.id);

    // 出样条件: 最后一个腔体存在 且 有小车 且 非回放模式
    const canUnload = !isPlaybackActive && unloadChamber && carts.find(c => c.locationChamberId === unloadChamber.id);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-1 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                    <h2 className="text-lg font-bold tracking-widest text-foreground/90 dark:text-white/90">{lineIndex}#{title}</h2>
                </div>

                {/* 进出样按钮 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => canLoad && onCartOperation(lineId, loadChamber.id, 'load')}
                        disabled={!canLoad}
                        className={`text-xs px-2 py-0.5 rounded border transition-all ${canLoad
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                            : "border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800/50 text-muted-foreground dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        [进样]
                    </button>
                    <button
                        onClick={() => canUnload && onCartOperation(lineId, unloadChamber.id, 'unload')}
                        disabled={!canUnload}
                        className={`text-xs px-2 py-0.5 rounded border transition-all ${canUnload
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                            : "border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-800/50 text-muted-foreground dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        [出样]
                    </button>
                </div>

                <div className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono ml-auto">
                    {isPlaybackActive ? '⏪ 回溯中' : '运行中 • 在线'}
                </div>
            </div>

            <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-sky-500/20 dark:scrollbar-thumb-sky-900/50 scrollbar-track-transparent">
                <div className="flex gap-0.5 items-center min-w-max px-2">
                    {chambers.map((chamber, index) => {
                        const chamberCarts = carts.filter(c => c.locationChamberId === chamber.id);
                        const isLast = index === chambers.length - 1;

                        return (
                            <div key={chamber.id} className="flex items-center gap-1">
                                <ChamberCard
                                    chamber={chamber}
                                    lineId={lineId}
                                    carts={chamberCarts}
                                    onToggleValve={onToggleValve}
                                    onTogglePump={onTogglePump}
                                    onToggleIndiumSealing={onToggleIndiumSealing}
                                    onCartClick={onCartClick}
                                    onOpenSettings={onOpenSettings}
                                    isReadOnly={isPlaybackActive}
                                />
                                {!isLast && (
                                    <InterChamberValve
                                        isOpen={chamber.valves.transfer_valve === 'open'}
                                        state={chamber.valves.transfer_valve}
                                        onClick={() => onToggleValve(lineId, chamber.id, 'transfer_valve')}
                                        isReadOnly={isPlaybackActive}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const LineSection = ({
    line,
    carts,
    onToggleValve,
    onTogglePump,
    onCartClick,
    onCartOperation,
    onOpenSettings,
    lineIndex,
}: LineSectionProps) => {
    const { actions } = useSystemStateContext();
    // 安全检查：确保腔体数组存在
    const anodeChambers = line.anodeChambers || [];
    const cathodeChambers = line.cathodeChambers || [];

    // 整条线体共用一个回溯状态（阴极和阳极共用）
    const [isPlaybackActive, setIsPlaybackActive] = useState(false);

    const togglePlayback = () => {
        const next = !isPlaybackActive;
        setIsPlaybackActive(next);
        if (next) {
            actions.setPlaybackMode(true);
        } else {
            actions.clearLinePlayback(line.id);
        }
    };

    // 切换铟封仓的铟封状态
    const handleToggleIndiumSealing = async (lineId: LineType, chamberId: string) => {
        // 查找腔体当前状态
        const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
        const chamber = allChambers.find(c => c.id === chamberId);
        if (chamber) {
            const newState = !(chamber.indiumSealing ?? false);
            await actions.updateChamber(lineId, chamberId, { indiumSealing: newState });
        }
    };

    return (
        <div className="space-y-4">
            {/* 线体级别的标题栏和回溯按钮 */}
            <div className="flex items-center gap-3 px-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                        <span className="text-sky-400 font-bold text-sm">{lineIndex}#</span>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white/90">{line.name}</h2>
                        <p className="text-[10px] text-slate-500">阳极 + 阴极</p>
                    </div>
                </div>

                {/* 回溯入口按钮 - 线体级别 */}
                <LinePlaybackButton
                    lineId={line.id}
                    isActive={isPlaybackActive}
                    onClick={togglePlayback}
                />

                <div className="ml-auto px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {isPlaybackActive ? '⏪ 历史回溯模式' : '✓ 实时运行中'}
                </div>
            </div>

            {/* 回溯控制面板 - 线体级别，展开后在阴极阳极上方 */}
            <AnimatePresence>
                {isPlaybackActive && (
                    <LinePlaybackPanel
                        lineId={line.id}
                        lineName={`${lineIndex}# ${line.name}`}
                        onClose={() => setIsPlaybackActive(false)}
                    />
                )}
            </AnimatePresence>

            {/* 阳极线 */}
            {anodeChambers.length > 0 && (
                <ChamberRow
                    chambers={anodeChambers}
                    lineId={line.id}
                    carts={carts}
                    onToggleValve={onToggleValve}
                    onTogglePump={onTogglePump}
                    onToggleIndiumSealing={handleToggleIndiumSealing}
                    onCartClick={onCartClick}
                    onCartOperation={onCartOperation}
                    onOpenSettings={onOpenSettings}
                    title="阳极线"
                    lineIndex={lineIndex}
                    isPlaybackActive={isPlaybackActive}
                />
            )}

            {/* 阴极线 */}
            {cathodeChambers.length > 0 && (
                <ChamberRow
                    chambers={cathodeChambers}
                    lineId={line.id}
                    carts={carts}
                    onToggleValve={onToggleValve}
                    onTogglePump={onTogglePump}
                    onToggleIndiumSealing={handleToggleIndiumSealing}
                    onCartClick={onCartClick}
                    onCartOperation={onCartOperation}
                    onOpenSettings={onOpenSettings}
                    title="阴极线"
                    lineIndex={lineIndex}
                    isPlaybackActive={isPlaybackActive}
                />
            )}
        </div>
    );
};
