import time
import math
import random
import threading
from typing import Optional

from app.services.state_service import StateService
from app.services.history_service import get_history_service
from app.models import Chamber, ValveState, DeviceStatus, SimulationConfig, SimulationFault, FaultType
import uuid

class SimulationService:
    def __init__(self):
        self.state_service = StateService()
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self._last_update = time.time()
        
        # Simulation Configuration
        self._config = SimulationConfig()
        
        # 小车位置追踪：{cart_id: {'chamber_id': str, 'enter_time': float}}
        self._cart_locations = {}
        # 温度突降事件追踪：{cart_id: {'temp_drop': float, 'start_time': float}}
        self._temp_drop_events = {}

    def get_config(self) -> SimulationConfig:
        return self._config

    def update_config(self, config: SimulationConfig) -> SimulationConfig:
        self._config = config
        return self._config

    def inject_fault(self, fault_type: FaultType, line_id: str, chamber_id: str) -> SimulationFault:
        fault = SimulationFault(
            id=str(uuid.uuid4()),
            type=fault_type,
            targetLineId=line_id,
            targetChamberId=chamber_id,
            startTime=time.time(),
            description=f"Manual injection of {fault_type} at {chamber_id}"
        )
        self._config.activeFaults.append(fault)
        return fault

    def clear_faults(self):
        self._config.activeFaults = []


    def start(self):
        if self.running:
            return
        
        # 启动前先检查并生成模拟历史数据
        self.generate_initial_mock_data()
        
        self.running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()

    def generate_initial_mock_data(self):
        """生成初始模拟数据（如果历史数据为空）"""
        history_service = get_history_service()
        state = self.state_service.get_state()
        
        # 简单检查是否有数据
        # 只要有一个腔体没数据，我们就补全（简化逻辑）
        needs_init = False
        all_chambers = []
        for line in state.lines:
            all_chambers.extend(line.anodeChambers + line.cathodeChambers)
        
        if not all_chambers:
            return

        # 检查第一个腔体是否有数据
        if history_service.get_data_count(all_chambers[0].id, 'temperature') == 0:
            needs_init = True
        
        if not needs_init:
            return
            
        print("Generating mock history data for chambers...")
        
        # 生成过去24小时的数据，每5分钟一个点
        now = time.time()
        start_time = now - 24 * 3600
        step = 300  # 5 minutes
        
        batch_data = []
        current_ts = start_time
        while current_ts < now:
            # 模拟每个腔体在该时刻的状态
            for chamber in all_chambers:
                # 复用温度模拟逻辑 (传入 timestamp)
                temp = self._calculate_mock_temp(chamber, current_ts)
                
                # 真空度简化模拟 (基于腔体类型和随机波动)
                vacuum = self._calculate_mock_vacuum(chamber, current_ts)
                
                batch_data.append({
                    'entity_id': chamber.id,
                    'timestamp': current_ts,
                    'temperature': temp,
                    'vacuum': vacuum
                })
            current_ts += step
        
        history_service.record_data_batch(batch_data)
        print(f"Mock history generation complete. Recorded {len(batch_data)} points.")

    def _calculate_mock_temp(self, chamber: Chamber, timestamp: float) -> float:
        """根据时间和腔体类型计算模拟温度"""
        inner_temp = 25.0
        
        # 复用 _simulate_temperature 中的逻辑，但针对特定时间点
        # 这里简化重写核心逻辑
        
        if chamber.id == 'a-hk':
            cycle_duration = 15 * 3600
            phase_time = timestamp % cycle_duration
            if phase_time < 10 * 3600:
                progress = phase_time / (10 * 3600)
                inner_temp = 25.0 + (390.0 - 25.0) * progress
            elif phase_time < 12 * 3600:
                progress = (phase_time - 10 * 3600) / (2 * 3600)
                inner_temp = 390.0 - (390.0 - 70.0) * progress
            else:
                progress = (phase_time - 12 * 3600) / (3 * 3600)
                inner_temp = 70.0 - (70.0 - 25.0) * progress
        
        elif chamber.id == 'a-dj':
            inner_temp = 95.0 + 5.0 * math.sin(timestamp * 0.01 + math.pi / 4)
            
        elif chamber.id == 'c-hk':
            inner_temp = 405.0 + 5.0 * math.sin(timestamp * 0.008 + math.pi / 3)
            
        elif chamber.id == 'c-sz':
             # 生长仓简化：随机波动在常温，偶尔有高温周期？
             # 为简化，假设大部分时间是常温，偶尔有生长任务
             # 这里简单模拟为常温 + 随机
             inner_temp = 25.0
        
        else:
            inner_temp = 25.0
            
        # 添加随机噪声
        return inner_temp + random.uniform(-1, 1)

    def _calculate_mock_vacuum(self, chamber: Chamber, timestamp: float) -> float:
        """计算模拟真空度"""
        # 简单逻辑：烘烤/生长仓高真空，其他低真空或大气
        if 'hk' in chamber.id or 'sz' in chamber.id:
            base = 1e-4 if 'hk' in chamber.id else 1e-5
            # log normal noise
            val = base * (10 ** random.uniform(-0.5, 0.5))
            return min(val, 101325.0)
        elif 'process' in chamber.type.value:
            return 1e-3 * (10 ** random.uniform(-0.5, 0.5))
        else:
            return 101325.0  # 大气压

    def _record_chamber_history(self):
        """记录所有腔体的历史数据"""
        state = self.state_service.get_state()
        history_service = get_history_service()
        
        batch_data = []
        for line in state.lines:
            anode_chambers = line.anodeChambers or []
            cathode_chambers = line.cathodeChambers or []
            for chamber in anode_chambers + cathode_chambers:
                batch_data.append({
                    'entity_id': chamber.id,
                    'temperature': chamber.temperature,
                    'vacuum': chamber.highVacPressure,
                    'timestamp': time.time()
                })
        
        if batch_data:
            history_service.record_data_batch(batch_data)

    def _update_loop(self):
        while self.running:
            now = time.time()
            real_dt = now - self._last_update
            self._last_update = now
            
            # Apply Time Multiplier
            dt = real_dt * self._config.timeMultiplier
            
            # Update Logic (every ~1s is handled by sleep, but using dt for smooth calc)
            self._simulate_temperature(dt)
            self._simulate_vacuum(dt)
            self._update_mes_data(dt)
            self._update_cart_progress(dt)
            
            # 记录腔体历史数据
            self._record_chamber_history()
            
            time.sleep(1.0) # Tick every 1 second (independent of simulation speed)

    def _simulate_temperature(self, dt: float):
        """温度趋势模拟 - 基于配方与物理模型"""
        state = self.state_service.get_state()
        current_time = time.time()
        
        # 获取配方服务
        from app.services.recipe_service import get_recipe_service
        recipe_service = get_recipe_service()
        
        # 缓存配方以减少IO (每秒一次不必每次都读，服务有内存缓存)
        
        for line in state.lines:
            all_chambers = line.anodeChambers + line.cathodeChambers
            for chamber in all_chambers:
                target_inner = 25.0
                target_outer = 25.0
                
                cart_in_chamber = next((c for c in state.carts if c.locationChamberId == chamber.id), None)
                
                if cart_in_chamber and cart_in_chamber.recipeId:
                    recipe = recipe_service.get_recipe(cart_in_chamber.recipeId)
                    if recipe:
                        # 基于当前任务决定目标温度
                        task_name = cart_in_chamber.currentTask
                        
                        # ========== 烘烤工艺 ==========
                        if '烘烤' in task_name or 'bake' in chamber.type.value:
                            # 查找烘烤工序的开始时间
                            start_time = None
                            for step in cart_in_chamber.steps:
                                if '烘烤' in step.name and step.status == 'active' and step.startTime:
                                    import datetime
                                    st = datetime.datetime.fromisoformat(step.startTime)
                                    start_time = st.timestamp()
                                    break
                            
                            if start_time:
                                elapsed = current_time - start_time
                                total_duration = recipe.bakeDuration * 3600
                                
                                # 简单曲线: 
                                # 0 - 70% 时间: 升温/恒温到 Target
                                # 70% - 85% 时间: 开始降温
                                # 85% - 100% 时间: 降温到出炉温度 (e.g. 70C)
                                
                                heat_phase = total_duration * 0.7
                                cool_phase_1 = total_duration * 0.85
                                
                                if elapsed < heat_phase:
                                    # 升温/恒温
                                    target_inner = recipe.bakeTargetTemp
                                elif elapsed < cool_phase_1:
                                    # 降温阶段 1
                                    target_inner = 70.0 + (recipe.bakeTargetTemp - 70.0) * (1 - (elapsed - heat_phase) / (cool_phase_1 - heat_phase))
                                elif elapsed < total_duration:
                                    # 降温阶段 2
                                    target_inner = 70.0 - (70.0 - 25.0) * ((elapsed - cool_phase_1) / (total_duration - cool_phase_1))
                                else:
                                    target_inner = 25.0
                                    
                                target_outer = target_inner + 20.0 # 外温略高
                            else:
                                target_inner = recipe.bakeTargetTemp
                                target_outer = target_inner + 20.0

                        # ========== 生长工艺 (阴极) ==========
                        elif '生长' in task_name and recipe.targetLineType == 'cathode':
                             # 查找生长工序
                            start_time = None
                            for step in cart_in_chamber.steps:
                                if '生长' in step.name and step.status == 'active' and step.startTime:
                                    import datetime
                                    st = datetime.datetime.fromisoformat(step.startTime)
                                    start_time = st.timestamp()
                                    break
                            
                            if start_time:
                                elapsed = current_time - start_time
                                # 生长过程降温: 230 -> 110 (或配置)
                                # 假设起始温度是烘烤后的余温或者特定生长起始温
                                start_temp = 230.0 
                                end_temp = recipe.growthTargetTemp
                                
                                # 假设降温过程占 5 小时，其余时间恒温
                                drop_duration = 5 * 3600
                                
                                if elapsed < drop_duration:
                                    target_inner = start_temp - (start_temp - end_temp) * (elapsed / drop_duration)
                                else:
                                    target_inner = end_temp
                                    
                                target_outer = target_inner
                            else:
                                target_inner = recipe.growthTargetTemp
                                target_outer = target_inner

                        # ========== 对接/铟封/其他 ==========
                        elif '对接' in task_name:
                            target_inner = recipe.indiumTemp if recipe.indiumTemp > 0 else 95.0
                            target_outer = target_inner + 30.0
                        elif '铟封' in task_name:
                             target_inner = recipe.indiumTemp
                             target_outer = target_inner + 20.0
                        
                # 无小车或无配方，按照腔体自身的设定温度逐渐恢复
                if not cart_in_chamber:
                    target_inner = chamber.targetTemperature
                    target_outer = target_inner + 10.0 # 外温略高
                
                # 更新加热指示状态
                # 如果用户手动设置了加热模式（manual/program），尊重用户设置
                # 只有在 heatingMode 为 off 或未设置时，才根据温度差自动判断
                if chamber.heatingMode in ('manual', 'program'):
                    # 用户手动控制，保持当前 isHeating 状态不变
                    pass
                else:
                    # 自动模式：如果目标温度高于当前温度 1度以上，认为是在加热
                    chamber.isHeating = target_inner > chamber.temperature + 1.0
                
                # 应用更新 (低通滤波模拟热惯性)
                # dt 约 1s
                # 热时间常数 tau ~ 150s (从 300s 调快，使趋势更明显)
                tau = 150.0
                
                # 如果正在加热，可以使用非线性加速（前期升温快）
                if chamber.isHeating:
                    # 距离目标越远，热交换效率越高，这里稍微增强 alpha
                    temp_diff = target_inner - chamber.temperature
                    boost = 1.0 + (temp_diff / 100.0) # 每 100度 增加一倍速率
                    alpha = (dt / tau) * min(2.0, boost)
                else:
                    alpha = dt / tau
                    
                chamber.temperature = chamber.temperature * (1 - alpha) + target_inner * alpha
                chamber.outerTemperature = chamber.outerTemperature * (1 - alpha) + target_outer * alpha
                
                # Check for active faults
                for fault in self._config.activeFaults:
                    if fault.active and fault.targetChamberId == chamber.id:
                        if fault.type == FaultType.temp_runaway:
                            # 模拟温度失控：极速升温
                            chamber.temperature += 5.0 * dt * self._config.timeMultiplier 
                            chamber.state = DeviceStatus.error

                # 加上微小随机波动 (如果开启)
                if self._config.noiseEnabled:
                    chamber.temperature += random.uniform(-0.1, 0.1)
                    chamber.outerTemperature += random.uniform(-0.1, 0.1)


    def _simulate_vacuum(self, dt: float):
        """真空度趋势模拟 - 详细物理模型"""
        state = self.state_service.get_state()

        # 真空度参数配置
        VACUUM_PARAMS = {
            'roughing_target': 1.0,           # 粗抽泵目标压力 (Pa)
            'roughing_time_const': 60.0,      # 粗抽时间常数 (秒)
            'molecular_target': 1e-5,         # 分子泵目标压力 (Pa)
            'molecular_time_const': 300.0,    # 分子泵时间常数 (秒)
            'leak_rate_bake': 1e-7,          # 烘烤仓泄漏率 (Pa/s)
            'leak_rate_normal': 5e-8,        # 普通腔体泄漏率 (Pa/s)
            'leak_rate_growth': 1e-8,        # 生长仓泄漏率 (Pa/s, 超高真空)
            'vent_time_const': 10.0,         # 放气时间常数 (秒)
            'atm_pressure': 101325.0,        # 大气压 (Pa)
        }

        for line in state.lines:
            all_chambers = line.anodeChambers + line.cathodeChambers
            for chamber in all_chambers:
                current_p = chamber.highVacPressure
                target_p = VACUUM_PARAMS['atm_pressure']
                time_const = 1.0
                
                # 防止压力值异常
                if current_p <= 0:
                    current_p = 1e-7
                    chamber.highVacPressure = current_p
                
                # ========== 判断设备状态 ==========
                roughing_on = chamber.roughingPump
                molecular_on = chamber.molecularPump
                vent_open = chamber.valves.vent_valve == ValveState.open
                
                # ========== 放气阶段（优先级最高）==========
                if vent_open:
                    target_p = VACUUM_PARAMS['atm_pressure']
                    time_const = VACUUM_PARAMS['vent_time_const']
                
                # ========== 抽真空阶段 ==========
                elif roughing_on or molecular_on:
                    if roughing_on and not molecular_on:
                        # 仅粗抽：降到 1 Pa
                        target_p = VACUUM_PARAMS['roughing_target']
                        time_const = VACUUM_PARAMS['roughing_time_const']
                    elif molecular_on:
                        # 分子泵：降到 1e-5 Pa（需要前级粗抽泵配合）
                        if current_p > 10.0:
                            # 压力太高，分子泵效率低，先粗抽
                            target_p = VACUUM_PARAMS['roughing_target']
                            time_const = VACUUM_PARAMS['roughing_time_const']
                        else:
                            # 高真空阶段
                            target_p = VACUUM_PARAMS['molecular_target']
                            # 根据腔体类型调整目标真空度
                            if 'sz' in chamber.id or 'growth' in chamber.type.value:
                                target_p = 1e-6  # 生长仓超高真空
                            time_const = VACUUM_PARAMS['molecular_time_const']
                
                # ========== 泄漏阶段（泵关闭且未放气）==========
                else:
                    # 根据腔体类型选择泄漏率
                    if 'hk' in chamber.id or 'bake' in chamber.type.value:
                        leak_rate = VACUUM_PARAMS['leak_rate_bake']
                    elif 'sz' in chamber.id or 'growth' in chamber.type.value:
                        leak_rate = VACUUM_PARAMS['leak_rate_growth']
                    else:
                        leak_rate = VACUUM_PARAMS['leak_rate_normal']
                    
                    # 检查故障注入
                    for fault in self._config.activeFaults:
                        if fault.active and fault.targetChamberId == chamber.id:
                            if fault.type == FaultType.vacuum_leak:
                                leak_rate = 100.0 # 严重泄漏
                                chamber.state = DeviceStatus.error
                    
                    # 线性泄漏模型
                    delta_p = leak_rate * dt
                    new_p = current_p + delta_p
                    chamber.highVacPressure = min(new_p, VACUUM_PARAMS['atm_pressure'])
                    continue  # 跳过指数逼近
                
                # ========== 指数逼近模型 ==========
                # P(t) = P_target + (P_current - P_target) * exp(-dt / tau)
                if target_p < current_p:
                    # 抽真空（压力下降）
                    chamber.highVacPressure = target_p + (current_p - target_p) * math.exp(-dt / time_const)
                else:
                    # 放气或泄漏（压力上升）
                    chamber.highVacPressure = target_p - (target_p - current_p) * math.exp(-dt / time_const)
                
                chamber.highVacPressure = max(1e-9, min(chamber.highVacPressure, VACUUM_PARAMS['atm_pressure']))

    def _update_mes_data(self, dt: float):
        """更新小车MES数据"""
        state = self.state_service.get_state()
        current_time = time.time()
        cart_batch_data = []
        
        for cart in state.carts:
            # ========== 位置变化检测 ==========
            current_chamber_id = cart.locationChamberId
            
            # 检查小车位置是否发生变化
            if cart.id not in self._cart_locations:
                # 新小车，记录初始位置
                self._cart_locations[cart.id] = {
                    'chamber_id': current_chamber_id,
                    'enter_time': current_time
                }
            elif self._cart_locations[cart.id]['chamber_id'] != current_chamber_id:
                # 小车移动到了新腔体
                old_chamber_id = self._cart_locations[cart.id]['chamber_id']
                
                # 更新位置
                self._cart_locations[cart.id] = {
                    'chamber_id': current_chamber_id,
                    'enter_time': current_time
                }
                
                # 检查是否是阴极小车进入烘烤仓
                if cart.number.startswith('C') and 'hk' in current_chamber_id:
                    # 触发温度突降事件：下降3-5℃
                    temp_drop = random.uniform(3.0, 5.0)
                    self._temp_drop_events[cart.id] = {
                        'temp_drop': temp_drop,
                        'start_time': current_time,
                        'duration': 120  # 2分钟内恢复
                    }
            
            # 查找小车所在腔体
            chamber = None
            for line in state.lines:
                anode_chambers = line.anodeChambers or []
                cathode_chambers = line.cathodeChambers or []
                for ch in anode_chambers + cathode_chambers:
                    if ch.id == cart.locationChamberId:
                        chamber = ch
                        break
                if chamber:
                    break
            
            if not chamber:
                continue
            
            # 更新环境参数（从腔体读取）
            cart.temperature = chamber.temperature
            cart.vacuum = chamber.highVacPressure
            
            # ========== 应用温度突降效果 ==========
            if cart.id in self._temp_drop_events:
                event = self._temp_drop_events[cart.id]
                elapsed = current_time - event['start_time']
                
                if elapsed < event['duration']:
                    # 温度突降效果仍在持续
                    # 使用指数恢复曲线：从最大下降值逐渐恢复到正常
                    recovery_progress = elapsed / event['duration']
                    current_drop = event['temp_drop'] * (1 - recovery_progress)
                    cart.temperature -= current_drop
                else:
                    # 恢复完成，移除事件
                    del self._temp_drop_events[cart.id]
            
            
            # 根据当前工艺阶段更新工艺参数
            current_task = cart.currentTask.lower()
            
            # ========== 阳极小车MES参数 ==========
            if cart.number.startswith('A'):
                # 清刷工艺：电子枪参数
                if '清刷' in current_task or 'scrub' in current_task:
                    cart.eGunVoltage = 5.0 + random.uniform(-0.2, 0.2)
                    cart.eGunCurrent = 300.0 + random.uniform(-10, 10)
                else:
                    cart.eGunVoltage = 0.0
                    cart.eGunCurrent = 0.0
                
                # 铟封工艺：铟封参数
                if '铟封' in current_task or 'seal' in current_task:
                    cart.indiumTemp = 100.0 + random.uniform(-5, 5)
                    cart.sealPressure = 1200.0 + random.uniform(-50, 50)
                else:
                    cart.indiumTemp = chamber.temperature
                    cart.sealPressure = 0.0
                
                # 目标温度和真空度（根据腔体类型）
                if 'hk' in chamber.id:  # 烘烤仓
                    cart.targetTemp = 390.0
                    cart.targetVacuum = 1e-4
                elif 'dj' in chamber.id:  # 对接仓
                    cart.targetTemp = 100.0
                    cart.targetVacuum = 1e-5
                else:
                    cart.targetTemp = 25.0
                    cart.targetVacuum = 1e-5
            
            # ========== 阴极小车MES参数 ==========
            elif cart.number.startswith('C'):
                # 生长工艺：铯源和光电流参数
                if '生长' in current_task or 'growth' in current_task:
                    cart.csCurrent = 4.0 + random.uniform(-0.2, 0.2)
                    cart.o2Pressure = 2e-5 + random.uniform(-1e-6, 1e-6)
                    cart.photoCurrent = 550.0 + random.uniform(-20, 20)
                    
                    # 计算生长进度
                    if cart.steps:
                        for step in cart.steps:
                            if '生长' in step.name and step.status == 'active' and step.startTime:
                                import datetime
                                start = datetime.datetime.fromisoformat(step.startTime)
                                now = datetime.datetime.now()
                                elapsed_hours = (now - start).total_seconds() / 3600
                                # 假设生长工艺12小时
                                cart.growthProgress = min(100.0, (elapsed_hours / 12.0) * 100)
                                break
                else:
                    cart.csCurrent = 0.0
                    cart.o2Pressure = 1e-7
                    cart.photoCurrent = 0.0
                    if '生长' not in current_task:
                        cart.growthProgress = 0.0
                
                # 目标温度和真空度
                if 'hk' in chamber.id:  # 烘烤仓
                    cart.targetTemp = 420.0
                    cart.targetVacuum = 1e-5
                elif 'sz' in chamber.id:  # 生长仓
                    cart.targetTemp = 110.0  # 生长结束温度
                    cart.targetVacuum = 1e-6
                else:
                    cart.targetTemp = 25.0
                    cart.targetVacuum = 1e-5
            
            # ========== 准备批量记录历史数据 ==========
            cart_batch_data.append({
                'entity_id': cart.id,
                'temperature': cart.temperature,
                'vacuum': cart.vacuum,
                'timestamp': current_time
            })

        if cart_batch_data:
            history_service = get_history_service()
            history_service.record_data_batch(cart_batch_data)

    def _update_cart_progress(self, dt: float):
         state = self.state_service.get_state()
         for cart in state.carts:
             if cart.status == 'normal' and cart.progress < 100:
                 # Add some progress (e.g. 1% every few seconds)
                 cart.progress = min(100.0, cart.progress + 0.5 * dt)
