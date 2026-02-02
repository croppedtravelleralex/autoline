import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { SystemState, LineType, Cart, InspectionRecord } from '../types';
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
    // 自动点检配置
    autoInspection: {
        interval: number; // 分钟，0 表示手动模式
        setInterval: (minutes: number) => void;
        timeToNext: number; // 距离下次点检的秒数
    };
    actions: {
        toggleValve: (lineId: LineType, chamberId: string, valveName: any) => Promise<void>;
        togglePump: (lineId: LineType, chamberId: string, pumpType: 'molecular' | 'roughing') => Promise<void>;
        moveCart: (cartId: string, direction: 'forward' | 'backward') => Promise<void>;
        createCart: (lineId: string, chamberId: string, polarity: string, data: any) => Promise<any>;
        deleteCart: (cartId: string) => Promise<any>;
        updateCart: (cartId: string, updates: Partial<Cart>) => Promise<any>;
        updateChamber: (lineId: string, chamberId: string, updates: Partial<any>) => Promise<any>;
        addLog: () => void;
        refreshState: () => Promise<void>;
        setPlaybackMode: (active: boolean) => void;
        setPlaybackTime: (lineId: string | 'all', timestamp: number) => Promise<void>;
        setLineSync: (lineId: string, synchronized: boolean) => void;
        clearLinePlayback: (lineId: string) => void;
        triggerInspection: (type?: 'manual' | 'auto') => Promise<InspectionRecord>;
        deleteLine: (lineId: string) => Promise<any>;
    };
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export function SystemStateProvider({ children }: { children: ReactNode }) {
    const [realState, setRealState] = useState<SystemState>(initialSystemState);
    const [playbackActive, setPlaybackActive] = useState(false);
    const [playbackSnapshots, setPlaybackSnapshots] = useState<Record<string, { line: any; carts: Cart[]; timestamp: number; isSynchronized: boolean; isMissing?: boolean }>>({});
    const [globalPlaybackTime, setGlobalPlaybackTime] = useState<number>(Date.now() / 1000);
    const [error, setError] = useState<string | null>(null);

    // 自动点检状态 - 持久化到 localStorage
    const [autoInspectionInterval, setAutoInspectionIntervalState] = useState<number>(() => {
        return parseInt(localStorage.getItem('autoInspectionInterval') || '0', 10);
    });
    const [timeToNextInspection, setTimeToNextInspection] = useState<number>(() => {
        const interval = parseInt(localStorage.getItem('autoInspectionInterval') || '0', 10);
        return interval * 60; // 初始化为完整间隔（秒）
    });

    // 🚀 快照缓存，用于极大提升拖拽流畅度
    const snapshotCache = useRef<Record<number, any>>({});
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

            const safeLines = Array.isArray(realState.lines) ? realState.lines :
                (Array.isArray((realState as any).lines) ? (realState as any).lines : []);
            const safeCarts = Array.isArray(realState.carts) ? realState.carts :
                (Array.isArray((realState as any).carts) ? (realState as any).carts : []);

            const derivedState = {
                ...initialSystemState,
                ...realState,
                lines: safeLines.map((line: any) => {
                    if (!line || !line.id) return line;
                    const snap = playbackSnapshots?.[line.id];

                    // 1. 如果有有效的回放快照，使用快照数据
                    if (snap && !snap.isMissing && snap.line) {
                        return { ...snap.line, name: line.name };
                    }

                    const anodeChambers = line.anodeChambers || (line as any).anode_chambers || [];
                    const cathodeChambers = line.cathodeChambers || (line as any).cathode_chambers || [];

                    // 2. 如果该线路正在回放但是缺失数据，显示为离线
                    if (snap && snap.isMissing) {
                        return {
                            ...line,
                            anodeChambers: offlineChambers(anodeChambers),
                            cathodeChambers: offlineChambers(cathodeChambers)
                        };
                    }

                    // 3. 实时模式：保持原有状态
                    return {
                        ...line,
                        anodeChambers,
                        cathodeChambers
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
                                const anodeChambers = l.anodeChambers || (l as any).anode_chambers || [];
                                const cathodeChambers = l.cathodeChambers || (l as any).cathode_chambers || [];
                                const chambers = [...anodeChambers, ...cathodeChambers];
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

    const handleCreateCart = useCallback(async (lineId: string, chamberId: string, polarity: string, data: any) => {
        const { createCart } = await import('../services/api');
        await createCart(lineId, chamberId, polarity, data);
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

    const handleTriggerInspection = useCallback(async (type: 'manual' | 'auto' = 'manual'): Promise<InspectionRecord> => {
        const { triggerInspection } = await import('../services/api');
        const record = await triggerInspection(type);
        await refreshState();
        return record;
    }, [refreshState]);

    const handleDeleteLine = useCallback(async (lineId: string) => {
        const { deleteLine } = await import('../services/api');
        await deleteLine(lineId);
        await refreshState();
    }, [refreshState]);

    // 自动点检间隔设置器
    const setAutoInspectionInterval = useCallback((minutes: number) => {
        setAutoInspectionIntervalState(minutes);
        localStorage.setItem('autoInspectionInterval', String(minutes));
        setTimeToNextInspection(minutes * 60); // 重置倒计时
    }, []);

    // 全局自动点检定时器（每秒更新倒计时）
    useEffect(() => {
        if (autoInspectionInterval <= 0) return;

        const timer = setInterval(async () => {
            setTimeToNextInspection(prev => {
                if (prev <= 1) {
                    // 触发自动点检
                    handleTriggerInspection('auto').catch(console.error);
                    return autoInspectionInterval * 60; // 重置倒计时
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [autoInspectionInterval, handleTriggerInspection]);

    const setPlaybackTime = useCallback(async (lineId: string | 'all', timestamp: number) => {
        try {
            const { fetchSnapshotAt } = await import('../services/api');

            // 1. 尝试从缓存获取快照
            const cacheKey = Math.round(timestamp);
            let fullSnapshot = snapshotCache.current[cacheKey];

            if (!fullSnapshot) {
                fullSnapshot = await fetchSnapshotAt(timestamp);
                // 写入缓存，限制大小避免内存溢出
                snapshotCache.current[cacheKey] = fullSnapshot;
                const keys = Object.keys(snapshotCache.current);
                if (keys.length > 50) delete snapshotCache.current[Number(keys[0])];
            }

            if (lineId === 'all') {
                setGlobalPlaybackTime(timestamp);
                setPlaybackActive(true);
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


    const value = useMemo<SystemStateContextType>(() => ({
        state,
        playback: {
            isActive: playbackActive,
            snapshots: playbackSnapshots,
            currentTime: globalPlaybackTime
        },
        error,
        autoInspection: {
            interval: autoInspectionInterval,
            setInterval: setAutoInspectionInterval,
            timeToNext: timeToNextInspection
        },
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
            },
            triggerInspection: handleTriggerInspection,
            deleteLine: handleDeleteLine,
        }
    }), [state, playbackActive, playbackSnapshots, globalPlaybackTime, handleToggleValve, handleTogglePump, handleMoveCart, handleCreateCart, handleDeleteCart, handleUpdateCart, handleUpdateChamber, refreshState, setPlaybackTime, handleTriggerInspection, handleDeleteLine, error, autoInspectionInterval, setAutoInspectionInterval, timeToNextInspection]);

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
