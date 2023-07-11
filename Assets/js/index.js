const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");

myVideo.muted = true;
let socket = io.connect();
let peerConnection;
let myVideoStream;
let remoteStream;
let server = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    createOffer();

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

const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(server);
  remoteStream = new MediaStream();
  addVideoStream(myVideo, remoteStream);

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

const createAnswer = async (data) => {
  remoteUser = data.remoteUser;

  // peerConnection = new RTCPeerConnection(server);
  createPeerConnection();

  await peerConnection.setRemoteDescription(data.offer);
  let answer =await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("sendAnswerToUser1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.userName,
  });
};

const addAnswer = async (data) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
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
