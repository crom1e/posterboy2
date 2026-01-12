import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '@/config/mqtt.config';

export interface MediaDetails {
  aspect: string;
  resolution: string;
  audio: string;
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

// Decode URL if it's URL-encoded
function decodeUrlIfNeeded(url: string): string {
  try {
    // Check if URL appears to be encoded (contains %xx patterns)
    if (/%[0-9A-Fa-f]{2}/.test(url)) {
      return decodeURIComponent(url);
    }
    return url;
  } catch {
    return url;
  }
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
        
        // Subscribe to all topics
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
            const details = JSON.parse(payload) as MediaDetails;
            setState(prev => ({ ...prev, details }));
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
