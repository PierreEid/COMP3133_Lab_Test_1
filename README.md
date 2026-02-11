# studentID_lab_test1_chat_app

Real-time chat application for COMP3133 Lab Test 1 using Express, Socket.io, and MongoDB.

## Tech Stack

- Backend: Node.js, Express, Socket.io, Mongoose
- Frontend: HTML5, CSS, Bootstrap, fetch, jQuery
- Database: MongoDB

## Features Implemented

- Signup with MongoDB persistence and unique username validation
- Login with localStorage session handling
- Logout functionality
- Predefined room list and join/leave support
- Room-based real-time messaging with MongoDB storage
- Private 1-to-1 messaging with MongoDB storage
- Typing indicator for room chat and private chat
- Online user list
- Message history loading for room and private chats

## Project Structure

```text
.
|-- models
|   |-- User.js
|   |-- GroupMessage.js
|   `-- PrivateMessage.js
|-- view
|   |-- signup.html
|   |-- signup.js
|   |-- login.html
|   |-- login.js
|   |-- chat.html
|   |-- chat.js
|   `-- styles.css
|-- .env.example
|-- package.json
|-- server.js
`-- README.md
```

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/lab_test1_chat
```

If you are using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

## Setup and Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Make sure MongoDB is running:
   - Local MongoDB service, or
   - Atlas connection string in `.env`
3. Start the application:
   ```bash
   npm start
   ```
4. Open in browser:
   - `http://localhost:3000`

## Pages

- Signup: `http://localhost:3000/view/signup.html`
- Login: `http://localhost:3000/view/login.html`
- Chat: `http://localhost:3000/view/chat.html`

## API Endpoints

- `POST /api/signup`
- `POST /api/login`
- `GET /api/rooms`
- `GET /api/users?username=<currentUser>`
- `GET /api/messages/room/:room`
- `GET /api/messages/private/:otherUser?username=<currentUser>`

## Socket Events

- `register-user`
- `join-room`
- `leave-room`
- `send-room-message`
- `send-private-message`
- `typing-room`
- `typing-private`

Server emissions:

- `room-message`
- `private-message`
- `room-system-message`
- `typing-room`
- `typing-private`
- `online-users`
