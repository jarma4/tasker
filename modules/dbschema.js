var mongoose = require('mongoose');

var recordingsSchema = new mongoose.Schema({
   date: Date,  //really username
   comment : String,
   blob: Blob
});



module.exports = {
   Recordings : mongoose.model('Recordings', recordingsSchema),
};
