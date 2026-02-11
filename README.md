# 101529840 Lab Test 1 – Chat Application

A real-time messaging platform developed for COMP3133 Lab Test 1. The application uses Express, Socket.io, and MongoDB to support live communication between users.

---

## Technology Used

**Server-side**
- Node.js
- Express
- Socket.io
- Mongoose

**Client-side**
- HTML5
- CSS
- Bootstrap
- jQuery
- Fetch API

**Database**
- MongoDB

---

## Core Functionality

- User registration with data stored in MongoDB and enforcement of unique usernames
- Authentication system with session tracking via `localStorage`
- Ability for users to log out securely
- Default chat rooms that users can enter or exit
- Live group messaging with message persistence
- Direct private messaging between users with stored history
- Typing notifications for both group and private conversations
- Active user display showing who is currently online
- Retrieval of previous messages for rooms and private chats

---

## Directory Layout

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

---

## Configuration

Create a `.env` file at the root level of the project and include the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/lab_test1_chat
```

If you prefer using MongoDB Atlas, substitute the connection string accordingly.

---

## Getting Started

Follow these steps to run the application locally:

1. Install the required packages:
   ```bash
   npm install
   ```

2. Ensure your MongoDB instance is available:
   - Run a local MongoDB service, **or**
   - Provide an Atlas connection string inside the `.env` file.

3. Launch the server:
   ```bash
   npm start
   ```

4. Navigate to the app in your browser:
   ```
   http://localhost:3000
   ```

---

## Application Routes

- **Signup:**  
  `http://localhost:3000/view/signup.html`

- **Login:**  
  `http://localhost:3000/view/login.html`

- **Chat Interface:**  
  `http://localhost:3000/view/chat.html`

---

## REST Endpoints

- `POST /api/signup` – Register a new user
- `POST /api/login` – Authenticate an existing user
- `GET /api/rooms` – Retrieve available chat rooms
- `GET /api/users?username=<currentUser>` – Fetch users excluding the current user
- `GET /api/messages/room/:room` – Load messages for a specific room
- `GET /api/messages/private/:otherUser?username=<currentUser>` – Load private conversation history

---

## WebSocket Events

**Client Events**
- `register-user`
- `join-room`
- `leave-room`
- `send-room-message`
- `send-private-message`
- `typing-room`
- `typing-private`

**Server Broadcasts**
- `room-message`
- `private-message`
- `room-system-message`
- `typing-room`
- `typing-private`
- `online-users`