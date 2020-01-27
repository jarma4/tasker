const express = require('express'),
   bodyParser = require('body-parser'),
   compression = require('compression'),
   globals = require('./globals');

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

router.get('/api/vpnstatus', (req,res) => {
   // res.send({'type':'success', 'message': globals.vpnStatus.vpn && globals.vpnStatus.network});
   res.json(globals.vpnStatus)
});

router.get('/api/checkinstatus', (req,res) => {
   // res.send({'type':'success', 'message': globals.vpnStatus.network});
   res.json(globals.checkinStatus);
});
