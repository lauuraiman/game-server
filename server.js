const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  socket.on('create_room', (_, callback) => {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms[roomId] = { players: [socket.id] };
    socket.join(roomId);
    if (callback) callback({ success: true, roomId });
    console.log(`Комната создана: ${roomId}`);
  });

  socket.on('join_room', ({ roomId }, callback) => {
    roomId = roomId.toUpperCase();
    if (rooms[roomId]) {
      rooms[roomId].players.push(socket.id);
      socket.join(roomId);
      io.to(roomId).emit('player_joined', { players: rooms[roomId].players });
      if (callback) callback({ success: true });
      console.log(`Игрок вошел в комнату ${roomId}`);
    } else {
      if (callback) callback({ success: false, message: 'Комната не найдена' });
    }
  });

  socket.on('make_move', ({ roomId, moveData }) => {
    socket.to(roomId).emit('update_game', moveData);
  });

  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});