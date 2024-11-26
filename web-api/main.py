import cv2
import numpy as np
from fastapi import FastAPI
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

app = FastAPI()


@app.get("/ping")
async def ping() -> str:
    return "pong"


@app.websocket("/ws")
async def video_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        try:
            while True:
                data = await websocket.receive_bytes()
                # Convert bytes to a NumPy array
                np_array = np.frombuffer(data, dtype=np.uint8)
                # Decode as an image
                frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
                # Process frame here (e.g., save, analyze, etc.)
                cv2.imshow("Video Stream", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
        finally:
            cv2.destroyAllWindows()
    except WebSocketDisconnect:
        ...
    except Exception as e:
        print(f"Error: {type(e)}")
        await websocket.close()
    else:
        await websocket.close()
