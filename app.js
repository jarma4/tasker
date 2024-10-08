const crontab = require('node-crontab');
	
process.loadEnvFile();

console.log('-- Starting Tasker ');
// const globals = require('./modules/globals');
const app = require('./modules/http'); // startup express
const checkVpn = require('./modules/vpn');
const getDeviceScreenshot = require('./modules/screenshot');
// const voice = require('./modules/voice');
//const checkin = require('./modules/checkin');

// Here jobs are scheduled
// const vpnCron = crontab.scheduleJob("*/6 7-23 * * *", checkVpn);
// const devicesCron = crontab.scheduleJob("*/15 1 0,1 * * *", getDeviceScreenshot);
// const checkinCron = crontab.scheduleJob("15 10 * * *", checkin);



// var cmd = exec('mongodump -dbaf -ubaf -p'+process.env.BAF_MONGO+' -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
// });
// let success = fs.writeFileSync('../status/json/checkin_status.json', JSON.stringify({"date" : Date.now(), "points" : points}));
