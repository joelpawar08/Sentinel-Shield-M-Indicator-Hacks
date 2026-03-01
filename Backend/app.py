import logging
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from Evcauation_tips.tips import router as tips_router
from AsyncCallalerts.call import start_alert_calls


# ==========================
# Logging Configuration
# ==========================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

logger = logging.getLogger("sentinel-shield-backend")


# ==========================
# FastAPI App
# ==========================

app = FastAPI(
    title="Sentinel Shield API",
    description="Disaster detection, evacuation AI, and alerting system",
    version="1.0.0"
)


# ==========================
# CORS POLICY
# ==========================

origins = [
    "http://localhost:3000",     # React
    "http://localhost:5173",     # Vite
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept"
    ],
)


# ==========================
# Global State
# ==========================

danger_zone = False


# ==========================
# ROOT HEALTH CHECK
# ==========================

@app.get("/")
def health_check():

    logger.info("Health check endpoint accessed")

    return {
        "status": "running",
        "service": "Sentinel Shield Backend"
    }


# ==========================
# DANGER TRIGGER API
# ==========================

@app.post("/danger")
async def danger_trigger(background_tasks: BackgroundTasks):

    global danger_zone

    if not danger_zone:

        logger.warning("Danger zone triggered")

        danger_zone = True

        # Start alert system in background
        background_tasks.add_task(start_alert_calls)

        return {
            "alert": "danger zone activated",
            "call_system": "started"
        }

    logger.info("Danger already active")

    return {
        "alert": "danger already active"
    }


# ==========================
# DANGER STATUS
# ==========================

@app.get("/danger-status")
def get_status():

    logger.info("Danger status checked")

    return {
        "danger_zone": danger_zone
    }


# ==========================
# RESET DANGER STATE
# ==========================

@app.post("/reset-danger")
def reset_danger():

    global danger_zone

    danger_zone = False

    logger.info("Danger zone reset")

    return {
        "status": "danger reset"
    }


# ==========================
# REGISTER AI EVACUATION ROUTES
# ==========================

app.include_router(
    tips_router,
    prefix="/ai",
    tags=["AI Evacuation Assistant"]
)