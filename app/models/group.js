const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const groupSchema = new Schema({
    name: { type: String, require: true},
    admin: { type: String, require: true},
    member: [{
        memberName: {type: String, default: ''}
    }]
});

mongoose.model("Group", groupSchema);