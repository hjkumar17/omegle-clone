const videoGrid = document.getElementById("video-grid");
const myVideo = document.getElementById("user1");
const remoteUserVideo = document.getElementById("user2");
const muteButton = document.getElementById("muteButton");
const stopVideoButton = document.getElementById("stopVideo");

// myVideo.muted = true;
let socket = io.connect();
let peerConnection;
let myVideoStream;
let remoteStream;
let sendChannel;
let msgInput = document.querySelector("#chat_message");
let msgSendButton = document.querySelector("#send");
let msgTextArea = document.querySelector(".messages");

stopVideoButton.addEventListener('click',function(){
  myVideoStream.getTracks().forEach((track) => {
    if(track.kind === 'video'){
      const newValue = !track.enabled;
      track.enabled = newValue;
    }
    // console.log("track",track);
    // peerConnection.addTrack(track, myVideoStream);
  });
})
muteButton.addEventListener('click',function(){
  myVideoStream.getTracks().forEach((track) => {
    if(track.kind === 'audio'){
      const newValue = !track.enabled;
      track.enabled = newValue;
    }
    // console.log("track",track);
    // peerConnection.addTrack(track, myVideoStream);
  });
})

// let mediaDevice = await  navigator.mediaDevices.getUserMedia({
//   audio:true,
//   video:true
// })

// navigator.mediaDevices.ondevicechange = (event) => {
// updateDeviceList();
// };

// const constraints = {
//     video: {
//       width: 160,
//       height: 120,
//       frameRate: 30,
//     },
//     audio: {
//       sampleRate: 44100,
//       sampleSize: 16,
//       volume: 0.25,
//     },
//   };

//   navigator.mediaDevices
//     .getUserMedia(constraints)
//     .then((stream) => {
//       videoElement.srcObject = stream;
//       updateDeviceList();
//     })
//     .catch((err) => {
//       log(`${err.name}: ${err.message}`);
//     });
// function updateDeviceList() {
// navigator.mediaDevices.enumerateDevices().then((devices) => {
//   audioList.innerHTML = "";
//   videoList.innerHTML = "";

//   devices.forEach((device) => {
//     const elem = document.createElement("li");
//     const [kind, type, direction] = device.kind.match(/(\w+)(input|output)/i);

//     elem.innerHTML = `<strong>${device.label}</strong> (${direction})`;
//     if (type === "audio") {
//       audioList.appendChild(elem);
//     } else if (type === "video") {
//       videoList.appendChild(elem);
//     }
//   });
// });

const onSendChannelStateChange = () => {
  const readyState = sendChannel.readyState;
  console.log(sendChannel);
  if (readyState === "open") {
    console.log("Data channel ready state is open - onSendChannelStateChange");
  } else {
    console.log(
      "Data channel ready state is not open - onSendChannelStateChange"
    );
  }
};

const createPeerConnection = async () => {
  let server = {
    iceServers: [
      {
        urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
      },
    ],
  };
    peerConnection = new RTCPeerConnection(server);
    remoteStream = new MediaStream();
    remoteUserVideo.srcObject = remoteStream;
    remoteUserVideo.addEventListener("loadedmetadata", () => {
      remoteUserVideo.play();
      videoGrid.append(remoteUserVideo);
    });
    addVideoStream(remoteUserVideo, remoteStream);
  
    myVideoStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, myVideoStream);
    });
  
    peerConnection.ontrack = async (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  
    remoteStream.oninactive = () => {
      remoteStream.getTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
  
      peerConnection.close();
    };
    peerConnection.onicecandidate = async (e) => {
      if (e.candidate) {
        socket.emit("candidateSentToUser", {
          selfSocketId: socket.id,
          iceCandidateData: e.candidate,
        });
      }
    };
  
    sendChannel = peerConnection.createDataChannel("sendDataChannel");
    sendChannel.onopen = () => {
      onSendChannelStateChange();
    };
  
    peerConnection.ondatachannel = receiverChannelCallback;
    // sendChannel.onmessage = onsendChannelMessageCallback;
  };
  
const createOffer = async () => {
  console.log('offercreate');
  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection();
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  // socket.emit("offerSentToRemote", {
  //   userName: user.split(" ")[0],
  //   remoteUser: user.split(" ")[1],
  //   offer: peerConnection.localDescription,
  // });
  socket.emit("offerSendToServer", {
    selfSocketId: socket.id,
    offer: peerConnection.localDescription,
  });
};



