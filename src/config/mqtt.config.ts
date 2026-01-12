// MQTT Broker Configuration
// Edit these values to match your MQTT broker setup

export const MQTT_CONFIG = {
  // WebSocket URL for your MQTT broker
  // Examples: 'ws://192.168.1.100:9001', 'wss://mqtt.example.com:8884'
  brokerUrl: 'ws://localhost:9001',

  // Authentication (set to undefined if not required)
  username: undefined as string | undefined,
  password: undefined as string | undefined,

  // MQTT Topics
  topics: {
    poster: 'posterboy2/poster',
    progress: 'posterboy2/progress',
    details: 'posterboy2/details',
    weather: 'posterboy2/weather',
    temperature: 'posterboy2/temperature',
  },
} as const;
