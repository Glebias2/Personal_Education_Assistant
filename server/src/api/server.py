import uvicorn


def start_server():
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1
    )
