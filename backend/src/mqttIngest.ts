import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'node:events';
import type { MqttConfig, TopicsConfig } from './config.js';
import type { TopicMessage } from './types.js';

export interface MqttClientEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: TopicMessage) => void;
  onError?: (error: Error) => void;
}

export class MqttIngestClient extends EventEmitter {
  private client: MqttClient | null = null;
  private connected = false;

  constructor(
    private config: MqttConfig,
    private topics: TopicsConfig,
    private events: MqttClientEvents = {},
  ) {
    super();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const options: mqtt.IClientOptions = {
          reconnectPeriod: this.config.reconnectPeriod,
          connectTimeout: this.config.connectTimeout,
        };

        if (this.config.username && this.config.password) {
          options.username = this.config.username;
          options.password = this.config.password;
        }

        this.client = mqtt.connect(this.config.brokerUrl, options);

        this.client.once('connect', () => {
          this.connected = true;
          console.log('[MQTT] Connected');
          this.subscribeToTopics();
          this.events.onConnect?.();
          resolve();
        });

        this.client.once('error', (error) => {
          console.error('[MQTT] Connection error:', error.message);
          this.events.onError?.(error);
          reject(error);
        });

        this.client.on('message', (topic, buffer) => {
          const payload = buffer.toString('utf8').trim();
          console.log(`[MQTT] Message on ${topic}:`, payload.slice(0, 100));
          this.events.onMessage?.({ topic, payload });
        });

        this.client.on('close', () => {
          this.connected = false;
          console.log('[MQTT] Disconnected');
          this.events.onDisconnect?.();
        });

        this.client.on('error', (error) => {
          console.error('[MQTT] Error:', error.message);
          this.events.onError?.(error);
        });

        this.client.on('reconnect', () => {
          console.log('[MQTT] Reconnecting...');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, () => {
          this.client = null;
          this.connected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private subscribeToTopics(): void {
    if (!this.client) return;

    const topicList = Object.values(this.topics);
    console.log(`[MQTT] Subscribing to ${topicList.length} topics`);

    topicList.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`[MQTT] Subscribe error for ${topic}:`, err.message);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
        }
      });
    });
  }
}
