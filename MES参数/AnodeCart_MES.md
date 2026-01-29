# Anode Cart MES 参数表

| 参数名称 | 数据类型 | 说明 | 示例值 |
| :--- | :--- | :--- | :--- |
| **基础状态 (Base Status)** | | | |
| CartID | string | 小车唯一标识 | A001 |
| Station | string | 当前所在工位 | A-04 (Scrub) |
| Status | enum | 运行状态 (Idle/Running/Error) | Running |
| RecipeVer | string | 当前配方版本 | v2.0 |
| LoadTime | datetime | 进样时间戳 | 2026-01-18T09:15:00Z |
| **环境参数 (Environment)** | | | |
| Temperature | number (°C) | 当前温度 | 380 |
| Vacuum | number (Pa) | 当前真空度 | 2e-4 |
| TargetTemp | number (°C) | 目标设定温度 | 390 |
| TargetVacuum | number (Pa) | 目标设定真空度 | 1e-4 |
| **电子刷洗 (E-Scrub)** | | | |
| EGunVoltage | number (kV) | 电子枪加速电压 | 5.0 |
| EGunCurrent | number (µA) | 发射电流 | 300 |
| **对接与铟封 (Indium Seal)** | | | |
| IndiumTemp | number (°C) | 铟封处监测温度 | 100 |
| SealPressure | number (N) | 压封压力值 | 1200 |
| GetterStatus | enum | 吸气剂激活状态 (Pending/Active/Done) | Pending |
| **物料追溯 (Traceability)** | | | |
| ScreenBatch | string | 荧光屏批次号 | SCR-260118-B |
| IndiumBatch | string | 铟圈批次号 | IND-260120 |
| GetterBatch | string | 吸气剂批次号 | GTR-SAES-01 |

## 质量等级划分参考

| 参数项目 | 极好 (Excellent) | 优良 (Good) | 中等 (Moderate) | 不良 (Poor) | NG (Reject) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **真空度 (Pa)** | < 5.0e-5 | 5.0e-5 ~ 1.0e-4 | 1.0e-4 ~ 5.0e-4 | 5.0e-4 ~ 1.0e-3 | > 1.0e-3 |
| **刷洗电流 (µA)** | 280 ~ 320 | 250 ~ 350 | 200 ~ 400 | 100 ~ 200 | < 100 或 > 500 |
| **铟封温度 (°C)** | 155 ~ 165 | 150 ~ 170 | 140 ~ 180 | 120 ~ 140 | < 120 或 > 190 |
| **压封压力 (N)** | 1150 ~ 1250 | 1000 ~ 1400 | 800 ~ 1600 | 500 ~ 800 | < 500 或 > 2000 |

> **数据来源**: 整合自 `参数/阳极工艺.md`。此表定义了 MES 系统需记录的所有阳极小车关键数据点及对应的品质判定标准。
