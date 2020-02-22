const express = require('express'),
   bodyParser = require('body-parser'),
   compression = require('compression'),
   fs = require('fs'),
   getDeviceScreenshot = require('../modules/screenshot');

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

app.listen(8082, function(){
   console.log('redirecting on port 8082');
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
   }
});

router.get('/api/getinfo', (req,res) => {
   const data = {
      vpnStatus : JSON.parse(fs.readFileSync('./results/testvpn_status.json')),
      checkinStatus : JSON.parse(fs.readFileSync('./results/checkin_status.json')),
      snapshotDate : fs.statSync('./public/images/latest.png').mtime };
   res.send(data);
});
