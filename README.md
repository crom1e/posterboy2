# Posterboy Kiosk

A full-screen, portrait-oriented (1080x1920) kiosk web application designed for unattended displays. The **backend service connects to MQTT**, normalizes topic events into a unified state model, and serves the frontend via REST/SSE API.

## Architecture

1. **Backend** (Node.js + TypeScript)
   - Connects to MQTT broker and subscribes to all configured topics
   - Normalizes Plex/Kodi/weather/temperature payloads into kiosk state
   - Exposes HTTP API for frontend consumption

2. **Frontend** (React + TypeScript)
   - Loads initial state snapshot from `GET /api/kiosk/state`
   - Receives live updates via `GET /api/kiosk/events` (Server-Sent Events)
   - No direct MQTT connection (all data flows through backend API)

## MQTT Broker Configuration

The backend requires an MQTT broker. Configure it via environment variables:

- `MQTT_BROKER_URL` (required; e.g., `mqtt://your-broker-host:1883` or `ws://broker-host:9001` for WebSocket)
- `MQTT_USERNAME` (optional)
- `MQTT_PASSWORD` (optional)
- `MQTT_RECONNECT_PERIOD` (default: 5000ms)
- `MQTT_CONNECT_TIMEOUT` (default: 10000ms)

**Note:** The MQTT broker is not included in `docker-compose.yml`. You must provide your own MQTT broker and set `MQTT_BROKER_URL` in the environment or directly in `docker-compose.yml`.
- Topic names (all default to original names):
  - `TOPIC_POSTER`, `TOPIC_PROGRESS`, `TOPIC_DETAILS`
  - `TOPIC_WEATHER`, `TOPIC_TEMPERATURE`
  - `TOPIC_KODI_TITLE`, `TOPIC_KODI_PROGRESS`, `TOPIC_KODI_PLAYBACK_STATE`

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```

2. Update `.env` with your MQTT broker details:
   ```
   MQTT_BROKER_URL=mqtt://your-broker-host:1883
   MQTT_USERNAME=optional-username
   MQTT_PASSWORD=optional-password
   ```

3. **Important:** Never commit `.env` to git. It contains sensitive configuration.

### Plex Topics
| Topic | Purpose | Payload |
|-------|---------|---------|
| `posterboy2/poster` | Poster image URL | `string` |
| `posterboy2/progress` | Playback progress | `"0"` - `"100"` |
| `posterboy2/details` | Plex media metadata | JSON (see below) |

### Kodi Topics
| Topic | Purpose | Payload |
|-------|---------|---------|
| `kodi/kino/status/title` | Media info, artwork, stream details | JSON (see below) |
| `kodi/kino/status/progress` | Playback progress | JSON with `val`, `kodi_time`, `kodi_totaltime` |
| `kodi/kino/status/playbackstate` | Play/pause/stop state | JSON with `kodi_state` |

### Other Topics
| Topic | Purpose | Payload |
|-------|---------|---------|
| `posterboy2/weather` | Home Assistant weather | JSON (see below) |
| `posterboy2/temperature` | Indoor temperature | `string` (e.g., `"21.5"`) |

### Payload Examples

**Details (Kodi):**
```json
{
  "video": { "width": 3840, "height": 2160, "codec": "hevc", "hdrtype": "dolbyvision" },
  "audio": { "codec": "truehd", "channels": 8 }
}
```

**Weather (Home Assistant):**
```json
{
  "state": "snowy",
  "attributes": { "temperature": -7.1, "humidity": 90, "wind_speed": 9.7 }
}
```

**Kodi Title:**
```json
{
  "val": "The Avengers",
  "kodi_details": {
    "title": "The Avengers",
    "type": "movie",
    "art": { "poster": "image://https%3a%2f%2f.../", "fanart": "..." },
    "streamdetails": {
      "video": [{ "width": 3840, "height": 2160, "codec": "hevc", "hdrtype": "hdr10", "aspect": 1.85 }],
      "audio": [{ "codec": "truehd", "channels": 8, "language": "eng" }]
    }
  }
}
```

**Kodi Progress:**
```json
{ "val": "48.6", "kodi_time": "01:09:24", "kodi_totaltime": "02:22:55" }
```

## Backend Configuration

Environment variables for backend runtime:

- `PORT` (default: `3000`)
- `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD` (see MQTT Broker Configuration section)
- `TOPIC_POSTER`, `TOPIC_PROGRESS`, `TOPIC_DETAILS`, `TOPIC_WEATHER`, `TOPIC_TEMPERATURE`
- `TOPIC_KODI_TITLE`, `TOPIC_KODI_PROGRESS`, `TOPIC_KODI_PLAYBACK_STATE`

## Quick Start

```sh
npm install
npm --prefix backend install
npm run dev:backend
npm run dev
```

Or run both at once:

```sh
npm run dev:all
```

### Backend health and API

```sh
curl http://localhost:3000/health
curl http://localhost:3000/kiosk/state
curl -N http://localhost:3000/kiosk/events
```

Open in a browser sized to 1080×1920 (portrait) for the intended display experience.

## License

MIT
