// export type LineType = 'anode' | 'cathode'; // Deprecated for dynamic lines
export type LineType = string;

export type ChamberType =
    | 'load_lock'
    | 'bake'
    | 'cleaning'
    | 'docking'
    | 'sealing'
    | 'growth'
    | 'unload'
    | 'transfer'
    | 'process';

export type ValveState = 'open' | 'closed' | 'opening' | 'closing';
export type DeviceStatus = 'idle' | 'running' | 'warning' | 'error' | 'maintenance';

// 工艺步骤信息
export interface ProcessStep {
    id: string;
    name: string; // 工艺名称
    status: 'pending' | 'active' | 'completed';
    startTime?: string; // 开始时间 (ISO)
    endTime?: string; // 结束时间 (ISO)
    duration?: string; // 实际/当前持续时间
    estimatedDuration: string; // 预计时长 (e.g. "2h")
}

export interface Cart {
    id: string; // 内部 ID
    number: string; // 显示编号 (例如 A-001)
    name?: string; // 自定义名称 (例如 研发样机)
    status: 'normal' | 'abnormal';
    locationChamberId: string; // 当前所在腔体 ID
    content?: string; // 例如 阳极板 #123

    // 工序进度信息
    currentTask: string; // e.g. "烘烤中"
    nextTask: string; // e.g. "待冷却"
    progress: number; // 0-100
    totalTime: string; // e.g. "12h" remainingTime: string; // e.g. "5h 30m"
    remainingTime: string;

    // 工艺步骤列表
    steps?: ProcessStep[];

    // MES 参数 - 环境参数
    temperature?: number; // 当前温度 (°C)
    vacuum?: number; // 当前真空度 (Pa)
    targetTemp?: number; // 目标温度 (°C)
    targetVacuum?: number; // 目标真空度 (Pa)

    // MES 参数 - 工艺参数（阳极）
    eGunVoltage?: number; // 电子枪电压 (kV)
    eGunCurrent?: number; // 发射电流 (µA)
    indiumTemp?: number; // 铟封温度 (°C)
    sealPressure?: number; // 压封压力 (N)

    // MES 参数 - 工艺参数（阴极）
    csCurrent?: number; // 铯源电流 (A)
    o2Pressure?: number; // 氧分压 (Pa)
    photoCurrent?: number; // 光电流 (µA)
    growthProgress?: number; // 生长进度 (%)

    // MES 参数 - 物料追溯
    recipeVer?: string; // 配方版本
    loadTime?: string; // 进样时间
    batchNo?: string; // 批次号
}

export interface ChamberValves {
    gate_valve: ValveState; // 腔体内插板阀 (隔离用)
    transfer_valve: ValveState; // 腔体间传输插板阀 (Line Connection)
    roughing_valve: ValveState; // 粗抽阀
    foreline_valve: ValveState; // 前级阀
    vent_valve: ValveState; // 放气阀
}

export interface Chamber {
    id: string;
    lineId: LineType;
    name: string;
    type: ChamberType;
    temperature: number; // 摄氏度
    highVacPressure: number; // 高级规压力 (Pa)
    forelinePressure: number; // 前级规压力 (Pa)
    state: DeviceStatus;
    valves: ChamberValves;
    molecularPump: boolean; // 分子泵状态
    roughingPump: boolean; // 粗抽泵状态
    hasCart: boolean;
    cartIds: string[]; // 腔体内的小车ID列表
    cartId?: string; // 兼容旧API，第一辆小车
    outerTemperature: number; // 外温
    maxCartCapacity: number; // 最大载具容量
    targetTemperature: number; // 设定/目标温度
    isHeating: boolean; // 是否正在加热
    heatingMode?: 'manual' | 'program' | 'off'; // 加热模式
    indiumSealing?: boolean; // 铟封功能是否启用
}

export interface LineData {
    id: LineType;
    name: string;
    anodeChambers: Chamber[];    // 阳极线腔体
    cathodeChambers: Chamber[];  // 阴极线腔体
}

export interface LogEntry {
    id: string;
    timestamp: number;
    type: 'system' | 'operation';
    content: string;
    level: 'info' | 'warn' | 'error' | 'success';
}

export interface SystemState {
    lines: LineData[];
    // anodeLine: LineData; // Removed
    // cathodeLine: LineData; // Removed
    carts: Cart[];
    timestamp: number;
    systemLogs: LogEntry[];
    operationLogs: LogEntry[];
}
