import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { SystemState, LineType, Cart } from '../types';
import { initialSystemState } from '../data/mockData';
import { fetchSystemState, controlValve, controlPump, moveCart as apiMoveCart } from '../services/api';

interface SystemStateContextType {
    state: SystemState;
    playback?: {
        isActive: boolean;
        snapshots: Record<string, { line: any; carts: Cart[]; timestamp: number; isSynchronized: boolean; isMissing?: boolean }>;
        currentTime: number;
    };
    error: string | null;
    actions: {
        toggleValve: (lineId: LineType, chamberId: string, valveName: any) => Promise<void>;
        togglePump: (lineId: LineType, chamberId: string, pumpType: 'molecular' | 'roughing') => Promise<void>;
        moveCart: (cartId: string, direction: 'forward' | 'backward') => Promise<void>;
        createCart: (lineId: string, chamberId: string, data: any) => Promise<any>;
        deleteCart: (cartId: string) => Promise<any>;
        updateCart: (cartId: string, updates: Partial<Cart>) => Promise<any>;
        updateChamber: (lineId: string, chamberId: string, updates: Partial<any>) => Promise<any>;
        addLog: () => void;
        refreshState: () => Promise<void>;
        setPlaybackMode: (active: boolean) => void;
        setPlaybackTime: (lineId: string | 'all', timestamp: number) => Promise<void>;
        setLineSync: (lineId: string, synchronized: boolean) => void;
        clearLinePlayback: (lineId: string) => void;
    };
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export function SystemStateProvider({ children }: { children: ReactNode }) {
    const [realState, setRealState] = useState<SystemState>(initialSystemState);
    const [playbackActive, setPlaybackActive] = useState(false);
    const [playbackSnapshots, setPlaybackSnapshots] = useState<Record<string, { line: any; carts: Cart[]; timestamp: number; isSynchronized: boolean; isMissing?: boolean }>>({});
    const [globalPlaybackTime, setGlobalPlaybackTime] = useState<number>(Date.now() / 1000);
    const [error, setError] = useState<string | null>(null);
    // 🚀 Derived State - Derived from real time state or playback snapshots
    // Ensure state derivation is extremely robust to avoid UI crashes
    const state = useMemo(() => {
        try {
            if (!realState || typeof realState !== 'object') {
                return initialSystemState;
            }

            const offlineChambers = (chambers: any[]): any[] => {
                return (Array.isArray(chambers) ? chambers : []).map(c => {
                    if (!c || typeof c !== 'object') return null;
                    return {
                        ...c,
                        state: 'offline' as const,
                        valves: c.valves || {
                            gate_valve: 'closed',
                            roughing_valve: 'closed',
                            foreline_valve: 'closed',
                            vent_valve: 'closed',
                            transfer_valve: 'closed'
                        }
                    };
                }).filter(Boolean);
            };

            const safeLines = Array.isArray(realState.lines) ? realState.lines : [];
            const safeCarts = Array.isArray(realState.carts) ? realState.carts : [];

            const derivedState = {
                ...initialSystemState,
                ...realState,
                lines: safeLines.map(line => {
                    if (!line || !line.id) return line;
                    const snap = playbackSnapshots?.[line.id];
                    if (snap && !snap.isMissing && snap.line) {
                        return snap.line;
                    }
                    return {
                        ...line,
                        anodeChambers: offlineChambers(line.anodeChambers),
                        cathodeChambers: offlineChambers(line.cathodeChambers)
                    };
                }),
                carts: (() => {
                    const allCarts: Cart[] = [];
                    if (playbackSnapshots) {
                        Object.values(playbackSnapshots).forEach(snap => {
                            if (snap && !snap.isMissing && Array.isArray(snap.carts)) {
                                allCarts.push(...snap.carts);
                            }
                        });
                    }

                    if (Array.isArray(safeCarts)) {
                        const findLineForChamber = (chamberId: string) => {
                            for (const l of safeLines) {
                                if (!l) continue;
                                const chambers = [...(l.anodeChambers || []), ...(l.cathodeChambers || [])];
                                if (chambers.some(c => c && c.id === chamberId)) return l.id;
                            }
                            return null;
                        };

                        safeCarts.forEach(cart => {
                            if (!cart || !cart.locationChamberId) return;
                            const lineId = findLineForChamber(cart.locationChamberId);
                            if (!lineId || !playbackSnapshots?.[lineId]) {
                                allCarts.push(cart);
                            }
                        });
                    }
                    return allCarts;
                })()
            };

            return derivedState;
        } catch (err) {
            console.error('CRITICAL: Failed to derive system state in SystemStateContext:', err);
            return initialSystemState;
        }
    }, [realState, playbackSnapshots]);

    const isPlaybackActive = Object.keys(playbackSnapshots).length > 0;

    const refreshState = useCallback(async () => {
        try {
            const newState = await fetchSystemState();
            if (newState && typeof newState === 'object') {
                setRealState(newState);
                setError(null);
            } else {
                console.warn("Received invalid state from server:", newState);
            }
        } catch (err) {
            console.error("Failed to sync state:", err);
            setError("无法连接服务器");
        }
    }, []);

    useEffect(() => {
        refreshState();
        const interval = setInterval(refreshState, 1000);
        return () => clearInterval(interval);
    }, [refreshState]);

    const handleToggleValve = useCallback(async (lineId: LineType, chamberId: string, valveName: any) => {
        const line = realState.lines.find(l => l.id === lineId);
        if (!line) return;
        const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
        const chamber = allChambers.find(c => c.id === chamberId);
        if (!chamber) return;
        const currentVal = chamber.valves[valveName as keyof typeof chamber.valves];
        const action = currentVal === 'open' ? 'close' : 'open';
        await controlValve(lineId, chamberId, valveName, action);
        await refreshState();
    }, [realState.lines, refreshState]);

    const handleTogglePump = useCallback(async (lineId: LineType, chamberId: string, pumpType: 'molecular' | 'roughing') => {
        const line = realState.lines.find(l => l.id === lineId);
        if (!line) return;
        const allChambers = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])];
        const chamber = allChambers.find(c => c.id === chamberId);
        if (!chamber) return;
        const currentVal = pumpType === 'molecular' ? chamber.molecularPump : chamber.roughingPump;
        const action = currentVal ? 'off' : 'on';
        await controlPump(lineId, chamberId, pumpType, action);
        await refreshState();
    }, [realState.lines, refreshState]);

    const handleMoveCart = useCallback(async (cartId: string, direction: 'forward' | 'backward') => {
        await apiMoveCart(cartId, direction);
        await refreshState();
    }, [refreshState]);

    const handleCreateCart = useCallback(async (lineId: string, chamberId: string, data: any) => {
        const { createCart } = await import('../services/api');
        await createCart(lineId, chamberId, data);
        await refreshState();
    }, [refreshState]);

    const handleDeleteCart = useCallback(async (cartId: string) => {
        const { deleteCart } = await import('../services/api');
        await deleteCart(cartId);
        await refreshState();
    }, [refreshState]);

    const handleUpdateCart = useCallback(async (cartId: string, updates: Partial<any>) => {
        const { updateCart } = await import('../services/api');
        await updateCart(cartId, updates);
        await refreshState();
    }, [refreshState]);

    const handleUpdateChamber = useCallback(async (lineId: string, chamberId: string, updates: Partial<any>) => {
        const { updateChamber } = await import('../services/api');
        await updateChamber(lineId, chamberId, updates);
        await refreshState();
    }, [refreshState]);

    const setPlaybackTime = useCallback(async (lineId: string | 'all', timestamp: number) => {
        try {
            const { fetchSnapshotAt } = await import('../services/api');
            const fullSnapshot = await fetchSnapshotAt(timestamp);

            if (lineId === 'all') {
                setGlobalPlaybackTime(timestamp);
                setPlaybackSnapshots(prev => {
                    const next = { ...prev };

                    // 1. Update lines that exist in the snapshot
                    fullSnapshot.lines.forEach((l: any) => {
                        if (!prev[l.id] || prev[l.id].isSynchronized) {
                            const lineChamberIds = [...(l.anodeChambers || []), ...(l.cathodeChambers || [])].map(c => c.id);
                            const lineCarts = fullSnapshot.carts.filter((c: any) => lineChamberIds.includes(c.locationChamberId));
                            next[l.id] = { line: l, carts: lineCarts, timestamp, isSynchronized: true, isMissing: false };
                        }
                    });

                    // 2. Mark lines that are NOT in the snapshot as missing
                    Object.keys(prev).forEach(id => {
                        if (prev[id].isSynchronized && !fullSnapshot.lines.some((l: any) => l.id === id)) {
                            next[id] = { ...prev[id], timestamp, isMissing: true };
                        }
                    });

                    return next;
                });
            } else {
                const line = fullSnapshot.lines.find((l: any) => l.id === lineId);
                if (line) {
                    const lineChamberIds = [...(line.anodeChambers || []), ...(line.cathodeChambers || [])].map(c => c.id);
                    const lineCarts = fullSnapshot.carts.filter((c: any) => lineChamberIds.includes(c.locationChamberId));
                    setPlaybackSnapshots(prev => ({
                        ...prev,
                        [lineId]: { line, carts: lineCarts, timestamp, isSynchronized: false, isMissing: false }
                    }));
                } else {
                    // Line missing for this timestamp - 需要安全处理 prev[lineId] 为 undefined 的情况
                    setPlaybackSnapshots(prev => {
                        const existing = prev[lineId];
                        const fallbackLine = realState.lines.find(l => l.id === lineId);
                        return {
                            ...prev,
                            [lineId]: {
                                line: existing?.line || fallbackLine || { id: lineId, name: lineId },
                                carts: existing?.carts || [],
                                timestamp,
                                isSynchronized: false,
                                isMissing: true
                            }
                        };
                    });
                }
            }
        } catch (e) {
            console.error("Playback fetch error:", e);
        }
    }, []);

    const setLineSync = useCallback((lineId: string, synchronized: boolean) => {
        setPlaybackSnapshots(prev => {
            if (!prev[lineId]) return prev;
            return {
                ...prev,
                [lineId]: { ...prev[lineId], isSynchronized: synchronized }
            };
        });

        // If syncing back, trigger a global refresh to align this line
        if (synchronized) {
            setGlobalPlaybackTime(curr => {
                const triggerValue = curr;
                setPlaybackTime('all', triggerValue);
                return triggerValue;
            });
        }
    }, [setPlaybackTime]);


    const value: SystemStateContextType = {
        state,
        playback: {
            isActive: playbackActive,
            snapshots: playbackSnapshots,
            currentTime: globalPlaybackTime
        },
        error,
        actions: {
            toggleValve: handleToggleValve,
            togglePump: handleTogglePump,
            moveCart: handleMoveCart,
            createCart: handleCreateCart,
            deleteCart: handleDeleteCart,
            updateCart: handleUpdateCart,
            updateChamber: handleUpdateChamber,
            addLog: () => { },
            refreshState,
            setPlaybackMode: setPlaybackActive,
            setPlaybackTime,
            setLineSync,
            // 新增：清除特定线体的回放状态
            clearLinePlayback: (lineId: string) => {
                setPlaybackSnapshots(prev => {
                    const next = { ...prev };
                    delete next[lineId];
                    // 如果没有任何线路在回访，则关闭全局回访模式
                    if (Object.keys(next).length === 0) {
                        setPlaybackActive(false);
                    }
                    return next;
                });
            }
        }
    };

    return (
        <SystemStateContext.Provider value={value}>
            {children}
        </SystemStateContext.Provider>
    );
}

export function useSystemStateContext() {
    const context = useContext(SystemStateContext);
    if (context === undefined) {
        throw new Error('useSystemStateContext must be used within a SystemStateProvider');
    }
    return context;
}
