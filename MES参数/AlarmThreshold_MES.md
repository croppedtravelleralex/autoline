# Alarm Thresholds MES 参数表 (报警阈值)

| 参数名称 | 正常范围 (Normal) | 警告阈值 (Warning) | 故障阈值 (Fault) | 关联动作 (Action) |
| :--- | :--- | :--- | :--- | :--- |
| **真空系统** | | | | |
| ChamberVacuum | 5e-6 ~ 1e-4 Pa | 1e-4 ~ 5e-3 Pa | > 5e-3 Pa | Warning: 提示检查; Fault: 停机+短信 |
| DiffPressure | < 1级 (1e1 ratio) | > 1级差 | > 2级差 | **禁止打开插板阀** (互锁) |
| RoughingTime | < 30 min | 30 min ~ 1h | > 1 h | 检查粗抽阀/前级泵 |
| **温度控制** | | | | |
| BakeOutTemp | Set ± 2°C | Set ± 10°C | Set ± 25°C | 切断加热电源 (SSR) |
| CoolingWater | > 15 L/min | < 12 L/min | < 8 L/min | 停止加热以防过热 |
| **公用工程** | | | | |
| CDA_Pressure | > 0.6 MPa | < 0.45 MPa | < 0.3 MPa | 阀门保持位，报警 |
| **物料/工序** | | | | |
| CartStayTime | < 4 h | 4 h ~ 6 h | > 6 h | 启动降温保护程序 |
| IndiumTemp | 150 ~ 170°C | < 140 或 > 180°C | < 120 或 > 190°C | 停止加热/报警 (防漏气或铟熔化) |

> **数据来源**: 整合自 `参数/异常与互锁.md` 及 `工艺要求.md`。
