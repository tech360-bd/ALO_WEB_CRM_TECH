// ─── ALO Education — Realtime WebSocket Service ─────────────
// Standalone Bun WebSocket server on port 3005
// Channel-based rooms: student:{id}, counselor:{id}, global, entity:{type}:{id}
// Auth: query params ?userId=xxx&token=xxx validated via /api/auth/me

const HEARTBEAT_INTERVAL = 30_000; // 30s
const HEARTBEAT_TIMEOUT = 90_000;  // 90s no heartbeat → disconnect

// ─── Types ──────────────────────────────────────────────────

interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'event';
  channel: string;
  data?: unknown;
}

interface BroadcastMessage {
  type: 'event' | 'subscribed' | 'unsubscribed' | 'error' | 'heartbeat_ack' | 'welcome';
  channel: string;
  data?: unknown;
  from?: string;
  timestamp: string;
}

interface Client {
  ws: WebSocket;
  userId: string;
  lastHeartbeat: number;
  channels: Set<string>;
}

// ─── State ──────────────────────────────────────────────────

const rooms = new Map<string, Set<Client>>();
const clients = new Map<WebSocket, Client>();

function joinRoom(channel: string, client: Client) {
  if (!rooms.has(channel)) {
    rooms.set(channel, new Set());
  }
  rooms.get(channel)!.add(client);
  client.channels.add(channel);
}

function leaveRoom(channel: string, client: Client) {
  const room = rooms.get(channel);
  if (room) {
    room.delete(client);
    if (room.size === 0) {
      rooms.delete(channel);
    }
  }
  client.channels.delete(channel);
}

function broadcastToRoom(channel: string, message: BroadcastMessage, excludeWs?: WebSocket) {
  const room = rooms.get(channel);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function send(client: Client, message: BroadcastMessage) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function removeClient(ws: WebSocket) {
  const client = clients.get(ws);
  if (client) {
    for (const channel of client.channels) {
      leaveRoom(channel, client);
    }
    clients.delete(ws);
  }
}

// ─── Auth Validation ────────────────────────────────────────

async function validateUser(userId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/auth/me?XTransformPort=3000`,
      {
        headers: {
          Cookie: `next-auth.session-token=${token}`,
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true && data?.user?.id === userId;
  } catch {
    return false;
  }
}

// ─── Heartbeat Cleanup ──────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [ws, client] of clients) {
    if (now - client.lastHeartbeat > HEARTBEAT_TIMEOUT) {
      try {
        ws.close(4008, 'Heartbeat timeout');
      } catch {
        // ignore
      }
      removeClient(ws);
    }
  }
}, 10_000); // Check every 10s

// ─── Server ─────────────────────────────────────────────────

Bun.serve({
  port: 3005,
  fetch(req, server) {
    const url = new URL(req.url);

    // Upgrade to WebSocket
    if (url.pathname === '/') {
      const userId = url.searchParams.get('userId');
      const token = url.searchParams.get('token');

      if (!userId || !token) {
        return new Response('Missing userId or token query params', { status: 401 });
      }

      // Validate auth asynchronously — accept upgrade first, close later if invalid
      const upgraded = server.upgrade(req, { data: { userId, token } });
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 500 });
      }
      return; // Bun handles the upgrade
    }

    return new Response('ALO Realtime Service — WebSocket endpoint at /', { status: 404 });
  },

  websocket: {
    async open(ws: WebSocket) {
      const { userId, token } = ws.data as { userId: string; token: string };

      // Validate user
      const valid = await validateUser(userId, token);
      if (!valid) {
        ws.close(4001, 'Authentication failed');
        return;
      }

      const client: Client = {
        ws,
        userId,
        lastHeartbeat: Date.now(),
        channels: new Set(),
      };
      clients.set(ws, client);

      // Auto-join user channel
      joinRoom(`student:${userId}`, client);

      send(client, {
        type: 'welcome',
        channel: 'system',
        data: { userId, message: 'Connected to ALO Realtime' },
        timestamp: new Date().toISOString(),
      });

      console.log(`[realtime] Client connected: ${userId} (total: ${clients.size})`);
    },

    message(ws: WebSocket, message: string | Buffer) {
      const client = clients.get(ws);
      if (!client) return;

      try {
        const msg: ClientMessage = JSON.parse(message.toString());
        const now = new Date().toISOString();

        switch (msg.type) {
          case 'subscribe': {
            if (!msg.channel) {
              send(client, { type: 'error', channel: '', data: 'Missing channel', timestamp: now });
              return;
            }
            joinRoom(msg.channel, client);
            send(client, {
              type: 'subscribed',
              channel: msg.channel,
              data: { channel: msg.channel, subscribers: rooms.get(msg.channel)?.size ?? 0 },
              timestamp: now,
            });
            break;
          }

          case 'unsubscribe': {
            if (!msg.channel) return;
            leaveRoom(msg.channel, client);
            send(client, {
              type: 'unsubscribed',
              channel: msg.channel,
              timestamp: now,
            });
            break;
          }

          case 'event': {
            if (!msg.channel) {
              send(client, { type: 'error', channel: '', data: 'Missing channel', timestamp: now });
              return;
            }
            broadcastToRoom(msg.channel, {
              type: 'event',
              channel: msg.channel,
              data: msg.data,
              from: client.userId,
              timestamp: now,
            }, ws);
            break;
          }

          default: {
            send(client, { type: 'error', channel: '', data: `Unknown message type: ${msg.type}`, timestamp: now });
          }
        }
      } catch {
        send(client, {
          type: 'error',
          channel: '',
          data: 'Invalid JSON',
          timestamp: new Date().toISOString(),
        });
      }
    },

    close(ws: WebSocket) {
      const client = clients.get(ws);
      if (client) {
        console.log(`[realtime] Client disconnected: ${client.userId} (remaining: ${clients.size - 1})`);
      }
      removeClient(ws);
    },

    drain(ws: WebSocket) {
      // Backpressure handled
    },
  },
});

console.log('[realtime] ALO Realtime Service running on ws://localhost:3005');
