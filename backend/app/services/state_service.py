import uuid
import time
from typing import List
from threading import Lock

from app.models import (
    ValveState,
    ChamberValves,
    Chamber,
    Cart,
    LineData,
    SystemState,
    LogEntry,
)

# Simple in-memory singleton service
class StateService:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(StateService, cls).__new__(cls)
                    cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        # Initialize mock data similar to frontend mockData
        def create_chamber(id: str, line: str, name: str, type_: str) -> Chamber:
            return Chamber(
                id=id,
                lineId=line,
                name=name,
                type=type_,
                temperature=25.0,
                outerTemperature=25.0,
                highVacPressure=1e-5,
                forelinePressure=10.0,
                state='idle',
                valves=ChamberValves(
                    gate_valve='closed',
                    transfer_valve='closed',
                    roughing_valve='closed',
                    foreline_valve='closed',
                    vent_valve='closed',
                ),
                molecularPump=False,
                roughingPump=False,
                cartIds=[],
                maxCartCapacity=1,
                targetTemperature=25.0 if type_ != 'bake' else 150.0 # 默认烘烤仓预热150
            )

        anode_chambers = [
            create_chamber('a-jl', 'anode', '进样仓', 'load_lock'),
            create_chamber('a-hk', 'anode', '烘烤仓', 'bake'),
            create_chamber('a-qs', 'anode', '清刷仓', 'cleaning'),
            create_chamber('a-dj', 'anode', '对接仓', 'docking'),
            create_chamber('a-yf', 'anode', '铟封仓', 'sealing'),
            create_chamber('a-cy', 'anode', '出样仓', 'unload'),
        ]
        cathode_chambers = [
            create_chamber('c-jl', 'cathode', '进样仓', 'load_lock'),
            create_chamber('c-hk', 'cathode', '烘烤仓', 'bake'),
            create_chamber('c-sz', 'cathode', '生长仓', 'growth'),
            create_chamber('c-cy', 'cathode', '出样仓', 'unload'),
        ]

        carts = [
            Cart(
                id='cart-1',
                number='A-001',
                name='1#阳极小车',
                status='normal',
                locationChamberId='a-hk',
                currentTask='烘烤工艺',
                nextTask='待冷却',
                progress=45,
                totalTime='12h',
                remainingTime='6h 30m',
            ),
            Cart(
                id='cart-2',
                number='C-002',
                name='1#阴极小车',
                status='normal',
                locationChamberId='c-sz',
                currentTask='晶体生长',
                nextTask='待出料',
                progress=80,
                totalTime='24h',
                remainingTime='4h 15m',
            ),
        ]

        # Use new 'lines' field - each line contains both anode and cathode chambers
        self.state = SystemState(
            lines=[
                LineData(
                    id='line-1', 
                    name='1号线', 
                    anodeChambers=anode_chambers,
                    cathodeChambers=cathode_chambers
                ),
            ],
            carts=carts,
            timestamp=time.time() * 1000,
            systemLogs=[],
            operationLogs=[
                # Initial mock log in new format
                LogEntry(
                    id='init-log-1',
                    timestamp=time.time() * 1000,
                    type='operation',
                    content='系统管理员 admin 初始化了 1# 产线监控系统',
                    level='info'
                )
            ],
        )

    def get_state(self) -> SystemState:
        return self.state

    def _add_log(self, log: LogEntry, log_type: str = 'system'):
        if log_type == 'system':
            self.state.systemLogs.insert(0, log)
            self.state.systemLogs = self.state.systemLogs[:50]
        else:
            self.state.operationLogs.insert(0, log)
            self.state.operationLogs = self.state.operationLogs[:50]
        
        # Record into HistoryService for playback markers
        from app.services.history_service import get_history_service
        try:
            get_history_service().record_event(
                type=log_type,
                content=log.content,
                level=log.level,
                timestamp=log.timestamp / 1000.0
            )
        except Exception as e:
            print(f"Error bridging log to history: {e}")

    def clear_operation_logs(self):
        self.state.operationLogs = []
        return True

    def update_chamber(self, line_id: str, chamber_id: str, updates: dict):
        print(f"[DEBUG] update_chamber called: line_id={line_id}, chamber_id={chamber_id}")
        print(f"[DEBUG] Updates received: {updates}")
        print(f"[DEBUG] Available lines: {[l.id for l in self.state.lines]}")
        
        line = next((l for l in self.state.lines if l.id == line_id), None)
        if not line:
            raise ValueError(f'Line not found: {line_id}')
        
        all_chambers = (line.anodeChambers or []) + (line.cathodeChambers or [])
        print(f"[DEBUG] Available chambers in line {line_id}: {[c.id for c in all_chambers]}")
        
        chamber = next((c for c in all_chambers if c.id == chamber_id), None)
        if not chamber:
            raise ValueError(f'Chamber not found: {chamber_id}')
        
        # Apply updates
        for key, value in updates.items():
            print(f"[DEBUG] Setting {key} = {value}, hasattr = {hasattr(chamber, key)}")
            if hasattr(chamber, key):
                setattr(chamber, key, value)

        
        self._add_log(LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='system',
            content=f"管理员更新了线体 {line.name} 中 {chamber.name} 的设置",
            level='info'
        ), 'system')
        
        return chamber

    def update_cart(self, cart_id: str, updates: dict):
        cart = next((c for c in self.state.carts if c.id == cart_id), None)
        if not cart:
            raise ValueError('Cart not found')
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(cart, key):
                setattr(cart, key, value)
        
        return cart

    def _find_chamber(self, chamber_id: str):
        for line in self.state.lines:
            # Search in anode chambers
            for chamber in line.anodeChambers:
                if chamber.id == chamber_id:
                    return line, chamber, 'anode'
            # Search in cathode chambers
            for chamber in line.cathodeChambers:
                if chamber.id == chamber_id:
                    return line, chamber, 'cathode'
        return None, None, None

    def create_line(self, line_type: str, name: str):
        new_id = f"line-{uuid.uuid4().hex[:8]}"
        # 创建带有默认腔体的新线体
        default_anode = Chamber(
            id=f"{new_id}-a-default",
            lineId=new_id,
            name="进样仓",
            type="load_lock",
            temperature=25.0,
            highVacPressure=1e-5,
            forelinePressure=10.0,
            state="idle",
            valves=ChamberValves(),
            molecularPump=False,
            roughingPump=False,
            hasCart=False,
            cartId=None,
        )
        default_cathode = Chamber(
            id=f"{new_id}-c-default",
            lineId=new_id,
            name="进样仓",
            type="load_lock",
            temperature=25.0,
            highVacPressure=1e-5,
            forelinePressure=10.0,
            state="idle",
            valves=ChamberValves(),
            molecularPump=False,
            roughingPump=False,
            hasCart=False,
            cartId=None,
        )
        new_line = LineData(id=new_id, name=name, anodeChambers=[default_anode], cathodeChambers=[default_cathode])
        self.state.lines.append(new_line)
        self._add_log(LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='system',
            content=f"创建新线体: {name} ({new_id})",
            level='success'
        ), 'system')
        return new_line

    def update_line(self, line_id: str, name: str, anode_chambers: list = None, cathode_chambers: list = None):
        line = next((l for l in self.state.lines if l.id == line_id), None)
        if not line:
            raise ValueError("Line not found")
        
        line.name = name
        
        from app.models import Chamber  # Local import
        
        def parse_chambers(chambers_data):
            if chambers_data is None:
                return None
            result = []
            for c_data in chambers_data:
                if isinstance(c_data, dict):
                    c_obj = Chamber.model_validate(c_data)
                    result.append(c_obj)
                else:
                    result.append(c_data)
            return result
        
        if anode_chambers is not None:
            parsed = parse_chambers(anode_chambers)
            if len(parsed) < 1:
                raise ValueError("阳极线至少需要保留1个腔体")
            line.anodeChambers = parsed
        
        if cathode_chambers is not None:
            parsed = parse_chambers(cathode_chambers)
            if len(parsed) < 1:
                raise ValueError("阴极线至少需要保留1个腔体")
            line.cathodeChambers = parsed
             
        self._add_log(LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='system',
            content=f"管理员更新 {name} 配置",
            level='success'
        ), 'system')
        return line

    def delete_line(self, line_id: str):
        # 保护：至少保留一条线体
        if len(self.state.lines) <= 1:
            raise ValueError("无法删除最后一条线体")
        
        line = next((l for l in self.state.lines if l.id == line_id), None)
        if not line:
            raise ValueError("Line not found")
        self.state.lines = [l for l in self.state.lines if l.id != line_id]
        # Also remove carts in this line? For now, keep them or mark abnormal? 
        # Ideally remove carts or reset them.
        self._add_log(LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='system',
            content=f"删除线体: {line.name}",
            level='warn'
        ), 'system')
        return True

    def duplicate_line(self, line_id: str):
        source_line = next((l for l in self.state.lines if l.id == line_id), None)
        if not source_line:
            raise ValueError("Line not found")
        
        # Determine new ID and Name suffix logic
        # Simple logic: append copy timestamp or look for pattern
        suffix = uuid.uuid4().hex[:4]
        new_line_id = f"{source_line.id}-copy-{suffix}"
        new_line_name = f"{source_line.name} (Copy)"
        
        # Deep copy chambers
        new_anode_chambers = []
        if source_line.anodeChambers:
            for c in source_line.anodeChambers:
                parts = c.id.split('-')
                base_suffix = parts[-1] if len(parts) > 1 else 'chamber'
                new_c_id = f"{new_line_id}-a-{base_suffix}-{uuid.uuid4().hex[:4]}"
                new_chamber = c.model_copy(deep=True)
                new_chamber.id = new_c_id
                new_chamber.lineId = new_line_id
                new_chamber.cartIds = []
                new_anode_chambers.append(new_chamber)

        new_cathode_chambers = []
        if source_line.cathodeChambers:
            for c in source_line.cathodeChambers:
                parts = c.id.split('-')
                base_suffix = parts[-1] if len(parts) > 1 else 'chamber'
                new_c_id = f"{new_line_id}-c-{base_suffix}-{uuid.uuid4().hex[:4]}"
                new_chamber = c.model_copy(deep=True)
                new_chamber.id = new_c_id
                new_chamber.lineId = new_line_id
                new_chamber.cartIds = []
                new_cathode_chambers.append(new_chamber)
            
        new_line = LineData(id=new_line_id, name=new_line_name, anodeChambers=new_anode_chambers, cathodeChambers=new_cathode_chambers)
        self.state.lines.append(new_line)
        
        self._add_log(LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='system',
            content=f"复制线体 {source_line.name} -> {new_line_name}",
            level='success'
        ), 'system')
        return new_line

    def toggle_valve(self, line_id: str, chamber_id: str, valve_name: str, action: str, operator_name: str = "Admin", operator_role: str = "admin"):
        line, chamber, chamber_type_key = self._find_chamber(chamber_id)
        if not chamber:
            raise ValueError('Chamber not found')
        
        target = 'open' if action == 'open' else 'closed'
        line_idx = next((i + 1 for i, l in enumerate(self.state.lines) if l.id == line_id), "?")
        
        # Translate role
        role_map = {"admin": "管理员", "operator": "操作员", "observer": "观察员"}
        role_zh = role_map.get(operator_role, "员工")
        
        # Translate polarity
        polarity_zh = "阳极" if chamber_type_key == 'anode' else "阴极"
        
        # Translate valve name
        v_map = {"gate_valve": "插板阀", "transfer_valve": "传输阀", "roughing_valve": "粗抽阀", "foreline_valve": "前级阀", "vent_valve": "放气阀"}
        v_zh = v_map.get(valve_name, valve_name)
        
        # Specific logic for transfer valve to show "Chamber A and Chamber B"
        location_desc = f"{polarity_zh}{chamber.name}"
        if valve_name == 'transfer_valve':
            # Try to find the next chamber in the sequence
            chambers = line.anodeChambers if chamber_type_key == 'anode' else line.cathodeChambers
            idx = next((i for i, ch in enumerate(chambers) if ch.id == chamber_id), -1)
            if idx != -1 and idx + 1 < len(chambers):
                next_chamber = chambers[idx+1]
                location_desc = f"{polarity_zh}{chamber.name}和{next_chamber.name}"
            elif idx != -1 and idx - 1 >= 0:
                prev_chamber = chambers[idx-1]
                location_desc = f"{polarity_zh}{prev_chamber.name}和{chamber.name}"

        # Simulate delay 0.5-1s
        delay = 0.5 + (uuid.uuid4().int % 500) / 1000.0
        time.sleep(delay)
        setattr(chamber.valves, valve_name, target)
        
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='operation',
            content=f"{role_zh}{operator_name}{'打开' if target == 'open' else '关闭'}了{line_idx}#{location_desc}的{v_zh}",
            level='success',
        )
        self._add_log(log, 'operation')
        return self.state

    def toggle_pump(self, line_id: str, chamber_id: str, pump_name: str, action: str, operator_name: str = "Admin", operator_role: str = "admin"):
        line, chamber, chamber_type_key = self._find_chamber(chamber_id)
        if not chamber:
            raise ValueError('Chamber not found')
            
        target_state = True if action == 'on' else False
        line_idx = next((i + 1 for i, l in enumerate(self.state.lines) if l.id == line_id), "?")
        
        # Translate role
        role_map = {"admin": "管理员", "operator": "操作员", "observer": "观察员"}
        role_zh = role_map.get(operator_role, "员工")
        
        # Translate polarity
        polarity_zh = "阳极" if chamber_type_key == 'anode' else "阴极"
        
        # Simulate delay 0.5-1s
        delay = 0.5 + (uuid.uuid4().int % 500) / 1000.0
        time.sleep(delay)
        
        display_name = pump_name
        if pump_name == 'molecular':
            chamber.molecularPump = target_state
            display_name = "分子泵"
        elif pump_name == 'roughing':
            chamber.roughingPump = target_state
            display_name = "粗抽泵"
        else:
            raise ValueError(f"Unknown pump name: {pump_name}")
            
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='operation',
            content=f"{role_zh}{operator_name}{'启动' if target_state else '停止'}了{line_idx}#{polarity_zh}{chamber.name}的{display_name}",
            level='success',
        )
        self._add_log(log, 'operation')
        return self.state

    def move_cart(self, cart_id: str, direction: str, operator_name: str = "Admin", operator_role: str = "admin"):
        cart = next((c for c in self.state.carts if c.id == cart_id), None)
        if not cart:
            raise ValueError('Cart not found')
            
        # Find current chamber and line
        current_line, current_chamber, chamber_type = self._find_chamber(cart.locationChamberId)
        if not current_line or not current_chamber:
             raise ValueError('Current chamber not found')
        
        line_idx = next((i + 1 for i, l in enumerate(self.state.lines) if l.id == current_line.id), "?")
        role_map = {"admin": "管理员", "operator": "操作员", "observer": "观察员"}
        role_zh = role_map.get(operator_role, "员工")
             
        chambers = current_line.anodeChambers if chamber_type == 'anode' else current_line.cathodeChambers
        idx = next((i for i, ch in enumerate(chambers) if ch.id == cart.locationChamberId), -1)
        
        next_idx = idx + 1 if direction == 'forward' else idx - 1
        if next_idx < 0 or next_idx >= len(chambers):
            raise ValueError('Reached line end')
            
        # Check transfer valve
        if direction == 'forward':
            valve_open = chambers[idx].valves.transfer_valve == 'open'
            valve_owner = chambers[idx].name
        else:
            valve_open = chambers[next_idx].valves.transfer_valve == 'open'
            valve_owner = chambers[next_idx].name
            
        if not valve_open:
            raise ValueError(f'通道未打开 ({valve_owner} 传输阀未开启)')
            
        # Check occupancy
        target_chamber = chambers[next_idx]
        if any(c.locationChamberId == target_chamber.id for c in self.state.carts):
            raise ValueError(f'目标腔体 ({target_chamber.name}) 已有车辆')
            
        # Move cart
        cart.locationChamberId = target_chamber.id
        
        # 更新工艺步骤与时间
        import datetime
        now = datetime.datetime.now()
        
        # 根据目标腔体类型映射到工艺名称
        type_to_process = {
            'load_lock': '进样', 'bake': '烘烤工艺', 'cleaning': '清刷工艺', 'docking': '对接工艺', 'sealing': '铟封工艺', 'growth': '生长工艺', 'unload': '出样',
        }
        target_process_name = type_to_process.get(target_chamber.type, '未知工序')
        
        if cart.steps and target_process_name:
            # 1. 结束当前正在进行的步骤
            for step in cart.steps:
                if step.status == 'active':
                    step.status = 'completed'
                    step.endTime = now.isoformat()
                    if step.startTime:
                        start = datetime.datetime.fromisoformat(step.startTime)
                        duration_seconds = (now - start).total_seconds()
                        hours = int(duration_seconds // 3600)
                        minutes = int((duration_seconds % 3600) // 60)
                        step.duration = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
            # 2. 激活新步骤
            for step in cart.steps:
                if target_process_name in step.name or step.name in target_process_name:
                    step.status = 'active'
                    step.startTime = now.isoformat()
                    step.endTime = None
                    step.duration = None
                    cart.currentTask = step.name
                    current_idx = cart.steps.index(step)
                    if current_idx + 1 < len(cart.steps):
                        cart.nextTask = f"待{cart.steps[current_idx+1].name}"
                    else:
                        cart.nextTask = "已完成"
                    break
        
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='operation',
            content=f"{role_zh}{operator_name}将小车{cart.number}{'前进' if direction == 'forward' else '后退'}至{line_idx}#{'阳极' if chamber_type == 'anode' else '阴极'}{target_chamber.name}",
            level='success',
        )
        self._add_log(log, 'operation')
        return self.state

    def create_cart(self, line_id: str, chamber_id: str, mes_data: dict, operator_name: str = "Admin", operator_role: str = "admin"):
        """
        创建新小车（进样）
        :param line_id: 线体 ID
        :param chamber_id: 进样仓 ID
        :param mes_data: MES 数据（包含 recipeId）
        :return: 新创建的小车对象
        """
        # 查找目标腔体和线体
        line, chamber, chamber_type = self._find_chamber(chamber_id)
        if not line or not chamber:
            raise ValueError('Chamber not found')
        
        # 检查腔体是否已有小车
        if any(c.locationChamberId == chamber_id for c in self.state.carts):
            raise ValueError('进样仓已有小车，无法进样')
        
        # 获取或者使用默认配方
        from app.services.recipe_service import get_recipe_service
        recipe_service = get_recipe_service()
        
        recipe_id = mes_data.get('recipeId')
        recipe = None
        if recipe_id:
            recipe = recipe_service.get_recipe(recipe_id)
        
        if not recipe:
            # 尝试获取该类型的默认配方
            recipe = recipe_service.get_default_recipe(chamber_type)
            
        if not recipe:
            # 最后的降级方案（理论上不应发生，因为已初始化默认值）
            raise ValueError("无法找到适用的工艺配方")

        # 生成小车编号
        prefix = 'A' if chamber_type == 'anode' else 'C'
        existing_numbers = [
            int(c.number.split('-')[1]) 
            for c in self.state.carts 
            if c.number.startswith(f"{prefix}-") and len(c.number.split('-')) > 1 and c.number.split('-')[1].isdigit()
        ]
        next_number = max(existing_numbers, default=0) + 1
        cart_number = f"{prefix}-{next_number:03d}"
        
        # 定义工艺流程 (基于配方)
        steps = []
        import datetime
        from app.models import ProcessStep
        now = datetime.datetime.now()
        
        # 辅助函数：格式化时间
        def fmt_dur(hours: float):
            h = int(hours)
            m = int((hours - h) * 60)
            return f"{h}h {m}m" if h > 0 else f"{m}m"

        if chamber_type == 'anode':
            # 阳极标准流程
            bake_dur_str = fmt_dur(recipe.bakeDuration)
            
            steps = [
                ProcessStep(id='s1', name='进样', status='completed', startTime=(now - datetime.timedelta(minutes=5)).isoformat(), endTime=now.isoformat(), duration='5m', estimatedDuration='5m'),
                ProcessStep(id='s2', name='烘烤工艺', status='active', startTime=now.isoformat(), estimatedDuration=bake_dur_str),
                ProcessStep(id='s3', name='清刷工艺', status='pending', estimatedDuration='4h'),
                ProcessStep(id='s4', name='对接工艺', status='pending', estimatedDuration='2h'),
                ProcessStep(id='s5', name='铟封工艺', status='pending', estimatedDuration='3h'),
                ProcessStep(id='s6', name='出样', status='pending', estimatedDuration='10m')
            ]
            current_task = "烘烤工艺"
            next_task = "待清刷"
            
            # 估算总时间 (简单累加，实际可更精确)
            # 5m + bake + 4h + 2h + 3h + 10m
            total_hours = 0.08 + recipe.bakeDuration + 4 + 2 + 3 + 0.16
            
            # 初始 MES 参数 (阳极) - 从配方读取
            mes_params = {
                "eGunVoltage": 0.0, # 初始0，清刷时才用
                "eGunCurrent": 0.0,
                "indiumTemp": 25.0, # 初始常温
                "sealPressure": 0.0,
                "temperature": 25.0,
                "vacuum": 1e-5,
                "targetTemp": recipe.bakeTargetTemp,
                "targetVacuum": 1e-6,
                "batchNo": mes_data.get('batchNo', f"ANO-{now.strftime('%y%m%d')}-{next_number:03d}"),
                "recipeVer": f"{recipe.name} ({recipe.version})",
                "loadTime": now.isoformat()
            }
        else:
            # 阴极标准流程
            bake_dur_str = fmt_dur(recipe.bakeDuration)
            growth_dur_str = fmt_dur(recipe.growthDuration)
            
            steps = [
                ProcessStep(id='s1', name='进样', status='completed', startTime=(now - datetime.timedelta(minutes=5)).isoformat(), endTime=now.isoformat(), duration='5m', estimatedDuration='5m'),
                ProcessStep(id='s2', name='烘烤工艺', status='active', startTime=now.isoformat(), estimatedDuration=bake_dur_str),
                ProcessStep(id='s3', name='生长工艺', status='pending', estimatedDuration=growth_dur_str),
                ProcessStep(id='s4', name='出样', status='pending', estimatedDuration='10m')
            ]
            current_task = "烘烤工艺"
            next_task = "待生长"
            
            # 5m + bake + growth + 10m
            total_hours = 0.08 + recipe.bakeDuration + recipe.growthDuration + 0.16
            
            # 初始 MES 参数 (阴极)
            mes_params = {
                "csCurrent": 0.0,
                "o2Pressure": 1e-7,
                "photoCurrent": 0.0,
                "growthProgress": 0.0,
                "temperature": 25.0,
                "vacuum": 1e-7,
                "targetTemp": recipe.bakeTargetTemp,
                "targetVacuum": 1e-8,
                "batchNo": mes_data.get('batchNo', f"CAT-{now.strftime('%y%m%d')}-{next_number:03d}"),
                "recipeVer": f"{recipe.name} ({recipe.version})",
                "loadTime": now.isoformat()
            }

        total_time_str = fmt_dur(total_hours)
        
        new_cart = Cart(
            id=f"cart-{uuid.uuid4().hex[:8]}",
            number=cart_number,
            status='normal',
            locationChamberId=chamber_id,
            content=mes_data.get('materialCode', '未指定物料'),
            recipeId=recipe.id,
            currentTask=current_task,
            nextTask=next_task,
            progress=0.0,
            totalTime=total_time_str,
            remainingTime=total_time_str, # 初始近似
            steps=steps,
            **mes_params
        )
        
        # 添加到系统状态
        self.state.carts.append(new_cart)
        
        # 获取线体编号
        line_index = next((i + 1 for i, l in enumerate(self.state.lines) if l.id == line_id), "?")
        
        # Translate role
        role_map = {"admin": "管理员", "operator": "操作员", "observer": "观察员"}
        role_zh = role_map.get(operator_role, "员工")
        
        # 记录操作日志
        cart_type_name = "阳极" if chamber_type == 'anode' else "阴极"
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='operation',
            content=f"{role_zh}{operator_name}在{line_index}#{cart_type_name}{chamber.name}完成了进样(小车{cart_number})",
            level='success',
        )
        self._add_log(log, 'operation')
        
        return new_cart

    def delete_cart(self, cart_id: str, operator_name: str = "Admin", operator_role: str = "admin"):
        """
        删除小车（出样）
        :param cart_id: 小车 ID
        :return: 删除结果
        """
        # 查找小车
        cart = next((c for c in self.state.carts if c.id == cart_id), None)
        if not cart:
            raise ValueError('Cart not found')
        
        # 查找小车所在的腔体和线体
        line, chamber, chamber_type = self._find_chamber(cart.locationChamberId)
        if not line:
            raise ValueError('Cart location not found')
        
        # 获取线体编号
        line_index = next((i + 1 for i, l in enumerate(self.state.lines) if l.id == line.id), "?")
        
        # Translate role
        role_map = {"admin": "管理员", "operator": "操作员", "observer": "观察员"}
        role_zh = role_map.get(operator_role, "员工")
        
        # 从系统中移除小车
        self.state.carts = [c for c in self.state.carts if c.id != cart_id]
        
        # 记录操作日志：格式 "x#出样阴极/阳极1辆"
        cart_type_name = "阳极" if chamber_type == 'anode' else "阴极"
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=time.time() * 1000,
            type='operation',
            content=f"{role_zh}{operator_name}在{line_index}#{cart_type_name}{chamber.name}完成了出样(小车{cart.number})",
            level='success',
        )
        self._add_log(log, 'operation')
        
        return True
