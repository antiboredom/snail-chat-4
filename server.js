const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const dbFile = "snails.db";
const exists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  if (!exists) {
    db.run(
      `CREATE TABLE Touches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        color REAL,
        snail TEXT,
        frame INTEGER,
        touches TEXT
      )`
    );
  }
});

app.use(express.static("public"));

io.on("connection", newConnection);

function newConnection(socket) {
  const isSnail =
    socket.handshake.query && socket.handshake.query.secret == process.env.SNAILSECRET;

  const name = socket.handshake.query.name;

  if (isSnail) {
    console.log("a new snail connected!");
  } else {
    console.log("a new human connected!");
  }

  socket.emit("connected", { msg: "connected!", isSnail: isSnail });

  if (isSnail) {
    socket.on("message", gotMessage);
  }

  function gotMessage(data) {
    db.run(
      `INSERT INTO Touches (color, snail, frame, touches) VALUES (?, ?, ?, json(?))`,
      data.c,
      name,
      data.fc,
      JSON.stringify(data.touches)
    );
    socket.broadcast.emit("message", data);
  }
}

server.listen(process.env.PORT || 3000, function () {
  console.log("Started server at http://localhost:3000");
});
