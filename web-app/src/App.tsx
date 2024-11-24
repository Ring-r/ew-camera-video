import { useEffect, useRef, useState } from "react";
import './App.css';

const WEBSOCKET_BACKEND_URL = "ws://localhost:8000/ws";

function App() {
  const [stream, setStream] = useState<MediaStream | null>();
  const [websocketUrl, setWebsocketUrl] = useState<string>(WEBSOCKET_BACKEND_URL);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [latency, setLatence] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!stream) return;

    if (!videoRef?.current) return;
    videoRef.current.srcObject = stream;
    videoRef.current.play();

  }, [stream, videoRef]);

  useEffect(() => {
    if (!isStreaming) return;

    const sendFrames = async () => {
      let prevTime = performance.now();
      while (isStreaming) {

        const currTime = performance.now();
        setLatence(currTime - prevTime);
        prevTime = currTime;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
          }
          if (canvas.height !== video.videoHeight) {
            canvas.height = video.videoHeight;
          }

          const context = canvas.getContext("2d");
          if (context) {

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, "image/jpeg");
            });

            if (blob && websocket && websocket.OPEN) {
              websocket.send(blob);
            }
          }
        }

        await new Promise((r) => setTimeout(r, 10)); // Adjust interval
      }
    };

    sendFrames();
  }, [isStreaming]);


  async function handleStart() {
    const constraints = {
      audio: false,
      video: {
        facingMode: 'environment'
      }
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(stream);

      const websocket = new WebSocket(websocketUrl);
      websocket.onopen = () => setIsStreaming(true);
      websocket.onclose = () => {
        setIsStreaming(false);
        setWebsocket(null);
      }
      setWebsocket(websocket);
    }
    catch (err) {
      console.error(`An error occurred: ${err}`);
    }
  };

  function handleStop() {
    setIsStreaming(false);

    websocket?.close();
    setWebsocket(null);

    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.readyState === 'live' && track.kind === 'video') {
          track.stop();
        }
      });
      setStream(null);
    }
  };

  const handleWebsocketUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWebsocketUrl(event.target.value);
  };

  return (
    <div>
      <input
        type="text"
        value={websocketUrl}
        onChange={handleWebsocketUrlChange}
        placeholder="Enter WebSocket URL"
        style={{ width: "300px", marginRight: "10px" }}
      />
      {!stream ?
        <button onClick={handleStart}>start</button>
        :
        <button onClick={handleStop}>stop</button>
      }
      <span>{websocket ? "+" : "-"}</span>
      {isStreaming && <span>{latency}</span>}
      <div>
        <video hidden={!stream} ref={videoRef} />
        <canvas hidden ref={canvasRef} />
      </div>
    </div>
  );
}

export default App;
