// pages/customer.js
'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function generateCustomerId() {
  return 'CUST-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

const socket = io('ws://localhost:3001');

const LANGUAGES = [
  { value: '', label: 'Select Language' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'mr', label: 'Marathi' },
];

export default function Customer() {
  const [status, setStatus] = useState({});
  const [joined, setJoined] = useState(false);
  const [customerId] = useState(generateCustomerId());
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [callInProgress, setCallInProgress] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const joinQueue = () => {
    if (name && language) {
      socket.emit('join-queue', { name, customerId, language });
      setJoined(true);
    }
  };

  useEffect(() => {
    socket.on('queue-update', ({ position, estWait }) => {
      setStatus({ position, estWait });
    });
    socket.on('call-connected', () => {
      setCallInProgress(true);
      setCallEnded(false);
      setMessages([]); // Clear chat on new call
    });
    socket.on('call-ended', () => {
      setCallInProgress(false);
      setCallEnded(true);
    });
    socket.on('customer-message', ({ message }) => {
      setMessages((prev) => [...prev, { from: 'agent', text: message }]);
    });
    return () => socket.disconnect();
  }, []);

  const sendMessage = () => {
    if (chatInput.trim()) {
      socket.emit('customer-message', { customerId, message: chatInput });
      setMessages((prev) => [...prev, { from: 'me', text: chatInput }]);
      setChatInput('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center">Customer Queue</h2>
      {!joined ? (
        <div className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={joinQueue}
            disabled={!name || !language}
          >
            Join Queue
          </button>
        </div>
      ) : callEnded ? (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-red-600">Your call is ended</p>
        </div>
      ) : callInProgress ? (
        <div className="space-y-4">
          <div className="h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50 mb-2">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center">No messages yet</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={msg.from === 'me' ? 'text-right' : 'text-left'}>
                  <span className={msg.from === 'me' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                        style={{ display: 'inline-block', borderRadius: 8, padding: '4px 10px', margin: '2px 0' }}>
                    {msg.from === 'me' ? 'You: ' : 'Agent: '}{msg.text}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              disabled={!callInProgress}
            />
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
              onClick={sendMessage}
              disabled={!chatInput.trim() || !callInProgress}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium"><strong>Name:</strong> {name}</p>
          <p className="text-lg font-medium"><strong>Language:</strong> {LANGUAGES.find(l => l.value === language)?.label}</p>
          <p className="text-lg font-medium"><strong>Position:</strong> {typeof status.position === 'number' && status.position > 0 ? status.position : 'Calculating...'}</p>
          <p className="text-lg font-medium"><strong>Estimated Wait:</strong> {typeof status.estWait === 'number' && !isNaN(status.estWait) ? `${Math.floor(status.estWait / 60)}m ${status.estWait % 60}s` : 'Calculating...'}</p>
        </div>
      )}
    </div>
  );
}
