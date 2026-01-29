from fastapi import APIRouter, HTTPException
from typing import Literal

from app.models import SystemState
from app.services.state_service import StateService

router = APIRouter()

# Initialize singleton service
state_service = StateService()

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "AutoLine Monitor"}

@router.post("/logs/clear")
async def clear_logs():
    """Clear all operation logs to remove legacy format entries."""
    state_service.clear_operation_logs()
    return {"message": "Operation logs cleared"}

@router.get("/state")
async def get_state() -> SystemState:
    """Return the full system state."""
    return state_service.get_state()

@router.post("/cart/{cart_id}/move")
async def move_cart(cart_id: str, direction: Literal["forward", "backward"], operator_name: str = "Admin", operator_role: str = "admin"):
    """Move a cart forward or backward, respecting transfer valve state and occupancy."""
    try:
        state_service.move_cart(cart_id, direction, operator_name, operator_role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": f"Cart {cart_id} moved {direction}"}

@router.post("/lines")
async def create_line(type: str, name: str):
    """Create a new line."""
    try:
        return state_service.create_line(type, name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from pydantic import BaseModel
from typing import List, Optional, Any

class UpdateLineRequest(BaseModel):
    name: str
    anode_chambers: Optional[List[Any]] = None
    cathode_chambers: Optional[List[Any]] = None

@router.put("/lines/{line_id}")
async def update_line(line_id: str, request: UpdateLineRequest):
    """Update line name and optionally chambers structure."""
    try:
        updated_line = state_service.update_line(
            line_id, 
            request.name, 
            request.anode_chambers, 
            request.cathode_chambers
        )
        return updated_line
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class UpdateChamberRequest(BaseModel):
    name: Optional[str] = None
    maxCartCapacity: Optional[int] = None
    targetTemperature: Optional[float] = None
    isHeating: Optional[bool] = None
    heatingMode: Optional[str] = None

@router.put("/lines/{line_id}/chambers/{chamber_id}")
async def update_chamber(line_id: str, chamber_id: str, request: UpdateChamberRequest):
    """更新腔体配置（如名称、容量、设定温度）"""
    try:
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        return state_service.update_chamber(line_id, chamber_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/lines/{line_id}")
async def delete_line(line_id: str):
    """Delete a line."""
    try:
        state_service.delete_line(line_id)
        return {"message": "Line deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/lines/{line_id}/duplicate")
async def duplicate_line(line_id: str):
    """Duplicate an existing line."""
    try:
        return state_service.duplicate_line(line_id)
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": tb})

@router.post("/valve/{line_id}/{chamber_id}/{valve_name}")
async def control_valve(
    line_id: str,
    chamber_id: str,
    valve_name: str,
    action: Literal["open", "close"],
    operator_name: str = "Admin",
    operator_role: str = "admin"
):
    """Open or close a specific valve."""
    try:
        state_service.toggle_valve(line_id, chamber_id, valve_name, action, operator_name, operator_role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Valve {valve_name} in {chamber_id} set to {action}"}

@router.post("/pump/{line_id}/{chamber_id}/{pump_name}")
async def control_pump(
    line_id: str,
    chamber_id: str,
    pump_name: str,
    action: Literal["on", "off"],
    operator_name: str = "Admin",
    operator_role: str = "admin"
):
    """Control a pump (molecular or roughing)."""
    try:
        state_service.toggle_pump(line_id, chamber_id, pump_name, action, operator_name, operator_role)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Pump {pump_name} in {chamber_id} set to {action}"}

class CreateCartRequest(BaseModel):
    lineId: str
    chamberId: str
    data: dict

@router.post("/cart")
async def create_cart(request: CreateCartRequest, operator_name: str = "Admin", operator_role: str = "admin"):
    """创建新小车（进样）"""
    try:
        new_cart = state_service.create_cart(request.lineId, request.chamberId, request.data, operator_name, operator_role)
        return new_cart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/cart/{cart_id}")
async def delete_cart(cart_id: str, operator_name: str = "Admin", operator_role: str = "admin"):
    """删除小车（出样）"""
    try:
        state_service.delete_cart(cart_id, operator_name, operator_role)
        return {"message": "Cart deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

class UpdateCartRequest(BaseModel):
    name: Optional[str] = None
    number: Optional[str] = None

@router.put("/cart/{cart_id}")
async def update_cart(cart_id: str, request: UpdateCartRequest):
    """更新小车信息（如名称或编号）"""
    try:
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        return state_service.update_cart(cart_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ==================== 历史数据API ====================

from app.services.history_service import get_history_service

@router.get("/history/snapshots/range")
async def get_snapshot_range():
    """获取历史快照的时间范围"""
    history_service = get_history_service()
    start, end = history_service.get_snapshot_range()
    return {"start": start, "end": end}

@router.get("/history/snapshots/multi_line")
@router.get("/history/snapshots/at")
async def get_snapshot_at(timestamp: float):
    """获取指定时间点的状态总揽（聚合快照）"""
    history_service = get_history_service()
    data = history_service.get_snapshot(timestamp)
    if not data:
        raise HTTPException(status_code=404, detail="No snapshot found for this time")
    
    import json
    return json.loads(data)

@router.get("/history/{entity_id}")
async def get_history(
    entity_id: str,
    metric: Literal["temperature", "vacuum"],
    start_time: float,
    end_time: float
):
    """查询历史记录"""
    history_service = get_history_service()
    data = history_service.query_data(entity_id, metric, start_time, end_time)
    return {"entity_id": entity_id, "metric": metric, "data": data}

@router.get("/history/events/all")
async def get_events(start_time: float, end_time: float):
    """获取指定时间段内的系统事件"""
    history_service = get_history_service()
    events = history_service.query_events(start_time, end_time)
    return events

# ==================== 系统设置 API ====================

from app.models import SystemSettings
from app.services.settings_service import SettingsService

@router.get("/settings")
async def get_settings() -> SystemSettings:
    """获取系统设置"""
    service = SettingsService()
    return service.get_settings()

@router.post("/settings")
async def update_settings(settings: SystemSettings) -> SystemSettings:
    """更新系统设置"""
    service = SettingsService()
    return service.update_settings(settings)

# ==================== 工艺配方 API ====================

from app.models import Recipe
from app.services.recipe_service import get_recipe_service

@router.get("/recipes")
async def get_recipes() -> List[Recipe]:
    """获取所有工艺配方"""
    service = get_recipe_service()
    return service.get_all_recipes()

@router.post("/recipes")
async def create_recipe(recipe: Recipe) -> Recipe:
    """创建新工艺配方"""
    service = get_recipe_service()
    return service.create_recipe(recipe)

@router.put("/recipes/{recipe_id}")
async def update_recipe(recipe_id: str, recipe: Recipe) -> Recipe:
    """更新工艺配方"""
    service = get_recipe_service()
    updated = service.update_recipe(recipe_id, recipe)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return updated

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    """删除工艺配方"""
    service = get_recipe_service()
    success = service.delete_recipe(recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted"}



# ==================== 仿真设置 API ====================

from app.models import SimulationConfig, FaultType
from app.services.simulation_service import SimulationService

# Helper to access the singleton simulation service instance
# Since it was initialized in state_service or just a global instance?
# In main.py or similar, it should be initialized. 
# Looking at api.py line 10: state_service = StateService()
# SimulationService usually uses StateService. Let's create a singleton accessor or instance here.
# For simplicity, we can instantiate it, but we need to ensure it's the SAME instance that is running the thread?
# Wait, SimulationService starts a thread. If I make a new instance here, is it the same?
# SimulationService seems designed to be singleton-ish or held by main app.
# Let's check main.py... oh we didn't read main.py.
# Usually in FastAPI we use dependency injection or a global var. 
# Let's assume we can use a global instance here like state_service.
# We need to make sure `state_service` in api.py leads us to the right place. 
# Actually, let's redefine SimulationService usage. 
# Ideally, we should have `simulation_service = SimulationService()` at module level if it has state.
# But `state_service` is already there. Does `state_service` hold `simulation_service`? No.
# Let's instantiate it globally here for now, assuming api.py is imported once.
simulation_service = SimulationService()

@router.on_event("startup")
async def startup_event():
    # Auto start simulation loop on startup
    simulation_service.start()

@router.get("/settings/simulation")
async def get_simulation_config() -> SimulationConfig:
    return simulation_service.get_config()

@router.post("/settings/simulation")
async def update_simulation_config(config: SimulationConfig) -> SimulationConfig:
    return simulation_service.update_config(config)

@router.post("/simulation/fault")
async def inject_fault(type: FaultType, line_id: str, chamber_id: str):
    return simulation_service.inject_fault(type, line_id, chamber_id)

@router.delete("/simulation/faults")
async def clear_faults():
    simulation_service.clear_faults()
    return {"message": "All faults cleared"}


# ==================== 用户管理 API ====================

from app.services.user_service import UserService
from app.models import User, UserRole

user_service = UserService()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    user = user_service.authenticate(request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

@router.get("/users")
async def get_users() -> List[User]:
    return user_service.get_all_users()

@router.post("/users")
async def create_user(user: User):
    try:
        return user_service.create_user(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{username}")
async def update_user(username: str, user: User):
    updated = user_service.update_user(username, user)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.delete("/users/{username}")
async def delete_user(username: str):
    try:
        success = user_service.delete_user(username)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== 数据管理 API ====================

from app.services.data_service import DataService
from fastapi.responses import PlainTextResponse

data_service = DataService()

@router.get("/data/export")
async def export_data(type: Literal['temperature', 'vacuum'], start: str, end: str):
    """
    导出历史数据 (CSV)
    Start/End format: ISO String
    """
    csv_content = data_service.export_data(type, start, end)
    # Return as downloadable file
    return PlainTextResponse(
        csv_content, 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename={type}_export.csv"}
    )

@router.post("/data/backup")
async def create_backup():
    """手动触发数据备份"""
    try:
        msg = data_service.create_backup()
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/backups")
async def list_backups():
    """获取可用备份列表"""
    return data_service.get_backups()