//  -- Start Getting Self Video 
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myVideo.srcObject = stream;
    myVideo.addEventListener("loadedmetadata", () => {
      myVideo.play();
      videoGrid.append(myVideo);
    });

    createOffer();
    // $.post("http://localhost:3000/get-remote-users", {
    //   omeId: omeId,
    // })
    //   .done((data) => {
    //     if (data[0]) {
    //       if (data[0]._id === remoteUser || data[0]._id === username) {
    //       } else {
    //         remoteUser = data[0]._id;
    //       }
    //     }
    //   })
    //   .fail((xhr, testStatus, errorThrown) => {
    //     console.log(xhr, responseText);
    //   });

    // socket.on("user-connected", (userId) => {
    //   connectToNewUser(userId, stream);
    // });
  });

//  -- End Getting Self Video 


//  -- Start Showing self video 
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};
//  -- End Showing self video 



socket.on("connect", () => {    
    console.log(socket.id);
  if (socket.connected) {
    // socket.emit("userConnected", {
    //   displayName: socket.id,
    // });
  }
});



const createAnswer = async (data) => {
  // remoteUser = data.remoteUser;
console.log('createAnswer');
  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection();

  await peerConnection.setRemoteDescription(data.offer);
  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("sendAnswerToUser1", {
    answer: answer,
    selfSocketId: socket.id,
  });

  // $.ajax({
  //   url: "/update-on-engagement/" + username + "",
  //   type: "PUT",
  //   success: function (response) {},
  // });
};

const addAnswer = async (data) => {
  console.log('addAnser');
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
  // $.ajax({
  //   url: "/update-on-engagement/" + username + "",
  //   type: "PUT",
  //   success: function (response) {},
  // });
};

socket.on("receiveOffer", (data) => {
  createAnswer(data);
});

socket.on("receiverAnswer", (data) => {
  addAnswer(data);
});


socket.on("noUserFoundToConnect", (data) => {
 console.log("noUserFoundToConnect")
});
socket.on("candidateReciver", (data) => {
  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendButton.addEventListener("click", function (event) {
  sendData();
});

// window.addEventListener("unload", function (event) {
//   $.ajax({
//     url: "/leaving-user-update/" + username + "",
//     type: "PUT",
//     success: function (response) {
//       alert(response);
//     },
//   });
// });

// $.ajax({
//   url: "/new-user-update/" + omeID + "",
//   type: "PUT",
//   success: function (response) {
//     alert(response);
//   },
// });

// const fetchNextUser = (remoteUser) => {
//   $.post(
//     "http://localhost:3000/get-next-users",
//     {
//       omeID: omeID,
//       remoteUser: remoteUser,
//     },
//     function (data) {
//       console.log("Next user id is:", data);
//       if (data[0]) {
//         if (data[0]._id === remoteUser || data[0]._id === username) {
//         } else {
//           remoteUser = data[0]._id;
//         }
//         createOffer()
//       }
//     }
//   );
// };


// document.querySelector(".next_chat").onclick = function () {
//     msgTextArea.innerHTML = "";
//     if (
//         peerConnection.connectionState === "connected" ||
//         peerConnection.iceCandidateState === "conneccted"
//     ) {
//         closeConnection();
//         console.log("User closed");
//     } else {
//         fetchNextUser(remoteUser);
//         console.log("moving to next user");
//     }
// };

const closeConnection = async () => {
  await peerConnection.close();
  await socket.emit("remoteUserClosed", {
    username: username,
    remoteUser: remoteUser,
  });

  $.ajax({
    url: "/update-on-next/" + username + "",
    type: "PUT",
    success: function (response) {
      fetchNextUser(remoteUser);
    },
  });
};


  var receiverChannelCallback = (event) => {
    console.log("Receive channel callback");
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveChannelMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  };
  
  const onReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState;
    if (readyState === "open") {
      console.log(
        "Data channel ready state is open - onReceiveChannelStateChange"
      );
    } else {
      console.log(
        "Data channel ready state is not open - onReceiveChannelStateChange"
      );
    }
  };
  
  const onReceiveChannelMessageCallback = (event) => {
    console.log("Received message");
    msgTextArea.innerHTML += `
    <div style='margin-top:2px; margin-bottom:2px; color:white'>
    <b>
    Stranger:
    </b>
    ${event.data}
    </div>`;
  };
  
  const sendData = () => {
    const data = msgInput.value;
    msgTextArea.innerHTML += `
    <div style='margin-top:2px; margin-bottom:2px; color:white'>
    <b>
    Me:
    </b>
    ${data}
    </div>`;
    if (sendChannel) {
      onSendChannelStateChange();
      sendChannel.send(data);
      msgInput.value = "";
    } else {
      receiveChannel.send(data);
      msgInput.value = "";
    }
  };
  
 