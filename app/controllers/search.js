const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const userModel = mongoose.model("User");
module.exports.controller = function(app){
    //router for search
    app.get('/search', function(req, res){
        var sent =[];
        var friends= [];
        var received= [];
        received= req.session.user.request;
        sent= req.session.user.sentRequest;
        friends= req.session.user.friendsList;
        

        userModel.find({username: {$ne: req.session.user.username}}, function(err, result){
            if (err) throw err;
            
            res.render('search',{
                result: result,
                sent: sent,
                friends: friends,
                received: received
            });
        });
    });

    app.post('/search', function(req, res){
        var searchFriend = req.body.searchfriend;
        console.log(searchFriend);
        if(searchFriend) {
            var mssg= '';
           if (searchFriend == req.session.user.username) {
               searchFriend = null;
           }
            userModel.find({username: searchFriend}, function(err, result) {
                if (err) throw err;
                    res.render('search', {
                    result: result,
                    mssg : mssg
                });
              });	
       }
    })
}