import type { SystemState, Cart, Chamber, ChamberType } from "../types";

// Helper to generate initial state
const generateChambers = (line: 'anode' | 'cathode'): Chamber[] => {
    const chambers: Chamber[] = [];

    if (line === 'anode') {
        const specs = [
            { id: 'a-jl', name: '进样仓', type: 'load_lock' },
            { id: 'a-hk', name: '烘烤仓', type: 'bake' },
            { id: 'a-qs', name: '清刷仓', type: 'cleaning' },
            { id: 'a-dj', name: '对接仓', type: 'docking' },
            { id: 'a-yf', name: '铟封仓', type: 'sealing' },
            { id: 'a-cy', name: '出样仓', type: 'unload' },
        ];

        specs.forEach((s) => {
            chambers.push({
                id: s.id,
                lineId: 'anode',
                name: s.name,
                type: s.type as ChamberType,
                temperature: 25,
                highVacPressure: 1e-5,
                forelinePressure: 10,
                state: 'idle',
                valves: {
                    gate_valve: 'closed',
                    transfer_valve: 'closed',
                    roughing_valve: 'closed',
                    foreline_valve: 'closed',
                    vent_valve: 'closed'
                },
                molecularPump: false,
                roughingPump: false,
                hasCart: false
            });
        });
    } else {
        const specs = [
            { id: 'c-jl', name: '进样仓', type: 'load_lock' },
            { id: 'c-hk', name: '烘烤仓', type: 'bake' },
            { id: 'c-sz', name: '生长仓', type: 'growth' },
            { id: 'c-cy', name: '出样仓', type: 'unload' },
        ];

        specs.forEach((s) => {
            chambers.push({
                id: s.id,
                lineId: 'cathode',
                name: s.name,
                type: s.type as ChamberType,
                temperature: 25,
                highVacPressure: 1e-5,
                forelinePressure: 10,
                state: 'idle',
                valves: {
                    gate_valve: 'closed',
                    transfer_valve: 'closed',
                    roughing_valve: 'closed',
                    foreline_valve: 'closed',
                    vent_valve: 'closed'
                },
                molecularPump: false,
                roughingPump: false,
                hasCart: false
            });
        });
    }
    return chambers;
};

const initialAnodeChambers = generateChambers('anode');
const initialCathodeChambers = generateChambers('cathode');

export const initialCarts: Cart[] = [
    {
        id: 'cart-1',
        number: 'A-001',
        status: 'normal',
        locationChamberId: 'a-hk',
        currentTask: '烘烤工艺',
        nextTask: '待冷却',
        progress: 45,
        totalTime: '12h',
        remainingTime: '6h 30m'
    },
    {
        id: 'cart-2',
        number: 'C-002',
        status: 'normal',
        locationChamberId: 'c-sz',
        currentTask: '晶体生长',
        nextTask: '待出料',
        progress: 80,
        totalTime: '24h',
        remainingTime: '4h 15m'
    },
];

export const initialSystemState: SystemState = {
    lines: [
        {
            id: 'anode',
            name: '阳极线',
            anodeChambers: initialAnodeChambers,
            cathodeChambers: []
        },
        {
            id: 'cathode',
            name: '阴极线',
            anodeChambers: [],
            cathodeChambers: initialCathodeChambers
        }
    ],
    carts: initialCarts,
    timestamp: Date.now(),
    systemLogs: [
        { id: 'log-1', timestamp: Date.now() - 100000, type: 'system', content: '系统初始化完成，连接正常', level: 'success' },
        { id: 'log-2', timestamp: Date.now() - 50000, type: 'system', content: '阳极线 VacuumController v1.2 已加载', level: 'info' }
    ],
    operationLogs: [
        { id: 'op-1', timestamp: Date.now() - 20000, type: 'operation', content: '操作员 Admin 登录系统', level: 'info' }
    ]
};
