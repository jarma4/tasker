var mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect(process.env.BAF_MONGO_URI)
.then(()=>{})
.catch(err=>{
	console.log(err);
});

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
