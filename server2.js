const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const connectDB = require("./Server/Database/connection");
const { configDotenv } = require("dotenv");
configDotenv({
  path: "config.env",
});

const PORT = process.env.PORT || 8080;
const app = express();
// connectDB();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.set('views', './views')
// app.set("view engine", "ejs");
// app.engine('html', require('ejs').renderFile)
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));
app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/", express.static("public"));
// app.use("/", require("./Server/routes/router"));

app.get("/", function (req, res) {
  res.render("index");
});
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const io = require("socket.io")(server, {
  allowEI03: true,
});

let userConnections = [];

io.on("connection", (socket) => {
  userConnections.push({
    connectionId: socket.id,
  });
  console.log("userConnections", userConnections);

  socket.on("offerSendToServer", (data) => {
    // console.log(data);
    let receiverSocketId = userConnections.find(
      (users) => users.connectionId !== data.selfSocketId
    );

    if (receiverSocketId) {
      socket.to(receiverSocketId.connectionId).emit("receiveOffer", data);
    } else {
      socket.to(data.selfSocketId).emit("noUserFoundToConnect");
    }
  });

  socket.on("sendAnswerToUser1", (data) => {
    let answerReciver = userConnections.find(
      (users) => users.connectionId !== data.selfSocketId
    );

    if (answerReciver) {
      socket.to(answerReciver.connectionId).emit("receiverAnswer", data);
    }
  });

  socket.on("candidateSentToUser", (data) => {
    let candidateReciver = userConnections.find(
      (users) => users.connectionId !== data.selfSocketId
    );
    console.log(candidateReciver);
    if (candidateReciver) {
      socket.to(candidateReciver.connectionId).emit("candidateReciver", data);
    }
  });

  socket.on("disconnect", () => {
    let disUser = userConnections.find(
      (user) => user.connectionId === socket.id
    );
    if (disUser) {
      userConnections = userConnections.filter(
        (user) => user.connectionId !== socket.id
      );
    }
    console.log("user disconnect", socket.id);
    console.log("userConnections", userConnections);
  });
  socket.on("remoteUserClosed", (data) => {
    let closedUser = userConnections.find(
      (users) => users.userId === data.remoteUser
    );

    if (closedUser) {
      console.log("closed user id :", closedUser.connectionId);
      socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
    }
  });
});
