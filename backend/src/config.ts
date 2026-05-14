const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: toNumber(process.env.PORT, 3000),
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL ?? 'mqtt://mqtt-broker:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: toNumber(process.env.MQTT_RECONNECT_PERIOD, 5000),
    connectTimeout: toNumber(process.env.MQTT_CONNECT_TIMEOUT, 10000),
  },
  topics: {
    poster: process.env.TOPIC_POSTER ?? 'posterboy2/poster',
    progress: process.env.TOPIC_PROGRESS ?? 'posterboy2/progress',
    details: process.env.TOPIC_DETAILS ?? 'posterboy2/details',
    weather: process.env.TOPIC_WEATHER ?? 'posterboy2/weather',
    temperature: process.env.TOPIC_TEMPERATURE ?? 'posterboy2/temperature',
    kodiTitle: process.env.TOPIC_KODI_TITLE ?? 'kodi/kino/status/title',
    kodiProgress: process.env.TOPIC_KODI_PROGRESS ?? 'kodi/kino/status/progress',
    kodiPlaybackState: process.env.TOPIC_KODI_PLAYBACK_STATE ?? 'kodi/kino/status/playbackstate',
  },
};

export type TopicsConfig = typeof config.topics;
export type MqttConfig = typeof config.mqtt;
