const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  userId: { type: String, default: "", required: true },
  username: { type: String, default: "", required: true },
  email: { type: String, default: "", required: true },
  password: { type: String, default: "", required: true },
  userImage: {
	type: String,
	default: 'torres.jpg'
  },
  sentRequest:[{
		username: {type: String, default: ''}
	}],
	request: [{
		userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		username: {type: String, default: ''}
	}],
	friendsList: [{
		friendId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		friendName: {type: String, default: ''},
	}],
	totalRequest: {type: Number, default:0},
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
});
mongoose.model("User", userSchema);
