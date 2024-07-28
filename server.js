import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const { createServer } = http;

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const EVENTS_SOCKET = {
  MovingCard: "MovingCard",
  ResizingCard: "ResizingCard",
  MovingPointer: "MovingPointer",
  ChangeInput: "ChangeInput",
  AddingCard: "AddingCard",
};

io.on("connection", (client) => {
  console.log(client.id);
  client.on(EVENTS_SOCKET.MovingPointer, (data) => {
    client.broadcast.emit(EVENTS_SOCKET.MovingPointer, data);
  });

  client.on(EVENTS_SOCKET.AddingCard, (data) => {
    client.broadcast.emit(EVENTS_SOCKET.AddingCard, data);
  });

  client.on(EVENTS_SOCKET.MovingCard, (data) => {
    client.broadcast.emit(EVENTS_SOCKET.MovingCard, data);
  });

  client.on(EVENTS_SOCKET.ChangeInput, (data) => {
    client.broadcast.emit(EVENTS_SOCKET.ChangeInput, data);
  });

  client.on(EVENTS_SOCKET.ResizingCard, (data) => {
    client.broadcast.emit(EVENTS_SOCKET.ResizingCard, data);
  });
});

server.listen(3000, () => {
  console.log("server is running");
});
