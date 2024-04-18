const videoGrid = document.getElementById("video-grid");
const myVideo = document.getElementById("user1");
const remoteUserVideo = document.getElementById("user2");

myVideo.muted = true;
let socket = io.connect();
let peerConnection;
let myVideoStream;
let remoteStream;
let sendChannel;
let msgInput = document.querySelector("#chat_message");
let msgSendButton = document.querySelector("#send");
let msgTextArea = document.querySelector(".messages");
let server = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(server);
  remoteStream = new MediaStream();
  remoteUserVideo.srcObject = remoteStream;
  remoteUserVideo.addEventListener("loadedmetadata", () => {
    remoteUserVideo.play();
    videoGrid.append(remoteUserVideo);
  });
  // addVideoStream(myVideo, remoteStream);

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
        username: user.split(" ")[0],
        remoteUser: user.split(" ")[1],
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

const receiverChannelCallback = (event) => {
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
let createOffer = async () => {
  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection();
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offerSentToRemote", {
    userName: user.split(" ")[0],
    remoteUser: user.split(" ")[1],
    offer: peerConnection.localDescription,
  });
};

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    // addVideoStream(myVideo, stream);
    myVideo.srcObject = stream;
    myVideo.addEventListener("loadedmetadata", () => {
      myVideo.play();
      videoGrid.append(myVideo);
    });

    $.post("http://localhost:3000/get-remote-users", {
      omeId: omeId,
    })
      .done((data) => {
        if (data[0]) {
          if (data[0]._id === remoteUser || data[0]._id === username) {
          } else {
            remoteUser = data[0]._id;
          }
        }
        createOffer();
      })
      .fail((xhr, testStatus, errorThrown) => {
        console.log(xhr, responseText);
      });

    // socket.on("user-connected", (userId) => {
    //   connectToNewUser(userId, stream);
    // });
  });

const user = prompt("Enter username");
let remoteUser = user.split(" ")[1];
socket.on("connect", () => {
  if (socket.connected) {
    socket.emit("userConnected", {
      displayName: user.split(" ")[0],
    });
  }
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

const createAnswer = async (data) => {
  remoteUser = data.remoteUser;

  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection();

  await peerConnection.setRemoteDescription(data.offer);
  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("sendAnswerToUser1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.userName,
  });

  $.ajax({
    url: "/update-on-engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  });
};

const addAnswer = async (data) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
  $.ajax({
    url: "/update-on-engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  });
};

socket.on("receiveOffer", (data) => {
  createAnswer(data);
});

socket.on("receiverAnswer", (data) => {
  addAnswer(data);
});

socket.on("candidateReciver", (data) => {
  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendButton.addEventListener("click", function (event) {
  sendData();
});

window.addEventListener("unload", function (event) {
  $.ajax({
    url: "/leaving-user-update/" + username + "",
    type: "PUT",
    success: function (response) {
      alert(response);
    },
  });
});

$.ajax({
  url: "/new-user-update/" + omeID + "",
  type: "PUT",
  success: function (response) {
    alert(response);
  },
});

const fetchNextUser = (remoteUser) => {
  $.post(
    "http://localhost:3000/get-next-users",
    {
      omeID: omeID,
      remoteUser: remoteUser,
    },
    function (data) {
      console.log("Next user id is:", data);
      if (data[0]) {
        if (data[0]._id === remoteUser || data[0]._id === username) {
        } else {
          remoteUser = data[0]._id;
        }
        createOffer()
      }
    }
  );
};

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

document.querySelector(".next_chat").onclick = function () {
  msgTextArea.innerHTML = "";
  if (
    peerConnection.connectionState === "connected" ||
    peerConnection.iceCandidateState === "conneccted"
  ) {
    closeConnection();
    console.log("User closed");
  } else {
    fetchNextUser(remoteUser);
    console.log("moving to next user");
  }
};
