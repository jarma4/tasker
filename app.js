const crontab = require('node-crontab');
   // exec = require('child_process').exec;
   // mongoose = require('mongoose');

require('dotenv').config();

// mongoose.connect('mongodb://baf:'+process.env.MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

console.log('-- Starting Tasker ');
// const globals = require('./modules/globals');
const app = require('./modules/http'); // startup express
const checkVpn = require('./modules/vpn');
const voice = require('./modules/voice');
//const checkin = require('./modules/checkin');
const getDeviceScreenshot = require('./modules/screenshot');

// Here jobs are scheduled
const vpnCron = crontab.scheduleJob("*/10 7-23 * * *", checkVpn);
// const checkinCron = crontab.scheduleJob("15 10 * * *", checkin);
const devicesCron = crontab.scheduleJob("*/15 1 0,1 * * *", getDeviceScreenshot);



// var cmd = exec('mongodump -dbaf -ubaf -p'+process.env.BAF_MONGO+' -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
// });
// let success = fs.writeFileSync('../status/json/checkin_status.json', JSON.stringify({"date" : Date.now(), "points" : points}));
