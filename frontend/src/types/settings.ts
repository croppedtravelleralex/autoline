export type AlarmLevel = 'warning' | 'error';

export interface NotificationSettings {
    enableBrowserNotifications: boolean;
    notifyOnWarning: boolean;
    notifyOnError: boolean;
}

export interface AlarmThresholds {
    anodeBakeHighTemp: number;
    anodeBakeLowTemp: number;

    cathodeBakeHighTemp: number;
    cathodeBakeLowTemp: number;

    growthHighTemp: number;
    growthLowTemp: number;

    vacuumAlertThreshold: number;
    processVacuumThreshold: number;
}

export interface Recipe {
    id: string;
    name: string;
    version: string;
    isDefault: boolean;
    targetLineType: 'anode' | 'cathode';

    // Process Parameters
    bakeDuration: number;
    growthDuration: number;

    // Anode Specific
    eGunVoltage: number;
    eGunCurrent: number;
    indiumTemp: number;
    sealPressure: number;

    // Cathode Specific
    csCurrent: number;
    o2Pressure: number;
    photoCurrent: number;

    // Targets
    bakeTargetTemp: number;
    growthTargetTemp: number;
}

export type ProtocolType = "simulation" | "modbus_tcp" | "http_api" | "mqtt";

export interface HardwareConfig {
    protocol: ProtocolType;
    ipAddress: string;
    port: number;
    slaveId: number;
    pollingInterval: number;
}

export interface DataConfig {
    retentionDays: number;
    autoBackup: boolean;
    backupPath: string;
}

export interface SystemSettings {
    theme: 'dark' | 'light';
    notifications: NotificationSettings;
    thresholds: AlarmThresholds;
    hardware: HardwareConfig;
    data: DataConfig;
}
