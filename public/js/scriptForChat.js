$ (function(){

  var socket = io('/chat');

  var username = $('#user').val();
  var noChat = 0; //setting 0 if all chats histroy is not loaded. 1 if all chats loaded.
  var msgCount = 0; //counting total number of messages displayed.
  var oldInitDone = 0; //it is 0 when old-chats-init is not executed and 1 if executed.
  var roomId;//variable for setting room.
  var toUser;
  var allGroup = [];
  var admin = [];
  var allUser =[]


  //passing data on connection.
  socket.on('connect',function(){
    socket.emit('set-user-data',username);
    // setTimeout(function() { alert(username+" logged In"); }, 500);

    socket.on('broadcast',function(data){
    document.getElementById("hell0").innerHTML += '<li>'+ data.description +'</li>';
    // $('#hell0').append($('<li>').append($(data.description).append($('<li>');
    $('#hell0').scrollTop($('#hell0')[0].scrollHeight);

});

  });//end of connect event.

$('#createGroup').hide();

  //receiving onlineStack.
  socket.on('onlineStack',function(stack){
    $('#list').empty();
    $('#list').append($('<li>').append($('<button id="ubtn" class="btn btn-danger btn-block btn-lg"></button>').text("Group").css({"font-size":"18px", "width":"70px"})));
    var totalOnline = 0;
    for (var user in stack.userStack){
      //setting txt1. shows users button.
      if(user == username){
        var txt1 = $('<button class="boxF disabled"> </button>').text(user).css({"font-size":"18px"});
      }
      else if(user == 'undefined'){
        var txt1 = '';
        
      }
      else{
        var txt1 = $('<button id="ubtn" class="btn btn-success  btn-md">').text(user).css({"font-size":"18px"});
      }
      //setting txt2. shows online status.
      if(stack.userStack[user] == "Online" && user != 'undefined'){
        var txt2 = $('<span></span>').append("<i class='fas fa-circle'></i>").css({"float":"right","color":"green","font-size":"15px", "margin-top": "9px"});
        totalOnline++;
      }
      else if(user == 'undefined'){
        var txt2 = '';
      }
      else{
        var txt2 = $('<span ></span>').text(stack.userStack[user]).css({"float":"right","color":"#a6a6a6","font-size":"12px"});
      }
      if(user == 'undefined'){
      //listing all users.
        $('#list').append($('<li id="none">').append(txt1,txt2));
      }
      else{
        $('#list').append($('<li>').append(txt1,txt2));
      }
      //$('#totalOnline').text(totalOnline);
    }//end of for.
    $('#list').append('<div id="list-room"><span>List Room</span></div>');
    
    //show list friend in add Member
    for (var user in stack.userStack){
      var txtMember = $('<button id="ubtn" class="btn btn-success  btn-md">').text(user).css({"font-size":"18px"});
      $('#listFriend').append($('<li>').append(txtMember));
    }
    
    //push admin to array
    for(var ad in stack.adminStack){
      admin.push(ad);
    }
    
    //show group and admin
    for(var group in stack.groupStack){
      allGroup.push(group);
      // var txtName = $('<button id="ubtn" class="btn btn-success  btn-md">').text(group).css({"font-size":"18px"});
      // $('#list').append($('<li>').append(txtName));
    }
    for(var i = 0; i < allGroup.length; i++){
      var txtName = $('<button id="ubtn" class="btn btn-success  btn-md">').text(allGroup[i]).css({"font-size":"18px"});
      if(admin[i] == null){
        var txtAdmin = $('<span id="admin"></span>').text(username).css({"float":"right","color":"#a6a6a6","font-size":"12px"});
      }
      else{
        var txtAdmin = $('<span id="admin"></span>').text(admin[i]).css({"float":"right","color":"#a6a6a6","font-size":"12px"});
      }
        $('#list').append($('<li  data-toggle="modal" data-target="#myModalMember">').append(txtName,txtAdmin));
    }
    
    
    // $('#scrl1').scrollTop($('#scrl1').prop("scrollHeight"));
  }); //end of receiving onlineStack event.

  // socket.on("all-group", function(stack){
   
    
  // });

  //on button click function.
  $(document).on("click","#ubtn",function(){
    $('#frameChat').show();
    $('#createGroup').hide();
    //empty messages.
    $('#messages').empty();
    $('#typing').text("");
    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;

    //assigning friends name to whom messages will send,(in case of group its value is Group).
    toUser = $(this).text();

    //showing and hiding relevant information.
    $('#frndName').text(toUser);
    $('#initMsg').hide();
    $('#chatForm').show(); //showing chat form.
     $('#sendBtn').hide(); //hiding send button to prevent sending of empty messages.

    //find toUser in all group
    var findUser = allGroup.find(x => {
      return x == toUser;
    });
    //assigning two names for room. which helps in one-to-one and also group chat.
    if(toUser == "Group"){
      var currentRoom = "Group-Group";
      var reverseRoom = "Group-Group";
    }
    else if(toUser == findUser){
      var currentRoom = "chatGroup-" + toUser ;
      var reverseRoom = toUser + "-chatGroup";
    }
    else{
      var currentRoom = username+"-"+toUser;
      var reverseRoom = toUser+"-"+username;
    }

    //event to set room and join.
    socket.emit('set-room',{name1:currentRoom,name2:reverseRoom});

  }); //end of on button click event.

  

  //event for setting roomId.
  socket.on('set-room',function(room){
    //empty messages.
    $('#messages').empty();
    $('#typing').text("");
    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;
    //assigning room id to roomId variable. which helps in one-to-one and group chat.
    roomId = room;
    console.log("roomId : "+roomId);
    //event to get chat history on button click or as room is set.
    socket.emit('old-chats-init',{room:roomId,username:username,msgCount:msgCount});
  }); //end of set-room event.

  //on scroll load more old-chats.
  $('#scrl2').scroll(function(){

    if($('#scrl2').scrollTop() == 0 && noChat == 0 && oldInitDone == 1){
      $('#loading').show();
      socket.emit('old-chats',{room:roomId,username:username,msgCount:msgCount, msgTo: toUser});
    }

  }); // end of scroll event.

  //listening old-chats event.
  socket.on('old-chats',function(data){

    if(data.room == roomId){
      oldInitDone = 1; //setting value to implies that old-chats first event is done.
      if(data.result.length != 0){
        $('#noChat').hide(); //hiding no more chats message.
        
        for (var i = 0;i < data.result.length;i++) {
          //styling of chat message.
          var chatDate = moment(data.result[i].createdOn).format("MMMM Do YYYY, hh:mm:ss a");
          var txt1 = $('<span></span>').text(data.result[i].msgFrom+" : ").css({"color":"black","float": "right !important"});
          var txt2 = $('<span></span>').text(chatDate).css({"color":"#a6a6a6","font-size":"16px"});
          var txt3 = $('<p></p>').append(txt1,txt2);
          var txt4 = $('<p></p>').text(data.result[i].msg).css({"color":"#000000","float": "right !important"});
          //showing chat in chat box.
          if(data.result[i].msgFrom == username){
            $('#messages').prepend($('<li id="me">').append(txt3,txt4));
          }
          else{
            $('#messages').prepend($('<li id="you">').append(txt3,txt4));
          }
          // if(data.username == msgTo){
          //   $('#messages').prepend($('<li>').append(txt3,txt4)).css({"float":"left"});
          // }
          msgCount++;

        }//end of for.
        console.log(msgCount);
      }
      else {
        $('#noChat').show(); //displaying no more chats message.
        noChat = 1; //to prevent unnecessary scroll event.
      }
      //hiding loading bar.
      $('#loading').hide();

      //setting scrollbar position while first 5 chats loads.
      if(msgCount <= 5){
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
      }
    }//end of outer if.

  }); // end of listening old-chats event.

  // // keyup handler.
  // $('#myMsg').keyup(function(){
  //   if($('#myMsg').val()){
  //     $('#sendBtn').show(); //showing send button.
  //     socket.emit('typing');
  //   }
  //   else{
  //     $('#sendBtn').hide(); //hiding send button to prevent sending empty messages.
  //   }
  // }); //end of keyup handler.

  //receiving typing message.
  socket.on('typing',function(msg){
    var setTime;
    //clearing previous setTimeout function.
    clearTimeout(setTime);
    //showing typing message.
    $('#typing').text(msg);
    //showing typing message only for few seconds.
    setTime = setTimeout(function(){
      $('#typing').text("");
    },3500);
  }); //end of typing event.

 

  //receiving messages.
  socket.on('chat-msg',function(data){
    //styling of chat message.
    var chatDate = moment(data.date).format("MMMM Do YYYY, hh:mm:ss a");
    var txt1 = $('<span></span>').text(data.msgFrom+" : ").css({"color":"black"});
    var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
    var txt3 = $('<p></p>').append(txt1,txt2);
    var txt4 = $('<p></p>').text(data.msg).css({"color":"#000000"});
    //showing chat in chat box.
    if(data.msgFrom == username){
      $('#messages').append($('<li id="me">').append(txt3,txt4));
    }
    else{
      $('#messages').append($('<li id="you">').append(txt3,txt4));
    }
      msgCount++;
      console.log(msgCount);
      $('#typing').text("");
      $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
  }); //end of receiving messages.

  //add group name
  $('#addGroup').submit(function(){
    var nameGroup = $('#nameGroup').val();
    socket.emit('add-group',{name:$('#nameGroup').val(), admin: username});
    alert("Add Group Successfully");
    $('#nameGroup').val("");
    return false;
  });
  // socket.on('add-group', function(data){
  //   alert('toantqt');
  // })


  //chang profile event
  $('#change').submit(function(){
    alert("Update Profile successfully. Plese Login");
  });

  $("#myMsg").emojioneArea({
    placeholder: "Type some thing",
    events: {
      keyup: function(editor, event){
        $('#myMsg').val(this.getText());
        if(event.which == 13){
          $("#chatForm").submit();
           $("#myMsg").data("emojioneArea").setText("");
        }
        if(this.getText()){
          $("#sendBtn").show();
          socket.emit('typing');
        }
        else{
          $("#sendBtn").hide();
        }
      }
    }
  });

   //sending message.
   $('#chatForm').on('submit', function(){
    socket.emit('chat-msg',{msg:$('#myMsg').val(),msgTo:toUser,date:Date.now()});
   
    return false;
  }); //end of sending message.
  // $(".emojionearea").unbind("keyup").on("keyup", function(e){
  //   if(e.which == 13){
  //     alert("hello");
  //   }
  // })
  //on disconnect event.
  //passing data on connection.
  socket.on('disconnect',function(){


    //showing and hiding relevant information.
    $('#list').empty();
    $('#messages').empty();
    $('#typing').text("");
    $('#frndName').text("Disconnected..");
    $('#loading').hide();
    $('#noChat').hide();
    $('#initMsg').show().text("...Please, Refresh Your Page...");
    $('#chatForm').hide();
    msgCount = 0;
    noChat = 0;
  });//end of connect event.

  
    
});//end of function.