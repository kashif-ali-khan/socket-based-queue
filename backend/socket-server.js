import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let queue = []; // [{ socketId, name, joinedAt, customerId }]
let agents = new Map(); // Map of socketId -> { languages: [] }

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // CUSTOMER JOINS QUEUE
  socket.on('join-queue', ({ name, customerId, language }) => {
    const joinedAt = Date.now();
    queue.push({ socketId: socket.id, name, joinedAt, customerId, language });
    console.log(`[QUEUE] Customer joined: ${name} (${customerId}), language: ${language}, socket: ${socket.id}`);
    socket.emit('queued', { position: queue.length });
  });

  // AGENT DASHBOARD JOIN or update
  socket.on('agent-dashboard', ({ languages = [] } = {}) => {
    agents.set(socket.id, { languages });
    console.log(`[AGENT] Agent ${socket.id} selected languages: ${languages.join(', ')}`);
    console.log(`[AGENT] Agent object:`, agents.get(socket.id));
    sendQueueToAgent(socket.id);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    queue = queue.filter((cust) => cust.socketId !== socket.id);
    agents.delete(socket.id);
    console.log(`[DISCONNECT] Socket disconnected: ${socket.id}`);
    // No need to send update to this agent, as they're gone
  });
});

// UPDATE TIMES TO CUSTOMERS AND AGENTS EVERY SECOND
setInterval(() => {
  const now = Date.now();
  queue.forEach((cust, index) => {
    const elapsedSec = Math.floor((now - cust.joinedAt) / 1000);
    const avgWait = 90 * index; // 90s per customer ahead
    const estWait = Math.max(0, avgWait - elapsedSec);

    io.to(cust.socketId).emit('queue-update', {
      position: index + 1,
      estWait
    });
  });
  sendQueueToAgents();
}, 1000);

function sendQueueToAgent(socketId) {
  const agent = agents.get(socketId);
  if (!agent) return;
  const { languages } = agent;
  const now = Date.now();
  // Filter the queue for this agent's languages
  const filteredQueue = queue.filter(cust => !languages.length || languages.includes(cust.language));
  // For each language, calculate position and estWait in its own language queue
  let languageQueues = {};
  for (const lang of languages) {
    languageQueues[lang] = filteredQueue.filter(cust => cust.language === lang);
  }
  // Flatten the language-specific queues, preserving order
  let formatted = [];
  for (const lang of languages) {
    const langQueue = languageQueues[lang];
    langQueue.forEach((cust, index) => {
      formatted.push({
        name: cust.name,
        customerId: cust.customerId,
        language: cust.language,
        position: index + 1,
        estWait: Math.max(0, 90 * index - Math.floor((now - cust.joinedAt) / 1000))
      });
    });
  }
  console.log(`[DASHBOARD] Sending queue to agent ${socketId}:`, formatted);
  console.log(`[DASHBOARD] Agent object:`, agent);
  io.to(socketId).emit('dashboard-update', formatted);
}

function sendQueueToAgents() {
  for (const socketId of agents.keys()) {
    sendQueueToAgent(socketId);
  }
}

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
}); 