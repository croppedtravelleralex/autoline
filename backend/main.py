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

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
