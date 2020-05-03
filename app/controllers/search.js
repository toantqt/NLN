const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
var async = require('async');
const userModel = mongoose.model("User");
module.exports.controller = function(app){
    //router for search
    app.get('/search', function(req, res){
        var sent =[];
        var friends= [];
        var received= [];
        username = req.session.user.username;
        received= req.session.user.request;
        sent= req.session.user.sentRequest;
        friends= req.session.user.friendsList;
        

        userModel.find({username: {$ne: req.session.user.username}}, function(err, result){
            if (err) throw err;
            
            res.render('search',{
                result: result,
                username: username,
                sent: sent,
                friends: friends,
				received: received,
            });
        });
    });

    app.post('/search', function(req, res){
        var searchFriend = req.body.searchfriend;
        console.log(searchFriend);
        if(searchFriend) {
            var mssg= 'No name';
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
       async.parallel([
		function(callback) {
			if(req.body.receiverName) {
					userModel.update({
						'username': req.body.receiverName,
						'request.userId': {$ne: req.session.user._id},
						'friendsList.friendId': {$ne: req.session.user._id}
					}, 
					{
						$push: {request: {
						userId: req.session.user._id,
						username: req.session.user.username
						}},
						$inc: {totalRequest: 1}
						},(err, count) =>  {
							console.log(err);
							callback(err, count);
						})
			}
		},
		function(callback) {
			if(req.body.receiverName){
					userModel.update({
						'username': req.session.user.username,
						'sentRequest.username': {$ne: req.body.receiverName}
					},
					{
						$push: {sentRequest: {
						username: req.body.receiverName
						}}
						},(err, count) => {
						callback(err, count);
						})
			}
		}],
	(err, results)=>{
		res.redirect('/chat');
	});

			async.parallel([
				// this function is updated for the receiver of the friend request when it is accepted
				function(callback) {
					if (req.body.senderId) {
						userModel.update({
							'_id': req.session.user._id,
							'friendsList.friendId': {$ne:req.body.senderId}
						},{
							$push: {friendsList: {
								friendId: req.body.senderId,
								friendName: req.body.senderName
							}},
							$pull: {request: {
								userId: req.body.senderId,
								username: req.body.senderName
							}},
							$inc: {totalRequest: -1}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				// this function is updated for the sender of the friend request when it is accepted by the receiver	
				function(callback) {
					if (req.body.senderId) {
						userModel.update({
							'_id': req.body.senderId,
							'friendsList.friendId': {$ne:req.session.user._id}
						},{
							$push: {friendsList: {
								friendId: req.session.user._id,
								friendName: req.session.user.username
							}},
							$pull: {sentRequest: {
								username: req.session.user.username
							}}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				function(callback) {
					if (req.body.user_Id) {
						userModel.update({
							'_id': req.session.user._id,
							'request.userId': {$eq: req.body.user_Id}
						},{
							$pull: {request: {
								userId: req.body.user_Id
							}},
							$inc: {totalRequest: -1}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				},
				function(callback) {
					if (req.body.user_Id) {
						userModel.update({
							'_id': req.body.user_Id,
							'sentRequest.username': {$eq: req.session.user.username}
						},{
							$pull: {sentRequest: {
								username: req.session.user.username
							}}
						}, (err, count)=> {
							callback(err, count);
						});
					}
				} 		
			],(err, results)=> {
				res.redirect('/chat');
			});
    })
}