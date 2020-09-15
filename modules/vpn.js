const globals = require('./globals');

module.exports = async function () {
   // latte crontab script checks status and logs in file every 10 minutes; hopefully this take a little longer to check if on 10 minutes
   globals.fs.readFile('results/testvpn_status.json', (err, data) => {
		if (data) {
			const vpnStatus = JSON.parse(data);
			if ((Date.now() - (new Date(vpnStatus.date)) > 1000*60*30) || !(vpnStatus.vpn)) {
				const err_message = 'VPN down or late report, check on it';
				console.log(err_message, vpnStatus);
				globals.logger.error(new Date().toLocaleString(), err_message);
				globals.telnyx.messages.create({
					'from': process.env.TEXTFROM, // Your Telnyx number
					'to': process.env.TEXTTO,
					'text': err_message
				});
			}
		}
   });
}