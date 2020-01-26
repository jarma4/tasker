const fs = require('fs'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
   crontab = require('node-crontab'),
   puppeteer = require('puppeteer'),
   exec = require('child_process').exec,
   mongoose = require('mongoose');

require('dotenv').config()
const telnyx = require('telnyx')(process.env.TELNYX);
mongoose.connect('mongodb://baf:'+process.env.MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

const app = require('./http');

let checkinStatus = {}, vpnFailCounter = 0;

function checkVpn () {
   // pi crontab script checks status and logs in file
   let vpnStatus = JSON.parse(fs.readFileSync('json/testvpn_status.json'));
   if (!(vpnStatus.vpn && vpnStatus.network)) {
      logger.error(new Date().toLocaleString(), ': VPN down, check on it');
      if (++vpnFailCounter > 1) { //only send text every 30min
         telnyx.messages.create({
            'from': process.env.TEXTFROM, // Your Telnyx number
            'to': process.env.TEXTTO,
            'text': 'VPN down, check on it'
         }).then(function(response){
            vpnFailCounter = 0;
         });
      }
   }
}

async function checkin() {
   console.log('* ', new Date().toLocaleString());
   console.log('- loading browser ...');
	// const browser = await puppeteer.launch({headless: false});
	const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.setViewport({ width: 1280, height: 1024});

   console.log('- logging in ...');
   let url = "https://www.banggood.com/login.html"
	await page.goto(url);
   await page.type('#login-email', process.env.BANG_USER);
   await page.type('#login-pwd', process.env.BANG_PASS);
   await page.click('#login-submit');
   await page.waitForNavigation();

   console.log('- checking in ...');
   url = "https://www.banggood.com/pointsmall.html"
	await page.goto(url);
   
   let points = await page.evaluate(() => document.querySelector('.mp').textContent);
   console.log(`- before points = ${points}`);
   logger.info(new Date().toLocaleString(), `: checkin pts=${points}`);
   checkinStatus = {"date" : new Date(), "points" : points};

   await page.click('.checkin-btn');

   console.log('- done ');
   await browser.close();
	return;
}

function sendDailyReport() {
   // TBD
}

console.log('-- Starting scheduler ');
// Here jobs are scheduled
const vpnCron = crontab.scheduleJob("*/15 * * * *", checkVpn);
const checkinCron = crontab.scheduleJob("0 7 * * *", checkin);

//const dailyCron = crontab.scheduleJob("*/15 * * * *", sendDailyReport);




// var cmd = exec('mongodump -dbaf -ubaf -p'+process.env.BAF_MONGO+' -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
// });
// let success = fs.writeFileSync('../status/json/checkin_status.json', JSON.stringify({"date" : new Date(), "points" : points}));
