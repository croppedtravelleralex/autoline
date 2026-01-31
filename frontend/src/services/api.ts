import type { SystemState } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchSystemState = async (): Promise<SystemState> => {
    try {
        const res = await fetch(`${API_BASE}/state`);
        if (!res.ok) {
            throw new Error(`Failed to fetch state: ${res.statusText}`);
        }
        return res.json();
    } catch (error) {
        console.error('Fetch state error:', error);
        throw error;
    }
};

export const fetchSnapshotRange = async (): Promise<{ start: number | null, end: number | null }> => {
    const res = await fetch(`${API_BASE}/history/snapshots/range`);
    if (!res.ok) throw new Error("Failed to fetch range");
    return res.json();
};

export const fetchSnapshotAt = async (timestamp: number): Promise<SystemState> => {
    const res = await fetch(`${API_BASE}/history/snapshots/at?timestamp=${timestamp}`);
    if (!res.ok) throw new Error("Snapshot not found");
    return res.json();
};

export const fetchEvents = async (startTime: number, endTime: number): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/history/events/all?start_time=${startTime}&end_time=${endTime}`);
    if (!res.ok) return [];
    return res.json();
};

export const controlValve = async (
    lineId: string,
    chamberId: string,
    valveName: string,
    action: 'open' | 'close'
) => {
    const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin","role":"admin"}');
    const res = await fetch(`${API_BASE}/valve/${lineId}/${chamberId}/${valveName}?action=${action}&operator_name=${user.username}&operator_role=${user.role}`, {
        method: 'POST',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Valve control failed');
    }
    return res.json();
};

export const controlPump = async (
    lineId: string,
    chamberId: string,
    pumpName: string,
    action: 'on' | 'off'
) => {
    const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin","role":"admin"}');
    const res = await fetch(`${API_BASE}/pump/${lineId}/${chamberId}/${pumpName}?action=${action}&operator_name=${user.username}&operator_role=${user.role}`, {
        method: 'POST',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Pump control failed');
    }
    return res.json();
};

export const moveCart = async (cartId: string, direction: 'forward' | 'backward') => {
    const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin","role":"admin"}');
    const res = await fetch(`${API_BASE}/cart/${cartId}/move?direction=${direction}&operator_name=${user.username}&operator_role=${user.role}`, {
        method: 'POST',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Cart move failed');
    }
    return res.json();
};

export const createLine = async (type: string, name: string) => {
    const res = await fetch(`${API_BASE}/lines?type=${type}&name=${name}`, {
        method: 'POST',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Create line failed');
    }
    return res.json();
};

export const updateLine = async (id: string, name: string, anodeChambers?: any[], cathodeChambers?: any[]) => {
    const response = await fetch(`${API_BASE}/lines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, anode_chambers: anodeChambers, cathode_chambers: cathodeChambers })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update line');
    }
    return response.json();
};

export const deleteLine = async (id: string) => {
    const res = await fetch(`${API_BASE}/lines/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete line failed');
    }
    return res.json();
};

export const duplicateLine = async (id: string) => {
    const res = await fetch(`${API_BASE}/lines/${id}/duplicate`, {
        method: 'POST',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Duplicate line failed');
    }
    return res.json();
};

export const createCart = async (lineId: string, chamberId: string, data: any) => {
    const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin","role":"admin"}');
    const res = await fetch(`${API_BASE}/cart?operator_name=${user.username}&operator_role=${user.role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, chamberId, data })
    });

    if (res.status === 404) {
        console.warn('API /cart not found, falling back to mock success');
        return { success: true, mock: true };
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Create cart failed');
    }
    return res.json();
};

export const deleteCart = async (cartId: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{"username":"Admin","role":"admin"}');
    const res = await fetch(`${API_BASE}/cart/${cartId}?operator_name=${user.username}&operator_role=${user.role}`, {
        method: 'DELETE',
    });

    if (res.status === 404) {
        console.warn('API /cart/:id DELETE not found, falling back to mock success');
        return { success: true, mock: true };
    }

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete cart failed');
    }
    return res.json();
};

export const updateCart = async (cartId: string, updates: Partial<any>) => {
    const res = await fetch(`${API_BASE}/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Update cart failed');
    }
    return res.json();
};

export const updateChamber = async (lineId: string, chamberId: string, updates: Partial<any>) => {
    const res = await fetch(`${API_BASE}/lines/${lineId}/chambers/${chamberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Update chamber failed');
    }
    return res.json();
};
