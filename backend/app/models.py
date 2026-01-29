"""
AutoLine Monitor - Backend Data Models
与前端 types/index.ts 对齐
"""

from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum


# ==================== Enums ====================

# LineType replaced by str to support dynamic lines
# class LineType(str, Enum): ...

class ChamberType(str, Enum):
    load_lock = "load_lock"
    bake = "bake"
    cleaning = "cleaning"
    docking = "docking"
    sealing = "sealing"
    growth = "growth"
    unload = "unload"
    transfer = "transfer"
    process = "process"


class ValveState(str, Enum):
    open = "open"
    closed = "closed"
    opening = "opening"
    closing = "closing"


class DeviceStatus(str, Enum):
    idle = "idle"
    running = "running"
    warning = "warning"
    error = "error"
    maintenance = "maintenance"


class LogLevel(str, Enum):
    info = "info"
    warn = "warn"
    error = "error"
    success = "success"


class LogType(str, Enum):
    system = "system"
    operation = "operation"


# ==================== Models ====================

class ChamberValves(BaseModel):
    """腔体阀门状态"""
    gate_valve: ValveState = ValveState.closed         # 腔体内插板阀 (隔离用)
    transfer_valve: ValveState = ValveState.closed     # 腔体间传输插板阀 (Line Connection)
    roughing_valve: ValveState = ValveState.closed     # 粗抽阀
    foreline_valve: ValveState = ValveState.closed     # 前级阀
    vent_valve: ValveState = ValveState.closed         # 放气阀


class Chamber(BaseModel):
    """腔体模型"""
    id: str
    lineId: str  # Changed from LineType to str
    name: str
    type: ChamberType
    temperature: float = 25.0                          # 内温（摄氏度）
    outerTemperature: float = 25.0                     # 外温（摄氏度）
    highVacPressure: float = 1e-5                      # 高真空规压力 (Pa)
    forelinePressure: float = 10.0                     # 前级规压力 (Pa)
    state: DeviceStatus = DeviceStatus.idle
    valves: ChamberValves = ChamberValves()
    molecularPump: bool = False                        # 分子泵状态
    roughingPump: bool = False                         # 粗抽泵状态
    cartIds: List[str] = []                            # 当前腔体内的小车ID列表
    maxCartCapacity: int = 1                           # 最大容纳小车数量
    targetTemperature: float = 25.0                    # 设定温度 (°C)
    isHeating: bool = False                            # 是否正在加热中
    heatingMode: Literal['manual', 'program', 'off'] = 'off' # 加热模式

    @property
    def hasCart(self) -> bool:
        return len(self.cartIds) > 0

    # 兼容旧 API，返回第一辆小车 ID
    @property
    def cartId(self) -> Optional[str]:
        return self.cartIds[0] if self.cartIds else None


class ProcessStep(BaseModel):
    """工艺步骤信息"""
    id: str
    name: str                                          # 工艺名称
    status: Literal['pending', 'active', 'completed']
    startTime: Optional[str] = None                    # 开始时间 (ISO)
    endTime: Optional[str] = None                      # 结束时间 (ISO)
    duration: Optional[str] = None                     # 实际/当前持续时间
    estimatedDuration: str                             # 预计时长 (e.g. "2h")


class Cart(BaseModel):
    """小车模型"""
    id: str
    number: str                                        # 显示编号 (例如 A-001)
    name: Optional[str] = None                         # 自定义名称 (例如 "研发样机")
    status: Literal['normal', 'abnormal'] = 'normal'
    locationChamberId: str                             # 当前所在腔体 ID
    content: Optional[str] = None                      # 例如 阳极板 #123
    recipeId: Optional[str] = None                     # 关联的配方ID

    # 工序进度信息
    currentTask: str = ""                              # e.g. "烘烤中"
    nextTask: str = ""                                 # e.g. "待冷却"
    progress: float = 0.0                              # 0-100
    totalTime: str = ""                                # e.g. "12h"
    remainingTime: str = ""                            # e.g. "5h 30m"

    # 工艺步骤列表
    steps: List[ProcessStep] = []

    # MES 参数 - 环境参数
    temperature: Optional[float] = None
    vacuum: Optional[float] = None
    targetTemp: Optional[float] = None
    targetVacuum: Optional[float] = None
    
    # MES 参数 - 工艺参数（阳极）
    eGunVoltage: Optional[float] = None
    eGunCurrent: Optional[float] = None
    indiumTemp: Optional[float] = None
    sealPressure: Optional[float] = None
    
    # MES 参数 - 工艺参数（阴极）
    csCurrent: Optional[float] = None
    o2Pressure: Optional[float] = None
    photoCurrent: Optional[float] = None
    growthProgress: Optional[float] = None
    
    # MES 参数 - 物料追溯
    recipeVer: Optional[str] = None
    loadTime: Optional[str] = None
    batchNo: Optional[str] = None


