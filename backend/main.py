from fastapi import FastAPI
# Trigger reload update
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import router
from app.services.simulation_service import SimulationService

simulation_service = SimulationService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    simulation_service.start()
    yield
    # Shutdown
    simulation_service.stop()

app = FastAPI(title="AutoLine Monitor API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "AutoLine Monitor API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Allow CORS for frontend (支持 Zeabur 部署)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 支持预览域名，生产环境建议在环境变量中配置
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # 获取环境变量 PORT，默认为 8080 (Zeabur 标准端口)
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
