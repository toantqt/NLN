const express = require("express");
const mongoose = require("mongoose");
const formidable = require('formidable');
const path = require('path');

const router = express.Router();

const userModel = mongoose.model("User");
const auth = require("../../middlewares/auth.js");

module.exports.controller = function(app){
    // app.get('/profile', auth.checkLogin, (req, res) => {
    //     res.render('profile', {
    //         user: req.session.user
    //     });
    // });
    app.post('/profile', function(req, res){
        var form =new formidable.IncomingForm();
        form.parse(req);
        let reqPath= path.join(__dirname, '../');
        let newfilename;
        form.on('fileBegin', function(name, file){
            file.path = reqPath+ '../public/upload/'+ req.session.user.username + file.name;
            newfilename= req.session.user.username+ file.name;
        });
        form.on('file', function(name, file) {
            userModel.findOneAndUpdate({
                username: req.session.user.username
            },
            {
                'userImage': newfilename
            },
            function(err, result){
                if(err) {
                    console.log(err);
                }
            });
        });
        //req.flash('success_msg', 'Your profile picture has been uploaded');
        res.redirect('/chat');
    })

    // app.post('/profile', (req, res) => {
    //     var form =new formidable.IncomingForm();
    //     form.parse(req);
    //     let reqPath= path.join(__dirname, '../');
    //     console.log("link ", reqPath);
    //     let newfilename;
    //     console.log(req.session.user.username);
    //     form.on('fileBegin', function(name, file){
    //         file.path = reqPath+ '../public/upload/'+ file.name;
    //         newfilename= req.session.user.username + file.name;
    //     });
    //     form.on('file', function(name, file) {
    //         userModel.findOneAndUpdate({
    //             username: req.session.user.username
    //         },
    //         {
    //             'userImage': newfilename
    //         },
    //         function(err, result){
    //             if(err) {
    //                 console.log(err);
    //             }
    //             console.log('update success!');
    //         });
    //     });
    //     //req.flash('success_msg', 'Your profile picture has been uploaded');
    //     res.redirect('/profile');
    //     })


    app.use(router);
}