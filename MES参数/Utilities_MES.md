# Utilities MES 参数表 (公用工程)

| 参数名称 | 数据类型 | 说明 | 示例值 |
| :--- | :--- | :--- | :--- |
| **高纯氮气 (GN2)** | | | |
| NitrogenSupply | number (L/min) | 主管供给流量 | 500 |
| NitrogenPressure | number (MPa) | 供气压力 (要求 0.4-0.6) | 0.55 |
| PurityStatus | enum | 纯度监测 (Pass/Fail) | Pass |
| **冷却循环水 (PCW)** | | | |
| PCW_Flow | number (L/min) | 总流量 | 120 |
| PCW_TempIn | number (°C) | 入口水温 (要求 20±2) | 20.5 |
| PCW_TempOut | number (°C) | 出口水温 | 26.0 |
| PCW_Pressure | number (MPa) | 供水压力 | 0.35 |
| **压缩空气 (CDA)** | | | |
| CDA_Pressure | number (MPa) | 驱动气源压力 (0.5-0.7) | 0.62 |
| **电力 (Power)** | | | |
| MainPowerStatus | enum | 主电源状态 (On/Off/UPS) | On |

> **数据来源**: 整合自 `参数/公用工程.md`。
