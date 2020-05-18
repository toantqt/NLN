const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth.js");
//const userModel = mongoose.model("User");

module.exports.controller = function(app) {
  //route for chat
  app.get("/chat", auth.checkLogin, function(req, res) {
    var friends = [];
	  friends = req.session.user.friendsList;
    res.render("chat", {
      title: "Chat Home",
      user: req.session.user,
      chat: req.session.chat,
      newfriend: req.session.user.request,
      image: req.session.user.userImage
    });
  });

  app.use(router);
}; //Chat controller end.
