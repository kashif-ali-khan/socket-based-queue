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
  const [connectedCustomerId, setConnectedCustomerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (joined) {
      socket.emit('agent-dashboard', { languages: selectedLanguages });
    }

    const handleDashboardUpdate = (data) => setQueue(data);
    const handleCallConnected = ({ customerId }) => {
      setConnectedCustomerId(customerId);
      setMessages([]); // Clear chat on new call
    };
    const handleCallEnded = () => {
      setConnectedCustomerId(null);
    };

    socket.on('dashboard-update', handleDashboardUpdate);
    socket.on('call-connected', handleCallConnected);
    socket.on('call-ended', handleCallEnded);
    socket.on('agent-message', ({ customerId, message }) => {
      setMessages((prev) => [...prev, { from: 'customer', text: message }]);
    });

    // Cleanup: remove listeners only, not disconnect
    return () => {
      socket.off('dashboard-update', handleDashboardUpdate);
      socket.off('call-connected', handleCallConnected);
      socket.off('call-ended', handleCallEnded);
      socket.off('agent-message');
    };
  }, [selectedLanguages, joined]);

  // Disconnect socket only when component unmounts
  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleConnect = (customerId) => {
    socket.emit('connect-customer', { customerId });
  };

  const handleEndCall = () => {
    socket.emit('end-call', { customerId: connectedCustomerId });
  };

  const sendMessage = () => {
    if (chatInput.trim() && connectedCustomerId) {
      socket.emit('agent-message', { customerId: connectedCustomerId, message: chatInput });
      setMessages((prev) => [...prev, { from: 'me', text: chatInput }]);
      setChatInput('');
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
                <th className="px-4 py-2 border-b text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(({ name, customerId, language, position, estWait }, idx) => (
                <tr key={customerId} className="hover:bg-blue-50">
                  <td className="px-4 py-2 border-b">{position}</td>
                  <td className="px-4 py-2 border-b">{name}</td>
                  <td className="px-4 py-2 border-b">{customerId}</td>
                  <td className="px-4 py-2 border-b">{language}</td>
                  <td className="px-4 py-2 border-b">{Math.floor(estWait / 60)}m {estWait % 60}s</td>
                  <td className="px-4 py-2 border-b">
                    {connectedCustomerId === customerId ? (
                      <button
                        className="bg-red-600 text-white rounded px-4 py-2 font-semibold hover:bg-red-700"
                        onClick={handleEndCall}
                      >
                        End Call
                      </button>
                    ) : idx === 0 && !connectedCustomerId ? (
                      <button
                        className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700"
                        onClick={() => handleConnect(customerId)}
                      >
                        Connect
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {connectedCustomerId && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Chat with Customer</h3>
          <button
            className="bg-red-600 text-white rounded px-4 py-2 font-semibold hover:bg-red-700 mb-4"
            onClick={handleEndCall}
          >
            End Call
          </button>
          <div className="h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50 mb-2">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center">No messages yet</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={msg.from === 'me' ? 'text-right' : 'text-left'}>
                  <span className={msg.from === 'me' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                        style={{ display: 'inline-block', borderRadius: 8, padding: '4px 10px', margin: '2px 0' }}>
                    {msg.from === 'me' ? 'You: ' : 'Customer: '}{msg.text}
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
              disabled={!connectedCustomerId}
            />
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
              onClick={sendMessage}
              disabled={!chatInput.trim() || !connectedCustomerId}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

