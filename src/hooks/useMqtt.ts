import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '@/config/mqtt.config';

interface MqttState {
  connected: boolean;
  posterUrl: string | null;
  error: string | null;
}

export function useMqtt() {
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
        client.subscribe(MQTT_CONFIG.topic, { qos: 1 }, (err) => {
          if (err) {
            console.error('Subscribe error:', err);
            setState(prev => ({ ...prev, error: `Subscribe error: ${err.message}` }));
          } else {
            console.log(`Subscribed to ${MQTT_CONFIG.topic}`);
          }
        });
      });

      client.on('message', (topic, message) => {
        if (topic === MQTT_CONFIG.topic) {
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
