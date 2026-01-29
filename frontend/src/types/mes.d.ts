export interface CathodeCart {
    // Base Status
    cartId: string;
    station: string;
    status: 'Idle' | 'Running' | 'Error' | 'Paused';
    recipeVer: string;
    loadTime: string;
    processTime: number; // s
    remainingTime: number; // s

    // Environment
    temperature: number; // °C
    vacuum: number; // Pa
    targetTemp: number;
    targetVacuum: number;

    // Process
    csCurrent: number; // A
    o2Pressure: number; // Pa
    photoCurrent: number; // µA
    growthProgress: number; // %

    // Traceability
    substrateBatch: string;
    sourceBatch: string;

    // Interlock
    vacuumInterlock: boolean;
    tempSafety: boolean;
}

export interface AnodeCart {
    // Base Status
    cartId: string;
    station: string;
    status: 'Idle' | 'Running' | 'Error';
    recipeVer: string;
    loadTime: string;

    // Environment
    temperature: number;
    vacuum: number;
    targetTemp: number;
    targetVacuum: number;

    // E-Scrub
    eGunVoltage: number; // kV
    eGunCurrent: number; // µA

    // Indium Seal
    indiumTemp: number; // °C
    sealPressure: number; // N

    // Traceability
    screenBatch: string;
    indiumBatch: string;
    getterBatch: string;
    getterStatus: 'Pending' | 'Active' | 'Done';
}

export interface Utilities {
    // GN2
    nitrogenSupply: number; // L/min
    nitrogenPressure: number; // MPa
    purityStatus: string;

    // PCW
    pcwFlow: number; // L/min
    pcwTempIn: number; // °C
    pcwTempOut: number; // °C
    pcwPressure: number; // MPa

    // CDA & Power
    cdaPressure: number; // MPa
    mainPowerStatus: string;
}

export interface MaterialBatch {
    materialId: string;
    type: string;
    batchNumber: string;
    supplier: string;
    expiryDate: string; // ISO 8601
    linkedCartId: string;
}

export interface AlarmThreshold {
    parameter: string;
    normalRange: string;
    warningThreshold: string;
    faultThreshold: string;
    alarmLevel: 'Warning' | 'Fault';
    action: string;
}
