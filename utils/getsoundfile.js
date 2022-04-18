require('dotenv').config();
const fs = require('fs');
const { Recordings } = require('../modules/dbschema');
const readline = require('readline');

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});
// rl.setPrompt('> ');
// rl.prompt();
Recordings.find({}, (err, recordings) => {
	console.log('Current stored recordings:')
	recordings.forEach((recording, index) => {
		console.log(`${index} - ${recording.comment}`);
	});
	rl.question('Which recording do you want to download? ', answer => {
		fs.writeFileSync('./'+recordings[answer].comment+'.ogg', new Buffer.from(recordings[answer].blob_encoded.slice(23), 'base64'));
		console.log(`${recordings[answer].comment}.ogg written`);
		process.exit(1);
	});
});