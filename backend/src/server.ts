import express, { Request, Response } from 'express';
import { config } from './config.js';
import { KioskStateStore } from './state.js';
import { MqttIngestClient } from './mqttIngest.js';

const app = express();
const store = new KioskStateStore();
let sseEventId = 0;

const mqtt = new MqttIngestClient(config.mqtt, config.topics, {
  onConnect: () => {
    store.setConnectionStatus(true, null);
  },
  onDisconnect: () => {
    store.setConnectionStatus(false, 'MQTT disconnected');
  },
  onMessage: (message) => {
    store.apply(message, config.topics);
  },
  onError: (error) => {
    store.setConnectionStatus(false, error.message);
  },
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    mqtt: {
      brokerUrl: config.mqtt.brokerUrl,
      connected: mqtt.isConnected(),
    },
  });
});

app.get('/kiosk/state', (_req: Request, res: Response) => {
  res.json(store.snapshot());
});

app.get('/kiosk/events', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const sendState = () => {
    sseEventId += 1;
    res.write(`id: ${sseEventId}\n`);
    res.write('event: state\n');
    res.write(`data: ${JSON.stringify(store.snapshot())}\n\n`);
  };

  sendState();

  const listener = () => {
    sendState();
  };

  store.on('update', listener);

  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  _req.on('close', () => {
    clearInterval(heartbeat);
    store.off('update', listener);
  });
});

const server = app.listen(config.port, async () => {
  console.log(`[backend] HTTP listening on :${config.port}`);
  
  try {
    await mqtt.connect();
    console.log('[backend] MQTT ingestion started');
  } catch (error) {
    console.error('[backend] Failed to connect to MQTT:', error);
    process.exitCode = 1;
    server.close();
  }
});

const shutdown = async () => {
  console.log('[backend] Shutting down...');
  await mqtt.disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
