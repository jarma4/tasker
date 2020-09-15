const https = require('https'),
   express = require('express'),
   bodyParser = require('body-parser'),
   compression = require('compression'),
   fs = require('fs'),
	getDeviceScreenshot = require('../modules/screenshot');
	
const { GoogleSpreadsheet } = require('google-spreadsheet');

const app = express();
const router = express.Router();
module.exports = app;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

app.use(compression());
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

router.get('/api/getinfo', (req,res) => {
   const data = {
      vpnStatus : JSON.parse(fs.readFileSync('./results/testvpn_status.json')),
      checkinStatus : JSON.parse(fs.readFileSync('./results/checkin_status.json')),
		snapshotDate : fs.statSync('./public/images/latest.png').mtime,
      stockStatus : JSON.parse(fs.readFileSync('./results/stock.json')),
	 };
   res.send(data);
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
