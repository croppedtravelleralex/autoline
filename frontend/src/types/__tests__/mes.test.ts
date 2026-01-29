// mes.test.ts
// 使用 Vitest/Jest 对 mesService 的 fetch 函数进行单元测试，mock fetch 返回示例数据

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchCathodeCart,
    fetchAnodeCart,
    fetchUtilities,
    fetchMaterials,
    fetchAlarms,
} from '../../services/mesService';

const mockJson = (data: any) => {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
    });
};

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
});

describe('mesService fetch functions', () => {
    it('fetchCathodeCart returns expected data', async () => {
        const sample = {
            cartId: 'C001',
            station: 'C-03',
            status: 'Running',
            recipeVer: 'v1.2',
            loadTime: '2026-01-18T08:30:00Z',
            processTime: 1200,
            remainingTime: 600,
            temperature: 410,
            vacuum: 3.5e-5,
            targetTemp: 420,
            targetVacuum: 1e-6,
            csCurrent: 4.0,
            o2Pressure: 2e-5,
            photoCurrent: 550,
            growthProgress: 45.5,
            substrateBatch: 'FOP-260118-A',
            sourceBatch: 'CS-2026-X01',
            vacuumInterlock: false,
            tempSafety: true
        };
        // @ts-ignore
        fetch.mockImplementation(() => mockJson(sample));
        const data = await fetchCathodeCart();
        expect(data).toEqual(sample);
    });

    it('fetchAnodeCart returns expected data', async () => {
        const sample = {
            cartId: 'A001',
            station: 'A-04',
            status: 'Running',
            recipeVer: 'v2.0',
            loadTime: '2026-01-18T09:15:00Z',
            temperature: 380,
            vacuum: 2e-4,
            targetTemp: 390,
            targetVacuum: 1e-4,
            eGunVoltage: 5.0,
            eGunCurrent: 300,
            indiumTemp: 100,
            sealPressure: 1200,
            getterStatus: 'Pending',
            screenBatch: 'SCR-260118-B',
            indiumBatch: 'IND-260120',
            getterBatch: 'GTR-SAES-01'
        };
        // @ts-ignore
        fetch.mockImplementation(() => mockJson(sample));
        const data = await fetchAnodeCart();
        expect(data).toEqual(sample);
    });

    it('fetchUtilities returns expected data', async () => {
        const sample = {
            nitrogenSupply: 500,
            nitrogenPressure: 0.55,
            purityStatus: 'Pass',
            pcwFlow: 120,
            pcwTempIn: 20.5,
            pcwTempOut: 26.0,
            pcwPressure: 0.35,
            cdaPressure: 0.62,
            mainPowerStatus: 'On'
        };
        // @ts-ignore
        fetch.mockImplementation(() => mockJson(sample));
        const data = await fetchUtilities();
        expect(data).toEqual(sample);
    });

    it('fetchMaterials returns expected data', async () => {
        const sample = [{ materialId: 'SUB-001', type: 'Substrate' }];
        // @ts-ignore
        fetch.mockImplementation(() => mockJson(sample));
        const data = await fetchMaterials();
        expect(data).toEqual(sample);
    });

    it('fetchAlarms returns expected data', async () => {
        const sample = [{ parameter: 'vacuum', normalRange: '5e-6-1e-4' }];
        // @ts-ignore
        fetch.mockImplementation(() => mockJson(sample));
        const data = await fetchAlarms();
        expect(data).toEqual(sample);
    });
});
