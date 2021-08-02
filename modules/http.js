const https = require('https');
const express = require('express');
const compression = require('compression');
const	fs = require('fs');
const getDeviceScreenshot = require('./screenshot');
const {Recordings} = require('./dbschema');	
const {GoogleSpreadsheet} = require('google-spreadsheet');

// http site
const redirect = express();
redirect.use(compression());
redirect.get('*', function(req, res){
	// res.sendfile('./public/react.html');
   res.redirect(301, 'https://2dollarbets.com:8082');
});
redirect.listen(8083, function(){
   console.log('http redirecting on port 8083 to https on 8082');
});

const app = express(); 
const router = express.Router();
module.exports = app;

app.use(compression());
app.use(express.json());
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));
// app.use('/js', express.static(__dirname + '../public/js'));
app.use('/', router);

const options = {
   cert: fs.readFileSync('./sslcert/fullchain.pem'),
	key: fs.readFileSync('./sslcert/privkey.pem')
};

https.createServer(options, app).listen(8082, function(){
   console.log('https on port 8082');
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

router.get('/api/voiceinfo', (req,res) => {
	Recordings.find({},{_id: 1},(err, recs)=>{
		if (err){
			console.log(err);
		} else {
			res.send({
				vpnStatus : JSON.parse(fs.readFileSync('./results/testvpn_status.json')),
				// checkinStatus : JSON.parse(fs.readFileSync('./results/checkin_status.json')),
				snapshotDate : fs.statSync('./public/images/latest.png').mtime,
				stockStatus : JSON.parse(fs.readFileSync('./results/stock.json')),
				recordings: recs
			});
		}
	});
});

router.post('/api/voicesync', (req,res) => {
	console.log('sync')
	req.body.recordings.forEach(record => {
		Recordings.findById(record._id, (err, found) => {
			if(err) {
				console.log(`Error finding sync _id: ${err}`);
			} 
			if (found) {
				Recordings.updateOne({_id: record._id}, record, err => {
					console.log(`${record._id} updated`);
				});
			} else {
				new Recordings(record).save(err => {
					if (err) {
						console.log(`Error saving recording: ${err}`);
					} else {
						console.log(`Recording saved ${record._id}`);
					}
				});
			}
		});
	});
	res.send({good: true});
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
