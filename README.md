# Posterboy Kiosk

A full-screen, portrait-oriented (1080×1920) kiosk web application designed for unattended displays. It receives real-time data via MQTT to show movie posters, weather, temperature, and media playback information.

## Features

- **Movie/Media Poster** — Real-time poster display from Kodi
- **Weather** — Current conditions from Home Assistant
- **Indoor Temperature** — Sensor data display
- **Playback Progress** — Media progress tracking
- **Media Details** — Resolution, HDR, and audio format logos (Dolby Vision, HDR10, Dolby Atmos, DTS, etc.)
- **Local Time** — Clock display

## Tech Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui**
- **MQTT.js** (WebSocket transport)
- **Lucide React** icons

## MQTT Topics

| Topic | Purpose | Payload |
|-------|---------|---------|
| `posterboy2/poster` | Poster image URL | `string` |
| `posterboy2/progress` | Playback progress | `"0"` - `"100"` |
| `posterboy2/details` | Kodi media metadata | JSON (see below) |
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

## Configuration

Edit `src/config/mqtt.config.ts` to set your MQTT broker:

```ts
export const mqttConfig = {
  brokerUrl: 'ws://your-broker:9001',
  topics: {
    poster: 'posterboy2/poster',
    progress: 'posterboy2/progress',
    details: 'posterboy2/details',
    weather: 'posterboy2/weather',
    temperature: 'posterboy2/temperature',
  },
};
```

## Quick Start

```sh
npm install
npm run dev
```

Open in a browser sized to 1080×1920 (portrait) for the intended display experience.

## License

MIT
