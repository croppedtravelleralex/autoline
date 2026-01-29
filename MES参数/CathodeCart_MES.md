# Cathode Cart MES 参数表

| 参数名称 | 数据类型 | 说明 | 示例值 |
| :--- | :--- | :--- | :--- |
| **基础状态 (Base Status)** | | | |
| CartID | string | 小车唯一标识 | C001 |
| Station | string | 当前所在工位 | C-03 (Activation) |
| Status | enum | 运行状态 (Idle/Running/Error/Paused) | Running |
| RecipeVer | string | 当前配方版本 | v1.2 |
| LoadTime | datetime | 进样时间戳 | 2026-01-18T08:30:00Z |
| ProcessTime | number (s) | 当前工步运行时长 | 1200 |
| RemainingTime | number (s) | 预计剩余时长 | 600 |
| **环境参数 (Environment)** | | | |
| Temperature | number (°C) | 当前腔体温度 (实时) | 410 |
| Vacuum | number (Pa) | 当前真空度 (实时) | 3.5e-5 |
| TargetTemp | number (°C) | 目标设定温度 | 420 |
| TargetVacuum | number (Pa) | 目标设定真空度 | 1e-6 |
| **激活工艺参数 (Activation)** | | | |
| CsCurrent | number (A) | 铯源工作电流 | 4.0 |
| O2Pressure | number (Pa) | 氧动态分压 | 2e-5 |
| PhotoCurrent | number (µA) | 光电流监测值 | 550 |
| GrowthProgress | number (%) | 生长进度百分比 | 45.5 |
| **物料追溯 (Traceability)** | | | |
| SubstrateBatch| string | 基板批次号 | FOP-260118-A |
| SourceBatch | string | 铯源批次号 (Dispenser ID) | CS-2026-X01 |
| **互锁与安全 (Interlock)** | | | |
| VacuumInterlock | boolean | 真空互锁状态 (True=Locked) | False |
| TempSafety | boolean | 温度安全状态 (True=Safe) | True |

## 质量等级划分参考

| 参数项目 | 极好 (Excellent) | 优良 (Good) | 中等 (Moderate) | 不良 (Poor) | NG (Reject) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **真空度 (Pa)** | < 1.0e-7 | 1.0e-7 ~ 5.0e-7 | 5.0e-7 ~ 2.0e-6 | 2.0e-6 ~ 1.0e-5 | > 1.0e-5 |
| **光电流 (µA)** | > 800 | 600 ~ 800 | 400 ~ 600 | 200 ~ 400 | < 200 |
| **铯源电流 (A)** | 3.5 ~ 4.2 | 4.2 ~ 4.8 | 4.8 ~ 5.5 | 5.5 ~ 6.5 | > 6.5 或 < 3.0 |
| **工作温度 (°C)** | 415 ~ 425 | 410 ~ 430 | 400 ~ 440 | 380 ~ 400 或 440 ~ 460 | < 380 或 > 460 |

> **数据来源**: 整合自 `参数/阴极工艺.md`。此表定义了 MES 系统需记录的所有阴极小车关键数据点及对应的品质判定标准。
