const socketio = require("socket.io");
const mongoose = require("mongoose");
const events = require("events");
const _ = require("lodash");
const eventEmitter = new events.EventEmitter();

//adding db models
require("../app/models/user.js");
require("../app/models/chat.js");
require("../app/models/room.js");
require("../app/models/group.js");

//using mongoose Schema models
const userModel = mongoose.model("User");
const chatModel = mongoose.model("Chat");
const roomModel = mongoose.model("Room");
const groupModel = mongoose.model("Group");

//reatime magic begins here
module.exports.sockets = function(http) {
  io = socketio.listen(http);

  //setting chat route
  const ioChat = io.of("/chat");
  const userStack = {};
  const groupStack = {};
  const adminStack = {};
  const roomStack = {};
  let oldChats, sendUserStack, sendGroupStack, setRoom;
  const userSocket = {};

  //socket.io magic starts here
  ioChat.on("connection", function(socket) {
    console.log("socketio chat connected.");

    //function to get user name
    socket.on("set-user-data", function(username) {
      console.log(username + "  logged In");

      //storing variable.
      socket.username = username;
      userSocket[socket.username] = socket.id;

      socket.broadcast.emit("broadcast", {
        description: username + " Logged In"
      });

      //getting all users list
      eventEmitter.emit("get-all-users");

      //getting all group list
      eventEmitter.emit("get-all-group");

      //get admin group
      eventEmitter.emit("get-admin");

      //get room(name, member)
      eventEmitter.emit("get-group-data");

      //sending all users list. and setting if online or offline.
      sendUserStack = function() {
        for (i in userSocket) {
          for (j in userStack) {
            if (j == i) {
              userStack[j] = "Online";
            }
          }
        }
        // console.log(userStack);
        //for popping connection message.
        ioChat.emit("onlineStack", {userStack: userStack, groupStack: groupStack, adminStack: adminStack, roomStack: roomStack});
      }; //end of sendUserStack function.

      //sending group stack
    }); //end of set-user-data event.

    //sending group stack
    
  

    //setting room.
    socket.on("set-room", function(room) {
      //leaving room.
      socket.leave(socket.room);
      //getting room data.
      eventEmitter.emit("get-room-data", room);
      //setting room and join.
      setRoom = function(roomId) {
        socket.room = roomId;
        console.log("roomId : " + socket.room);
        socket.join(socket.room);
        ioChat.to(userSocket[socket.username]).emit("set-room", socket.room);
      };
    }); //end of set-room event.

    //emits event to read old-chats-init from database.
    socket.on("old-chats-init", function(data) {
      eventEmitter.emit("read-chat", data);
    });

    //emits event to read old chats from database.
    socket.on("old-chats", function(data) {
      eventEmitter.emit("read-chat", data);
    });

    //sending old chats to client.
    oldChats = function(result, username, room) {
      ioChat.to(userSocket[username]).emit("old-chats", {
        result: result,
        room: room
      });
    };

    //showing msg on typing.
    socket.on("typing", function() {
      socket
        .to(socket.room)
        .broadcast.emit("typing", socket.username + " : is typing...");
    });

    //for showing chats.
    socket.on("chat-msg", function(data) {
      //emits event to save chat to database.
      eventEmitter.emit("save-chat", {
        msgFrom: socket.username,
        msgTo: data.msgTo,
        msg: data.msg,
        room: socket.room,
        date: data.date
      });
      //emits event to send chat msg to all clients.
      ioChat.to(socket.room).emit("chat-msg", {
        msgFrom: socket.username,
        msg: data.msg,
        date: data.date
      });
    });

    //add group name
    socket.on("add-group", function(data){
      console.log(data.name);
      //console.log(data.password);
      eventEmitter.emit("save-group", {
        nameGroup: data.name,
        admin: data.admin
        //password: data.password
      });
    });

    //add member to group
    socket.on("add-member", function(data){
      eventEmitter.emit("save-member", {nameMember: data.name, room: data.room});
    });
    
    //delete member
    socket.on("delete-member", function(data){
      eventEmitter.emit("remove-member", {nameMember: data.name});
    })


    //for popping disconnection message.
    socket.on("disconnect", function() {
      console.log(socket.username + "  logged out");
      socket.broadcast.emit("broadcast", {
        description: socket.username + " Logged out"
      });

      console.log("chat disconnected.");

      _.unset(userSocket, socket.username);
      userStack[socket.username] = "Offline";

      ioChat.emit("onlineStack", userStack);
    }); //end of disconnect event.
  }); //end of io.on(connection).
  //end of socket.io code for chat feature.

  //database operations are kept outside of socket.io code.
  //saving chats to database.
  eventEmitter.on("save-chat", function(data) {
    // var today = Date.now();

    var newChat = new chatModel({
      msgFrom: data.msgFrom,
      msgTo: data.msgTo,
      msg: data.msg,
      room: data.room,
      createdOn: data.date
    });

    newChat.save(function(err, result) {
      if (err) {
        console.log("Error : " + err);
      } else if (result == undefined || result == null || result == "") {
        console.log("Chat Is Not Saved.");
      } else {
        console.log("Chat Saved.");
        //console.log(result);
      }
    });
  }); //end of saving chat.

  //save Group
  eventEmitter.on("save-group", function(data){
      var newGroup = new groupModel({
        name: data.nameGroup,
        admin: data.admin
      });
      //save
      newGroup.save(function(err, result){
        if(err){
          console.log("Error : " + err);
        }
        else if (result == undefined || result == null || result == "") {
          console.log("Group Is Not Saved.");
        } else {
          console.log("Group Saved.");
          //console.log(result);
        }
      });
  }); 

  //save member
  eventEmitter.on('save-member', function(data){
    console.log(data.nameMember);
    groupModel.updateOne({
        'name': data.room
      },{
        $push: {member: {memberName: data.nameMember}} 
        }, (err, count) => {
          console.log(err);
        });
  })

  

  //get room and member
  eventEmitter.on("get-group-data",function(data) {
    
    groupModel.find({}).select("member").exec(function(err,result){
      if(err){
        console.log(err);
      }
      else{
        console.log(result.length);
        for(var i=0; i< result.length; i++){
          console.log(result[0].member.length);
          for(var i=0; i< result[0].member.length; i++){
            roomStack[result[0].member[i].memberName] = 'Ofline';
          }
        }
       console.log(roomStack);
      }
    })
  })

  //delete member
  eventEmitter.on("remove-member", function(data){
    console.log(data.nameMember);
    groupModel.updateOne({
      'name': 'Phong 1'
    }, {
      $pull: {member: {memberName: data.nameMember}}
    }, (err, count) => {
      console.log(err);
    });
  });
  //reading chat from database.
  eventEmitter.on("read-chat", function(data) {
    chatModel
      .find({})
      .where("room")
      .equals(data.room)
      .sort("-createdOn")
      .skip(data.msgCount)
      .lean()
      .limit(5)
      .exec(function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //calling function which emits event to client to show chats.
          oldChats(result, data.username, data.room);
        }
      });
  }); //end of reading chat from database.

  //listening for get-all-users event. creating list of all users.
  eventEmitter.on("get-all-users", function() {
    userModel
      .find({})
      .select("username")
      .exec(function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //console.log(result);
          for (var i = 0; i < result.length; i++) {
            userStack[result[i].username] = "Offline";
          }
          //console.log("stack "+Object.keys(userStack));
          sendUserStack();
        }
      });
  }); //end of get-all-users event.

  //get all group
  eventEmitter.on("get-all-group", function(){
    groupModel
      .find({})
      .select("name")
      .exec(function(err, result){
        if(err){
          console.log("Error :" + err);
        }
        else{
          
          for (var i = 0; i < result.length; i++) {
            groupStack[result[i].name] = "Offline";
            // console.log(result[i].name);
          }
           console.log(groupStack);
          
          // ioChat.emit("all-group", groupStack);
        }
      });
  });

  //get admin group
  eventEmitter.on("get-admin", function(){
    groupModel
      .find({})
      .exec(function(err, result){
        if(err){
          console.log("Error :" + err);
        }
        else{
          
          for (var i = 0; i < result.length; i++) {
            adminStack[result[i].admin] = "Offline";
            // console.log(result[i].name);
          }
           console.log(adminStack);
           
          
          // ioChat.emit("all-group", groupStack);
        }
      });
  });

  //listening get-room-data event.
  eventEmitter.on("get-room-data", function(room) {
    roomModel.find(
      {
        $or: [
          {
            name1: room.name1
          },
          {
            name1: room.name2
          },
          {
            name2: room.name1
          },
          {
            name2: room.name2
          }
        ]
      },
      function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          if (result == "" || result == undefined || result == null) {
            var today = Date.now();

            newRoom = new roomModel({
              name1: room.name1,
              name2: room.name2,
              lastActive: today,
              createdOn: today
            });

            newRoom.save(function(err, newResult) {
              if (err) {
                console.log("Error : " + err);
              } else if (
                newResult == "" ||
                newResult == undefined ||
                newResult == null
              ) {
                console.log("Some Error Occured During Room Creation.");
              } else {
                setRoom(newResult._id); //calling setRoom function.
              }
            }); //end of saving room.
          } else {
            var jresult = JSON.parse(JSON.stringify(result));
            setRoom(jresult[0]._id); //calling setRoom function.
          }
        } //end of else.
      }
    ); //end of find room.
  }); //end of get-room-data listener.
  //end of database operations for chat feature.

  //
  //

  //to verify for unique username and email at signup.
  //socket namespace for signup.
  const ioSignup = io.of("/signup");

  let checkUname, checkEmail; //declaring variables for function.

  ioSignup.on("connection", function(socket) {
    console.log("signup connected.");

    //verifying unique username.
    socket.on("checkUname", function(uname) {
      eventEmitter.emit("findUsername", uname); //event to perform database operation.
    }); //end of checkUname event.

    //function to emit event for checkUname.
    checkUname = function(data) {
      ioSignup.to(socket.id).emit("checkUname", data); //data can have only 1 or 0 value.
    }; //end of checkUsername function.

    //verifying unique email.
    socket.on("checkEmail", function(email) {
      eventEmitter.emit("findEmail", email); //event to perform database operation.
    }); //end of checkEmail event.

    //function to emit event for checkEmail.
    checkEmail = function(data) {
      ioSignup.to(socket.id).emit("checkEmail", data); //data can have only 1 or 0 value.
    }; //end of checkEmail function.

    //on disconnection.
    socket.on("disconnect", function() {
      console.log("signup disconnected.");
    });
  }); //end of ioSignup connection event.

  //database operations are kept outside of socket.io code.
  //event to find and check username.
  eventEmitter.on("findUsername", function(uname) {
    userModel.find(
      {
        username: uname
      },
      function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //console.log(result);
          if (result == "") {
            checkUname(1); //send 1 if username not found.
          } else {
            checkUname(0); //send 0 if username found.
          }
        }
      }
    );
  }); //end of findUsername event.

  //event to find and check username.
  eventEmitter.on("findEmail", function(email) {
    userModel.find(
      {
        email: email
      },
      function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //console.log(result);
          if (result == "") {
            checkEmail(1); //send 1 if email not found.
          } else {
            checkEmail(0); //send 0 if email found.
          }
        }
      }
    );
  }); //end of findUsername event.

  //
  //

  return io;
};
