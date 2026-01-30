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

# Allow CORS for frontend (支持 Zeabur 部署)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议使用具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
