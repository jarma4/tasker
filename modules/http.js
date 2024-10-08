const https = require('https');
const express = require('express');
const compression = require('compression');
const	fs = require('fs');
const getDeviceScreenshot = require('./screenshot');
const {Recordings} = require('./dbschema');	
const {GoogleSpreadsheet} = require('google-spreadsheet');
const axios = require("axios");

// http site
// const redirect = express();
// redirect.use(compression());
// redirect.get('*', function(req, res){
// 	// res.sendfile('./public/react.html');
//    res.redirect(301, 'https://2dollarbets.com:8082');
// });
// redirect.listen(8083, '192.168.1.200', function(){
//    console.log('http redirecting on port 8083 to https on 8082');
// });

const app = express(); 
const router = express.Router();
module.exports = app;


app.use(compression());
app.use(express.json());
app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
// app.use('/js', express.static(__dirname + '../public/js'));
app.use('/', router);

const options = {
   cert: fs.readFileSync('./sslcert/fullchain.pem'),
	key: fs.readFileSync('./sslcert/privkey.pem')
};

https.createServer(options, app).listen(8082, '192.168.1.200', function(){
   console.log('https on port 8082');
});

const message = axios.create({
	baseURL: "https://api.assemblyai.com/v2",
	headers: {
		 "authorization": process.env.ASSEMBLYAI,
		 "content-type": "application/json",
		//  "transfer-encoding": "chunked"
	},
});

router.get('/', (req,res) => {
	res.render('home', {pagename:'home'});
});

router.post('/api/action', (req,res) => {
   switch (req.body.action) {
		case 'snapshot': {
         getDeviceScreenshot();
         res.send({'message':'success'});
		}
		case 'getquote': {
			getQuote(req.body.stock).then((result)=>{
				res.send({'message': result});
			});
		}
   }
});

router.get('/api/voiceinfo', async (req,res) => {
	try{
		const recs = await Recordings.find({_id: 1, transcription: 1});
		res.send({
			vpnStatus : JSON.parse(fs.readFileSync('./results/testvpn_status.json')),
			// checkinStatus : JSON.parse(fs.readFileSync('./results/checkin_status.json')),
			snapshotDate : fs.statSync('./public/images/latest.png').mtime,
			stockStatus : JSON.parse(fs.readFileSync('./results/stock.json')),
			recordings: recs
		});
	} catch {
		console.log(err);
	}
});

let transcript = {};

function getTranscript(id, blob){
	return new Promise((resolve, reject)=>{
		fs.writeFileSync('./public/'+id+'.ogg', new Buffer.from(blob, 'base64'));	
		message.post("/transcript", {audio_url: 'https://2dollarbets.com:8082/'+id+'.ogg', webhook_url: "https://2dollarbets.com:8082/api/transcribe/"+id})
		.then(retData => {
			console.log(retData);
			resolve(retData.data);
		})
		.catch(err => {
			console.error(err);
			reject();
		});
	});
}

router.post('/api/starttranscript', (req,res) => {
	const id = Math.round(Math.random()*1e8); // random index to connect sound file and transcription coming later
	transcript[id] = 'pending';
	fs.writeFileSync('./public/'+id+'.ogg', new Buffer.from(req.body.blob_encoded.slice(23), 'base64'));	
	message.post("/transcript", {audio_url: 'https://2dollarbets.com:8082/'+id+'.ogg', webhook_url: "https://2dollarbets.com:8082/api/transcribe/"+id})
	.then(retData => {
		res.send({'id': id});  // client will ask for transcription later
	})
	.catch(err => console.error(err));
});

router.post('/api/gettranscript', (req,res) => {
	// let retries = 0;
	// while(transcript[req.body.transcript_id] == undefined && retries < 10){
	// 	setTimeout(()=>{
	// 		console.log('waiting');
	// 		retries++;
	// 	}, 2000);
	// }
	res.send({text: transcript[req.body.id]});	
});

router.post('/api/transcribe/*', (req,res) => {
	res.sendStatus(200); // have to send or assemblyai will repeat webhook x10
	if (req.body.status != 'error') {
		message.get(`/transcript/${req.body.transcript_id}`) // get transcribed text
		.then(retData=> {
			transcript[req.params[0]] = retData.data.text;
			fs.unlinkSync('./public/'+req.params[0]+'.ogg');
		})
		.catch((err) => {
			console.error('Error: '+err);
			fs.unlinkSync('./public/'+req.params[0]+'.ogg');
		});
	} else {
		console.log(`Error in webhook for transcript_id ${req.body.transcript_id}`);
	}
});

router.post('/api/voicesync', (req,res) => {
	req.body.recordings.forEach((record, index) => {
		Recordings.findById(record._id, (err, found) => {
			if(err) {
				console.log(`Error finding sync _id: ${err}`);
			} 
			if (found) {
				Recordings.updateOne({_id: record._id}, record, err => {
					console.log(`${record._id} updated`);
				});
			} else {
				getTranscript(record._id.slice(0,8), record.blob_encoded.slice(23))
				.then(retData => {
					record.transcript_id = retData;
					new Recordings(record).save(err => {
						if (err) {
							console.log(`Error saving recording: ${err}`);
						} else {
							console.log(`Recording saved ${record._id}`);
						}
					});

				});
			}
		});
	});
	res.send({status: 'ok'});
});

async function getQuote(stock){
   // spreadsheet key is the long id in the sheets URL
   const doc = new GoogleSpreadsheet('1JXQ_xrPRWGNQDTn3b1CEw6c5ReGWhrbCYAzMO8PCTls');
   
   await doc.useServiceAccountAuth(require('./credentials.json'));
   await doc.loadInfo(); // loads document properties and worksheets
     
   const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
	await sheet.loadCells('A1:B4')
	sheet.getCell(0,1).value = stock;
	await sheet.saveUpdatedCells();
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve (sheet.getCell(3,1).value);
		}, 5000);
	});
}
