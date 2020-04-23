$(function(){
    var socket = io('/chat');
    var username = $('#user').val();
    socket.on('connect', function(){
        socket.emit('set-user-data', username);
    })
})