# ew-camera-video

experiments with video from camera (web-api).

## run (dev; local; http; ws)

```shell
source ./.venv.bin.activate
pip install ./requirements.txt
fastapi dev
```

for https and wss using generate a self-signed SSL certificate
```shell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./dev.key -out ./dev.crt -subj "/C=UA/ST=-/L=-/O=-/OU=-/CN=localhost"
```

run nginx
```
docker compose up
```
