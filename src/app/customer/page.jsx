// pages/customer.js
'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

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
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');

  const joinQueue = () => {
    if (name && customerId && language) {
      socket.emit('join-queue', { name, customerId, language });
      setJoined(true);
    }
  };

  useEffect(() => {
    socket.on('queue-update', ({ position, estWait }) => {
      setStatus({ position, estWait });
    });

    return () => socket.disconnect();
  }, []);

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
          <input
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Customer ID"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
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
            disabled={!name || !customerId || !language}
          >
            Join Queue
          </button>
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
