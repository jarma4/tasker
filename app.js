const fs = require('fs'),
	logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
   crontab = require('node-crontab'),
   puppeteer = require('puppeteer'),
   exec = require('child_process').exec;
   // mongoose = require('mongoose');

require('dotenv').config()
const telnyx = require('telnyx')(process.env.TELNYX);
// mongoose.connect('mongodb://baf:'+process.env.MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

console.log('-- Starting Tasker ');
const globals = require('./modules/globals');
const app = require('./modules/http'); // startup express

function checkVpn () {
   // latte crontab script checks status and logs in file every 10 minutes; hopefully this take a little longer to check if on 10 minutes
   fs.readFile('json/testvpn_status.json', (err, data) => {
      const vpnStatus = JSON.parse(data);
      if ((Date.now() - (new Date(vpnStatus.date)) > 1000*60*30) || !(vpnStatus.vpn && vpnStatus.network)) {
         const err_message = 'VPN down or late report, check on it';
         console.log(err_message);
         logger.error(Date.now().toLocaleString(), err_message);
         telnyx.messages.create({
            'from': process.env.TEXTFROM, // Your Telnyx number
            'to': process.env.TEXTTO,
            'text': err_message
         });
      }
   });
}

async function checkin() {
   console.log('* ', Date.now().toLocaleString());
   console.log('- loading browser ...');
	// const browser = await puppeteer.launch({headless: false});
	const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.setViewport({ width: 1280, height: 1024});

   console.log('- logging in ...');
   let url = "https://www.banggood.com/login.html";
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
   logger.info(Date.now().toLocaleString(), `: checkin pts=${points}`);
   let success = fs.writeFileSync('json/checkin_status.json',JSON.stringify({"date" : Date.now().toLocaleString(), "points" : points}))

   await page.click('.checkin-btn');

   console.log('- done ');
   await browser.close();
	return;
}

// Here jobs are scheduled
const vpnCron = crontab.scheduleJob("*/10 7-23 * * *", checkVpn);
const checkinCron = crontab.scheduleJob("0 7 * * *", checkin);



// var cmd = exec('mongodump -dbaf -ubaf -p'+process.env.BAF_MONGO+' -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
// });
// let success = fs.writeFileSync('../status/json/checkin_status.json', JSON.stringify({"date" : Date.now(), "points" : points}));
