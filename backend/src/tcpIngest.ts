import { createServer, Socket } from 'node:net';
import type { TopicMessage } from './types.js';

export interface TcpIngestEvents {
  onConnectionCountChange?: (count: number) => void;
  onMessage?: (message: TopicMessage) => void;
  onError?: (error: Error) => void;
}

interface TcpIngestServer {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

function parseLine(line: string): TopicMessage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as
      | { topic?: string; payload?: unknown; t?: string; p?: unknown; channel?: string; data?: unknown }
      | null;

    if (parsed && typeof parsed.topic === 'string') {
      return {
        topic: parsed.topic,
        payload: parsed.payload === undefined ? '' : String(parsed.payload),
      };
    }

    if (parsed && typeof parsed.t === 'string') {
      return {
        topic: parsed.t,
        payload: parsed.p === undefined ? '' : String(parsed.p),
      };
    }

    if (parsed && typeof parsed.channel === 'string') {
      return {
        topic: parsed.channel,
        payload: parsed.data === undefined ? '' : String(parsed.data),
      };
    }
  } catch {
    // Fall through to text protocol handling.
  }

  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace <= 0) {
    return null;
  }

  return {
    topic: trimmed.slice(0, firstSpace),
    payload: trimmed.slice(firstSpace + 1),
  };
}

export function createTcpIngestServer(host: string, port: number, events: TcpIngestEvents): TcpIngestServer {
  const clients = new Set<Socket>();

  const server = createServer((socket) => {
    clients.add(socket);
    events.onConnectionCountChange?.(clients.size);

    let buffer = '';

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const parsed = parseLine(line);
        if (parsed) {
          events.onMessage?.(parsed);
        }
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      events.onConnectionCountChange?.(clients.size);
    });

    socket.on('error', (error) => {
      clients.delete(socket);
      events.onConnectionCountChange?.(clients.size);
      events.onError?.(error);
    });
  });

  return {
    start: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve();
        });
      }),
    stop: () =>
      new Promise((resolve, reject) => {
        for (const client of clients) {
          client.destroy();
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}
