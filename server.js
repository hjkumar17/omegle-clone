const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));
app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));

app.use("/", require("./Server/routes/router"));

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const io = require("socket.io")(server, {
  allowEI03: true,
});

let userConnections = [];

io.on("connection", (socket) => {
  // console.log("socket id is", socket);
  socket.on("userConnected", (data) => {
    userConnections.push({
      connectionId: socket.id,
      userId: data.displayName,
    });
  });

  socket.on("offerSentToRemote", (data) => {
    let offerReceiver = userConnections.find(
      (users) => users.userId === data.remoteUser
    );

    if (offerReceiver) {
      socket.to(offerReceiver.connectionId).emit("receiveOffer", data);
    }
  });

  socket.on("sendAnswerToUser1", (data) => {
    let answerReciver = userConnections.find(
      (users) => users.userId === data.receiver
    );

    if (answerReciver) {
      socket.to(answerReciver.connectionId).emit("receiverAnswer", data);
    }
  });

  socket.on("candidateSentToUser", (data) => {
    let candidateReciver = userConnections.find(
      (users) => users.userId === data.remoteUser
    );

    if (candidateReciver) {
      socket.to(candidateReciver.connectionId).emit("candidateReciver", data);
    }
  });

  socket.on('disconnect',()=>{
    let disUser = userConnections.find(user=>user.connectionId === socket.id)
    if(disUser){
      userConnections = userConnections.filter(user=>user.connectionId !== socket.id)
    }
  })
});
