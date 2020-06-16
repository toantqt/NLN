
function openStream(){
    const config = { audio: false, video: true};
    return navigator.mediaDevices.getUserMedia(config);
}

//Mo camera tren may theo id
function playStream(idVideoTag, stream){
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}

//openStream la 1 promise
// openStream()
//  .then(stream => playStream('localStream', stream));

//key lay tren peer js
var peer = new Peer({key: 'lwjd5qra8257b9'});
//ket noi den server peerjs
peer.on('open', id => $("#my-peer").append(id));

//caller
$("#btnCall").click(() => {
    //lay id nguoi can goi
    const id = $("#remoteId").val();
    console.log(id);
    openStream()
     .then(stream => {
         playStream('localStream', stream);
         const call = peer.call(id, stream);
         call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
     });
});

peer.on('call', call => {
    openStream()
     .then(stream => {
         call.answer(stream);
         playStream('localStream', stream);
         call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
     });
});