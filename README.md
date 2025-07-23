# Call Socket Queue

A real-time customer queue management system with language-specific support, built with Next.js, Socket.IO, and Express.

## Features

- **Customer Queue Management**: Customers can join a queue with their preferred language
- **Agent Dashboard**: Agents can view and manage customers based on their language capabilities
- **Real-time Updates**: Live position and wait time updates for customers
- **Multi-language Support**: Support for 5 regional languages (Hindi, Bengali, Tamil, Telugu, Marathi)
- **Language-specific Queues**: Separate queue management for each language
- **Responsive UI**: Modern, clean interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, Tailwind CSS
- **Backend**: Express.js, Socket.IO
- **Real-time Communication**: WebSocket connections

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd call-socket-queue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm run socket-server
   ```
   This starts the Socket.IO server on port 3001.

4. **Start the frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   This starts the Next.js development server on port 3000.

## Usage

### For Customers

1. Navigate to `http://localhost:3000/customer`
2. Enter your name and customer ID
3. Select your preferred language from the dropdown
4. Click "Join Queue"
5. View your position and estimated wait time in real-time

### For Agents

1. Navigate to `http://localhost:3000/agent`
2. Select the languages you can support (multiple selection allowed)
3. Click "Join" to start viewing the queue
4. Monitor customers in your selected languages
5. View real-time updates of customer positions and wait times

## Project Structure

```
call-socket-queue/
├── backend/
│   └── socket-server.js          # Socket.IO server with queue logic
├── src/
│   ├── app/
│   │   ├── customer/
│   │   │   └── page.jsx          # Customer queue interface
│   │   ├── agent/
│   │   │   └── page.jsx          # Agent dashboard interface
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Home page
│   │   └── globals.css           # Global styles
│   └── pages/                    # Legacy pages directory (empty)
├── package.json
└── README.md
```

## API Endpoints

### Socket.IO Events

#### Customer Events
- `join-queue`: Customer joins the queue with name, customerId, and language
- `queue-update`: Server sends position and estimated wait time updates

#### Agent Events
- `agent-dashboard`: Agent joins with selected languages
- `dashboard-update`: Server sends filtered queue data based on agent's languages

## Configuration

### Environment Variables

- `SOCKET_PORT`: Port for the Socket.IO server (default: 3001)

### Supported Languages

- Hindi (hi)
- Bengali (bn)
- Tamil (ta)
- Telugu (te)
- Marathi (mr)

## Development

### Available Scripts

- `npm run dev`: Start Next.js development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run socket-server`: Start the Socket.IO backend server

### Adding New Languages

1. Update the `LANGUAGES` array in both `src/app/customer/page.jsx` and `src/app/agent/page.jsx`
2. Add the new language code and label

## Deployment

### Backend Deployment

The Socket.IO server can be deployed to any Node.js hosting platform (Heroku, Railway, DigitalOcean, etc.).

### Frontend Deployment

The Next.js application can be deployed to Vercel, Netlify, or any other hosting platform that supports Next.js.

### Environment Setup

Ensure the frontend connects to the correct backend URL by updating the Socket.IO connection in both customer and agent pages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue in the repository.
