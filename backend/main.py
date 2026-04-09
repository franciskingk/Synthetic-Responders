from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.routes import auth, personas, surveys, simulation, health

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Synthetic Research Lab API",
    description="API for synthetic survey respondent generation",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Include routes
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(personas.router)
app.include_router(surveys.router)
app.include_router(simulation.router)


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    print("Synthetic Research Lab API starting...")
    print(f"  Environment: {settings.environment}")
    print(f"  Database: {settings.database_url}")
    print("  LLM Providers: Groq, OpenRouter, Local")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    print("Synthetic Research Lab API shutting down...")


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Synthetic Research Lab API",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
    )
