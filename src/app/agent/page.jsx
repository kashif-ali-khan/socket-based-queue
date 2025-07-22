// pages/agent.js
'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('ws://localhost:3001');

const LANGUAGES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'mr', label: 'Marathi' },
];

export default function Agent() {
  const [queue, setQueue] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (joined) {
      socket.emit('agent-dashboard', { languages: selectedLanguages });
    }
    socket.on('dashboard-update', (data) => {
      setQueue(data);
    });
   // return () => socket.disconnect();
  }, [selectedLanguages, joined, selectedLanguages.length]);

  const handleLanguageChange = (e) => {
    const options = Array.from(e.target.options);
    setSelectedLanguages(options.filter(o => o.selected).map(o => o.value));
  };

  const handleJoin = () => {
    if (selectedLanguages.length > 0) {
      setJoined(true);
      socket.emit('agent-dashboard', { languages: selectedLanguages });
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center">Agent Dashboard</h2>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="font-semibold">Languages:</label>
        <select
          multiple
          value={selectedLanguages}
          onChange={handleLanguageChange}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
        {!joined && (
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={handleJoin}
            disabled={selectedLanguages.length === 0}
          >
            Join
          </button>
        )}
      </div>
      {!joined ? (
        <div className="text-center text-gray-500 font-medium mt-8">Please select at least one language and click Join to view the queue.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">#</th>
                <th className="px-4 py-2 border-b text-left">Name</th>
                <th className="px-4 py-2 border-b text-left">Customer ID</th>
                <th className="px-4 py-2 border-b text-left">Language</th>
                <th className="px-4 py-2 border-b text-left">Est. Wait</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ name, customerId, language, position, estWait }) => (
                <tr key={customerId} className="hover:bg-blue-50">
                  <td className="px-4 py-2 border-b">{position}</td>
                  <td className="px-4 py-2 border-b">{name}</td>
                  <td className="px-4 py-2 border-b">{customerId}</td>
                  <td className="px-4 py-2 border-b">{language}</td>
                  <td className="px-4 py-2 border-b">{Math.floor(estWait / 60)}m {estWait % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

