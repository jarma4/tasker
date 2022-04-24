require('dotenv').config();
const fs = require('fs');
const { Recordings } = require('../modules/dbschema');
const readline = require('readline');
const axios = require("axios");

const message = axios.create({
	baseURL: "https://api.assemblyai.com/v2",
	headers: {
		 "authorization": process.env.ASSEMBLYAI,
		 "content-type": "application/json",
		//  "transfer-encoding": "chunked"
	},
});

function checkStatus(id){
	message.get(`/transcript/${id}`)
	.then((res) => {
		console.log(`ID: ${id} Status: ${res.data.status} Text: ${res.data.text}`);
		rl.question('Recheck status(y/n)? ', answer => {
			if (answer == 'y') {
				checkStatus(id);
			} else {
				process.exit(1);
			}
		});
	})
	.catch((err) => console.error(err));
}

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});
Recordings.find({}, (err, recordings) => {
	console.log('Current stored recordings:')
	recordings.forEach((recording, index) => {
		console.log(`${index} - ${recording.comment}`);
	});
	rl.question('Which recording do you want to work with? ', answer => {
		rl.question('Do you want to transcribe(y/n)?', answer2 => {
			let blob = new Buffer.from(recordings[answer].blob_encoded.slice(23), 'base64');
			fs.writeFileSync('./public/recording.ogg', blob);
			console.log(`recording.ogg written`);
			if (answer2 == 'y') {
				message.post("/transcript", {audio_url: "https://2dollarbets.com:8082/recording.ogg"})
				.then((res) => {
					checkStatus(res.data.id);
				})
				.catch((err) => console.error('Error: '+err));
			} else{
				process.exit(1);
			}
		});
	});
});


  
