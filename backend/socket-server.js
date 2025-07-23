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
let activeCalls = new Map(); // agentSocketId -> customerId

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // CUSTOMER JOINS QUEUE
  socket.on('join-queue', ({ name, customerId, language }) => {
    socket.customerId = customerId; // Set customerId on the socket for later reference
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

  socket.on('connect-customer', ({ customerId }) => {
    // Find the customer in the queue
    const customer = queue.find(c => c.customerId === customerId);
    if (!customer) return;
    // Remove the customer from the queue
    queue = queue.filter(c => c.customerId !== customerId);
    // Mark this call as active
    activeCalls.set(socket.id, customerId);
    // Notify agent
    socket.emit('call-connected', { customerId });
    // Notify customer
    io.to(customer.socketId).emit('call-connected', { agentId: socket.id });
    sendQueueToAgents();
  });

  socket.on('end-call', ({ customerId }) => {
    // Remove the call from activeCalls
    for (const [agentId, custId] of activeCalls.entries()) {
      if (custId === customerId) {
        activeCalls.delete(agentId);
        // Notify agent
        io.to(agentId).emit('call-ended', { customerId });
      }
    }
    // Notify customer
    const customer = queue.find(c => c.customerId === customerId);
    if (customer) {
      io.to(customer.socketId).emit('call-ended');
    } else {
      // If customer was already removed from queue, try to notify by customerId
      for (const s of io.sockets.sockets.values()) {
        if (s.customerId === customerId) {
          s.emit('call-ended');
        }
      }
    }
    sendQueueToAgents();
  });

  // Relay message from customer to agent
  socket.on('customer-message', ({ customerId, message }) => {
    // Find the agent handling this customer
    for (const [agentId, custId] of activeCalls.entries()) {
      if (custId === customerId) {
        io.to(agentId).emit('agent-message', { customerId, message });
      }
    }
  });

  // Relay message from agent to customer
  socket.on('agent-message', ({ customerId, message }) => {
    // Find the customer socket
    for (const s of io.sockets.sockets.values()) {
      if (s.customerId === customerId) {
        s.emit('customer-message', { message });
      }
    }
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
  // Build a set of all languages supported by at least one agent
  const supportedLanguages = new Set();
  for (const agent of agents.values()) {
    for (const lang of agent.languages) {
      supportedLanguages.add(lang);
    }
  }
  // Build the merged queue for all supported languages, sorted by join time
  const mergedQueue = queue
    .filter(cust => supportedLanguages.has(cust.language))
    .sort((a, b) => a.joinedAt - b.joinedAt);
  // For each customer, calculate their position and estWait in the merged queue
  queue.forEach((cust) => {
    const index = mergedQueue.findIndex(c => c.socketId === cust.socketId);
    const elapsedSec = Math.floor((now - cust.joinedAt) / 1000);
    const avgWait = 90 * index; // 90s per customer ahead in the merged queue
    const estWait = Math.max(0, avgWait - elapsedSec);
    io.to(cust.socketId).emit('queue-update', {
      position: index >= 0 ? index + 1 : undefined,
      estWait: index >= 0 ? estWait : undefined
    });
  });
  sendQueueToAgents();
}, 1000);

function sendQueueToAgent(socketId) {
  const agent = agents.get(socketId);
  if (!agent) return;
  const { languages } = agent;
  const now = Date.now();
  // Filter the queue for this agent's languages and sort by join time
  const filteredQueue = queue
    .filter(cust => !languages.length || languages.includes(cust.language))
    .sort((a, b) => a.joinedAt - b.joinedAt);
  // Assign position and estWait in the merged queue
  const formatted = filteredQueue.map((cust, index) => ({
    name: cust.name,
    customerId: cust.customerId,
    language: cust.language,
    position: index + 1,
    estWait: Math.max(0, 90 * index - Math.floor((now - cust.joinedAt) / 1000))
  }));
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