class LineData(BaseModel):
    """线体数据 - 每个线体包含阳极线和阴极线"""
    id: str
    name: str
    anodeChambers: List[Chamber] = []    # 阳极线腔体
    cathodeChambers: List[Chamber] = []  # 阴极线腔体


class LogEntry(BaseModel):
    """日志条目"""
    id: str
    timestamp: float
    type: LogType
    content: str
    level: LogLevel = LogLevel.info


class SystemState(BaseModel):
    """系统完整状态"""
    lines: List[LineData] = []
    carts: List[Cart]
    timestamp: float
    systemLogs: List[LogEntry] = []
    operationLogs: List[LogEntry] = []



class UserRole(str, Enum):
    admin = "admin"
    operator = "operator"
    observer = "observer"


class User(BaseModel):
    username: str
    role: UserRole
    token: Optional[str] = None


class AlarmLevel(str, Enum):
    warning = "warning"
    error = "error"


class NotificationSettings(BaseModel):
    enableBrowserNotifications: bool = True
    notifyOnWarning: bool = True
    notifyOnError: bool = True


class AlarmThresholds(BaseModel):
    # 温度报警 (℃)
    anodeBakeHighTemp: float = 400.0
    anodeBakeLowTemp: float = 20.0  # 暂时不用
    
    cathodeBakeHighTemp: float = 430.0
    cathodeBakeLowTemp: float = 20.0
    
    growthHighTemp: float = 250.0  # 异常高
    growthLowTemp: float = 20.0   # 异常低（生长时）
    
    # 真空报警 (Pa)
    vacuumAlertThreshold: float = 1e-3     # 本底真空破坏阈值
    processVacuumThreshold: float = 5e-4   # 工艺允许最高气压

    
class Recipe(BaseModel):
    id: str
    name: str # e.g. "Default Anode v1"
    version: str # e.g. "1.0"
    isDefault: bool = False
    targetLineType: str # 'anode' or 'cathode'
    
    # 工艺参数
    bakeDuration: float # hours, default 15.0 or 24.0
    growthDuration: float # hours, default 12.0 (only for cathode)
    
    # 阳极特定
    eGunVoltage: float = 5.0
    eGunCurrent: float = 300.0
    indiumTemp: float = 100.0
    sealPressure: float = 1200.0
    
    # 阴极特定
    csCurrent: float = 4.0
    o2Pressure: float = 2e-5
    photoCurrent: float = 550.0

    # 目标环境参数（可扩展）
    bakeTargetTemp: float = 390.0 # Anode
    growthTargetTemp: float = 110.0 # Cathode
    


class ProtocolType(str, Enum):
    simulation = "simulation"
    modbus_tcp = "modbus_tcp"
    http_api = "http_api"
    mqtt = "mqtt"

class HardwareConfig(BaseModel):
    protocol: ProtocolType = ProtocolType.simulation
    ipAddress: str = "127.0.0.1"
    port: int = 502
    slaveId: int = 1
    pollingInterval: int = 1000 # ms

class DataConfig(BaseModel):
    retentionDays: int = 30
    autoBackup: bool = False
    backupPath: str = "./backups"

class SystemSettings(BaseModel):
    theme: Literal['dark', 'light'] = 'dark'
    notifications: NotificationSettings = NotificationSettings()
    thresholds: AlarmThresholds = AlarmThresholds()
    hardware: HardwareConfig = HardwareConfig()
    data: DataConfig = DataConfig()



# ==================== Simulation Models ====================

class FaultType(str, Enum):
    temp_runaway = "temp_runaway"   # 温度失控 (高温)
    vacuum_leak = "vacuum_leak"     # 真空泄漏
    pump_failure = "pump_failure"   # 泵故障
    sensor_failure = "sensor_failure" # 传感器故障 (读数归零或乱跳)

class SimulationFault(BaseModel):
    id: str
    type: FaultType
    targetLineId: str
    targetChamberId: str
    active: bool = True
    startTime: float
    description: str = ""

class SimulationConfig(BaseModel):
    timeMultiplier: float = 1.0     # 时间加速倍率 (1.0 - 60.0)
    noiseEnabled: bool = True       # 是否开启随机噪声
    activeFaults: List[SimulationFault] = []
