const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.use(express.static("public"));

io.on("connection", newConnection);

function newConnection(socket) {
  console.log("a new user connected!");

  socket.emit("connected", { msg: "You're connected!" });

  socket.on("message", gotMessage);

  function gotMessage(data) {
    socket.broadcast.emit("message", data);
  }
}

server.listen(process.env.PORT || 3000, function () {
  console.log("Started server at http://localhost:3000");
});
