/**
 * 历史数据API调用模块
 */

const API_BASE_URL = 'http://localhost:8000/api';

export interface HistoryDataPoint {
    timestamp: number;
    value: number;
}

export interface HistoryResponse {
    entity_id: string;
    metric: 'temperature' | 'vacuum';
    data: HistoryDataPoint[];
}

/**
 * 获取小车历史数据
 * @param cartId 小车ID
 * @param metric 数据类型（temperature 或 vacuum）
 * @param startTime 开始时间（UNIX时间戳，秒）
 * @param endTime 结束时间（UNIX时间戳，秒）
 */
export async function fetchCartHistory(
    cartId: string,
    metric: 'temperature' | 'vacuum',
    startTime: number,
    endTime: number
): Promise<HistoryDataPoint[]> {
    try {
        const url = `${API_BASE_URL}/history/${cartId}?metric=${metric}&start_time=${startTime}&end_time=${endTime}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: HistoryResponse = await response.json();
        return result.data;
    } catch (error) {
        console.error('Failed to fetch cart history:', error);
        throw error;
    }
}

/**
 * 获取小车最新的N条历史数据
 * @param cartId 小车ID
 * @param metric 数据类型
 * @param count 数据点数量（默认100）
 */
export async function fetchCartLatestHistory(
    cartId: string,
    metric: 'temperature' | 'vacuum',
    count: number = 100
): Promise<HistoryDataPoint[]> {
    try {
        const url = `${API_BASE_URL}/history/${cartId}/latest?metric=${metric}&count=${count}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: HistoryResponse = await response.json();
        return result.data;
    } catch (error) {
        console.error('Failed to fetch latest cart history:', error);
        throw error;
    }
}
