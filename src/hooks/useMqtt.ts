import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '@/config/mqtt.config';

export interface MediaDetails {
  aspect: string;
  resolution: string;
  resolutionType?: string;
  hdrType?: string;
  audio: string;
  audioCodec?: string;
  audioChannels?: string;
}

export interface WeatherData {
  condition: string;
  temp: number;
}

interface MqttState {
  connected: boolean;
  error: string | null;
  posterUrl: string | null;
  progress: number | null;
  details: MediaDetails | null;
  weather: WeatherData | null;
  temperature: string | null;
}

interface KodiStreamDetails {
  video: Array<{
    aspect: number;
    width: number;
    height: number;
    hdrtype?: string;
    codec?: string;
  }>;
  audio: Array<{
    channels: number;
    codec: string;
    language?: string;
  }>;
}

interface KodiPayload {
  val: string;
  kodi_details: {
    streamdetails: KodiStreamDetails;
  };
}

// Decode URL if it's URL-encoded
function decodeUrlIfNeeded(url: string): string {
  try {
    if (/%[0-9A-Fa-f]{2}/.test(url)) {
      return decodeURIComponent(url);
    }
    return url;
  } catch {
    return url;
  }
}

function getResolutionType(width: number): string {
  if (width >= 3840) return '4k';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  return 'sd';
}

function formatResolution(width: number, height: number, hdrtype?: string): string {
  let res = '';
  if (width >= 3840) res = '4K';
  else if (width >= 1920) res = '1080p';
  else if (width >= 1280) res = '720p';
  else res = `${width}x${height}`;
  
  if (hdrtype === 'dolbyvision') return `${res} DV`;
  if (hdrtype === 'hdr10') return `${res} HDR10`;
  if (hdrtype === 'hdr10plus') return `${res} HDR10+`;
  if (hdrtype === 'hlg') return `${res} HLG`;
  
  return res;
}

function formatAudioChannels(channels: number): string {
  if (channels === 8) return '7.1';
  if (channels === 6) return '5.1';
  if (channels === 2) return '2.0';
  return `${channels}ch`;
}

function formatAudio(channels: number, codec: string): string {
  const channelStr = formatAudioChannels(channels);
  const codecStr = codec.toUpperCase();
  return `${channelStr} ${codecStr}`;
}

function formatAspect(aspect: number): string {
  return `${aspect.toFixed(2)}:1`;
}

function parseKodiDetails(payload: KodiPayload): MediaDetails {
  const video = payload.kodi_details.streamdetails.video[0];
  const audio = payload.kodi_details.streamdetails.audio[0];

  return {
    resolution: formatResolution(video.width, video.height, video.hdrtype),
    resolutionType: getResolutionType(video.width),
    hdrType: video.hdrtype?.toLowerCase(),
    audio: formatAudio(audio.channels, audio.codec),
    audioCodec: audio.codec.toLowerCase(),
    audioChannels: formatAudioChannels(audio.channels),
    aspect: formatAspect(video.aspect),
  };
}

function isKodiPayload(payload: unknown): payload is KodiPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'kodi_details' in payload &&
    typeof (payload as KodiPayload).kodi_details?.streamdetails === 'object'
  );
}

export function useMqtt() {
  const [state, setState] = useState<MqttState>({
    connected: false,
    error: null,
    posterUrl: null,
    progress: null,
    details: null,
    weather: null,
    temperature: null,
  });

  const clientRef = useRef<MqttClient | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end();
    }

    const options: mqtt.IClientOptions = {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    };

    if (MQTT_CONFIG.username) {
      options.username = MQTT_CONFIG.username;
      options.password = MQTT_CONFIG.password;
    }

    try {
      const client = mqtt.connect(MQTT_CONFIG.brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        console.log('MQTT connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        
        const topics = Object.values(MQTT_CONFIG.topics);
        topics.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`Subscribe error for ${topic}:`, err);
            } else {
              console.log(`Subscribed to ${topic}`);
            }
          });
        });
      });

      client.on('message', (topic, message) => {
        const payload = message.toString().trim();
        console.log(`Received on ${topic}:`, payload);

        const { topics } = MQTT_CONFIG;

        if (topic === topics.poster) {
          const url = decodeUrlIfNeeded(payload);
          if (url) {
            setState(prev => ({ ...prev, posterUrl: url }));
          }
        } else if (topic === topics.progress) {
          const progress = parseFloat(payload);
          if (!isNaN(progress)) {
            setState(prev => ({ ...prev, progress: Math.min(100, Math.max(0, progress)) }));
          }
        } else if (topic === topics.details) {
          try {
            const parsed = JSON.parse(payload);
            if (isKodiPayload(parsed)) {
              const details = parseKodiDetails(parsed);
              setState(prev => ({ ...prev, details }));
            } else {
              setState(prev => ({ ...prev, details: parsed as MediaDetails }));
            }
          } catch (e) {
            console.error('Failed to parse details JSON:', e);
          }
        } else if (topic === topics.weather) {
          try {
            const weather = JSON.parse(payload) as WeatherData;
            setState(prev => ({ ...prev, weather }));
          } catch (e) {
            console.error('Failed to parse weather JSON:', e);
          }
        } else if (topic === topics.temperature) {
          setState(prev => ({ ...prev, temperature: payload }));
        }
      });

      client.on('error', (err) => {
        console.error('MQTT error:', err);
        setState(prev => ({ ...prev, error: err.message }));
      });

      client.on('close', () => {
        console.log('MQTT disconnected');
        setState(prev => ({ ...prev, connected: false }));
      });

      client.on('reconnect', () => {
        console.log('MQTT reconnecting...');
      });

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Connection failed';
      setState(prev => ({ ...prev, error }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, [connect]);

  return state;
}
