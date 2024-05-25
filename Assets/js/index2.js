const videoGrid = document.getElementById("video-grid");
const myVideo = document.getElementById("user1");
const remoteUserVideo = document.getElementById("user2");
const muteButton = document.getElementById("muteButton");
const stopVideoButton = document.getElementById("stopVideo");
const micIcon = document.getElementById("micIcon");
const speakerIcon = document.getElementById("speakerIcon");
const startBtn = document.querySelector("#startBtn");

let msgInput = document.querySelector("#chat_message");
let msgSendButton = document.querySelector("#send");
let msgTextArea = document.querySelector(".messages");

myVideo.muted = true;
let socket = io.connect();
let peerConnection;
let myVideoStream;
let remoteStream;
let sendChannel;
let availableAudioInputs;
let availableAudioOutputs;
let selfSocketId = socket.id;
let remoteUserSocketId ;

stopVideoButton.addEventListener("click", function () {
  myVideoStream.getTracks().forEach((track) => {
    if (track.kind === "video") {
      const newValue = !track.enabled;
      track.enabled = newValue;
    }
  });
});

muteButton.addEventListener("click", function () {
  if (availableAudioInputs.length) {
  }
  myVideoStream.getTracks().forEach((track) => {
    if (track.kind === "audio") {
      const newValue = !track.enabled;
      if (newValue) {
        micIcon.classList.remove("fa-microphone-slash");
      } else {
        micIcon.classList.add("fa-microphone-slash");
      }
      track.enabled = newValue;
    }
  });
});

const updateDeviceList = () => {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      availableAudioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      availableAudioOutputs = devices.filter(
        (device) => device.kind === "audiooutput"
      );

      devices.forEach((device) => {
        const [kind, type, direction] =
          device.kind.match(/(\w+)(input|output)/i);
        // console.log(kind, type, direction);
      });
    })
    .catch((error) => {
      console.error("Error enumerating devices:", error);
    });
};

navigator.mediaDevices.ondevicechange = (event) => {
  updateDeviceList();
};

updateDeviceList();

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

const createPeerConnection = async (data) => {
  let server = {
    iceServers: [
      {
        urls: [
          "stun:stun1.1.google.com:19302",
          "stun:stun2.1.google.com:19302",
        ],
      },
    ],
  };
  peerConnection = new RTCPeerConnection(server);
  remoteStream = new MediaStream();
  remoteUserVideo.srcObject = remoteStream;
  remoteUserVideo.addEventListener("loadedmetadata", () => {
    remoteUserVideo.play();
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
        selfSocketId: data.selfSocketId,
        iceCandidateData: e.candidate,
        receiverSocketId:data.receiverSocketId
      });
    }
  };

  sendChannel = peerConnection.createDataChannel("sendDataChannel");
  sendChannel.onopen = () => {
    onSendChannelStateChange();
  };
  sendChannel.onclose = () => {
    onSendChannelStateChange();
    peerConnection.close();
    removeVideoStream("remoteUser");
  };

  peerConnection.ondatachannel = receiverChannelCallback;
};

const createOffer = async (data) => {
  createPeerConnection(data);
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offerSendToServer", {
    selfSocketId: data.selfSocketId,
    offer: peerConnection.localDescription,
    receiverSocketId:data.receiverSocketId
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

    // createOffer();
  })
  .catch((error) => {
    console.error("Error accessing media devices:", error);

    // Check the error to determine the reason for denial
    if (error.name === "NotAllowedError" || error.name === "NotFoundError") {
      console.log(
        "Permission denied by the user or no media devices available."
      );
    } else if (
      error.name === "NotReadableError" ||
      error.name === "OverconstrainedError"
    ) {
      console.log(
        "Media devices are not readable due to hardware or constraints."
      );
    } else {
      console.log("Unknown error occurred:", error.name);
    }
    alert("Please check your media devices permission");
  });

//  -- End Getting Self Video

//  -- Start Showing self video
const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    // videoGrid.append(video);
  });
};
const removeVideoStream = () => {
  remoteUserVideo.srcObject = null;

  msgInput.value = "";
  msgTextArea.innerHTML = "";
  remoteStream.addEventListener("suspend", () => {
    console.log("remotestreamsuspend");

    video.pause();
  });
};
//  -- End Showing self video

socket.on("connect", () => {
  console.log("connect",socket.id,peerConnection);
  if (socket.connected) {
  }
});

const createAnswer = async (data) => {
  // remoteUser = data.remoteUser;
  console.log("createAnswer",peerConnection);
  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection(data);

  await peerConnection.setRemoteDescription(data.offer);
  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("sendAnswerToUser1", {
    answer: answer,
    selfSocketId: data.selfSocketId,
    receiverSocketId:data.receiverSocketId
  });
};

const addAnswer = async (data) => {
  console.log("addAnser",peerConnection);
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }

};

socket.on("receiveOffer", (data) => {
  console.log("receiveOffer",data,peerConnection);

  createAnswer(data);
});

socket.on("receiverAnswer", (data) => {
  console.log("receiverAnswer",data,peerConnection);

  addAnswer(data);
});


socket.on("matchFoundToConnect", (data) => {
  console.log("matchFoundToConnect",data,peerConnection);
  
  // remoteUserSocketId = data.receiverSocketId;
  createOffer(data)
});
socket.on("noUserFoundToConnect", (data) => {
  console.log("noUserFoundToConnect",data);
});
socket.on("candidateReciver", (data) => {
  console.log("candidateReciver",data,peerConnection);

  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendButton.addEventListener("click", function (event) {
  sendData();
});

startBtn.addEventListener('click',function(e){
  // start first call

  socket.emit("usersTryingToConnect", {
    selfSocketId: socket.id,
  });
setTimeout(()=>{
  findUserToConnect();
},5000)
  // createOffer()
})

const findUserToConnect = ()=>{

  // createPeerConnection();
  // let offer = await peerConnection.createOffer();
  // await peerConnection.setLocalDescription(offer);

  socket.emit("findUserToConnect", {
    selfSocketId: socket.id,
  });
}


const closeConnection = async () => {
  await peerConnection.close();
  await socket.emit("remoteUserClosed", {
    username: username,
    remoteUser: remoteUser,
  });

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
    msgInput.value = "";
    msgTextArea.innerHTML = "";
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
