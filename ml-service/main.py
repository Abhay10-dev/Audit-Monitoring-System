from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, health
import uvicorn

app = FastAPI(
    title="AMS ML Service",
    description="Anomaly Detection Microservice for Audit Monitoring System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, prefix="/predict", tags=["Prediction"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
