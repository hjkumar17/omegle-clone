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
//  userData =  {
//  gender: M/F,
// ranking: 1200 (base rank),
// introFileLink:'',
// feedbackData:{
//   reportedBy: (Number of users reproted this ),
// },
// callStreak: ( Number how many 2 mins call ),

// }


// ============ Matching Logic ==============

let usersTryingToConnect = [];



const  findOtherUserToConnect = (data)=>{
  let receiverSocketId;
    receiverSocketId = usersTryingToConnect.find(
      (users) => users.connectionId !== data.selfSocketId
    );
  return receiverSocketId || false ;
}



io.on("connection", (socket) => {
  userConnections.push({
    connectionId: socket.id,
    status:'available'
  });
  console.log("userConnections", userConnections);

  socket.on("offerSendToServer", (data) => {
    // console.log(data);

    //  push into usersTryingToConnect 
    
    // const receiverSocketId = await  findOtherUserToConnect(data)
    

    // if (receiverSocketId) {
    //   data.receiverSocketId = receiverSocketId;
  console.log("offerSendToServer", data);

      io.to(data.receiverSocketId).emit("receiveOffer", data);
    // } else {
    //   socket.to(data.selfSocketId).emit("noUserFoundToConnect");
    // }
  });

  socket.on('usersTryingToConnect',(data)=>{
    console.log("usersTryingToConnect", data);

    usersTryingToConnect.push({
      connectionId: data.selfSocketId,
      status:'trying'
    });

  })
  socket.on('findUserToConnect',(data)=>{
 const receiverSocketId =  findOtherUserToConnect(data)
    
 console.log("findUserToConnect", data,receiverSocketId);

    if (receiverSocketId) {
      let newData = {

      }
      newData.receiverSocketId = data.selfSocketId;
      newData.selfSocketId = receiverSocketId.connectionId;
      io.to(receiverSocketId.connectionId).emit("matchFoundToConnect", newData);
    } else {
      io.to(data.selfSocketId).emit("noUserFoundToConnect");
    }

  })

  socket.on("sendAnswerToUser1", (data) => {
 console.log("sendAnswerToUser1", data);

    // let answerReciver = userConnections.find(
    //   (users) => users.connectionId !== data.selfSocketId
    // );

    // if (data.receiverSocketId) {
      io.to(data.selfSocketId).emit("receiverAnswer", data);
    // }
  });

  socket.on("candidateSentToUser", (data) => {
    // let candidateReciver = userConnections.find(
    //   (users) => users.connectionId !== data.selfSocketId
    // );
    // console.log(candidateReciver);
    // if (candidateReciver) {
      io.to(data.receiverSocketId).emit("candidateReciver", data);
    // }
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
    let disUser1 = usersTryingToConnect.find(
      (user) => user.connectionId === socket.id
    );
    if (disUser1) {
      usersTryingToConnect = usersTryingToConnect.filter(
        (user) => user.connectionId !== socket.id
      );
    }
    // console.log("user disconnect", socket.id);
    console.log("userConnections", userConnections,usersTryingToConnect);
  });
  socket.on("remoteUserClosed", (data) => {
    let closedUser = userConnections.find(
      (users) => users.userId === data.remoteUser
    );

    if (closedUser) {
      console.log("closed user id :", closedUser.connectionId);
      io.to(closedUser.connectionId).emit("closedRemoteUser", data);
    }
  });
});
