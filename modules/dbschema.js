var mongoose = require('mongoose');
mongoose.connect('mongodb://tasker:'+process.env.MONGO+'@127.0.0.1/tasker', {useNewUrlParser: true, useUnifiedTopology: true});

var recordingsSchema = new mongoose.Schema({
	_id: String,
   date: Date,  
   comment : String,
	// sync: Boolean,
   blob_encoded: String,
	transcript_id: String,
	transcription: String
});

module.exports = {
   Recordings : mongoose.model('Recordings', recordingsSchema),
};
