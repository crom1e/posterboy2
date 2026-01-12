import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

interface MqttConfig {
  brokerUrl: string;
  username?: string;
  password?: string;
  topic: string;
}

interface MqttState {
  connected: boolean;
  posterUrl: string | null;
  error: string | null;
}

const DEFAULT_CONFIG: MqttConfig = {
  brokerUrl: 'ws://localhost:9001', // Default Mosquitto WebSocket port
  topic: 'posterboy2/poster',
};

export function useMqtt(config: Partial<MqttConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<MqttState>({
    connected: false,
    posterUrl: null,
    error: null,
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

    if (finalConfig.username) {
      options.username = finalConfig.username;
      options.password = finalConfig.password;
    }

    try {
      const client = mqtt.connect(finalConfig.brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        console.log('MQTT connected');
        setState(prev => ({ ...prev, connected: true, error: null }));
        client.subscribe(finalConfig.topic, { qos: 1 }, (err) => {
          if (err) {
            console.error('Subscribe error:', err);
            setState(prev => ({ ...prev, error: `Subscribe error: ${err.message}` }));
          } else {
            console.log(`Subscribed to ${finalConfig.topic}`);
          }
        });
      });

      client.on('message', (topic, message) => {
        if (topic === finalConfig.topic) {
          const url = message.toString().trim();
          console.log('Received poster URL:', url);
          if (url) {
            setState(prev => ({ ...prev, posterUrl: url }));
          }
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
  }, [finalConfig.brokerUrl, finalConfig.username, finalConfig.password, finalConfig.topic]);

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
