const fs = require('fs');

module.exports = {
	fs : fs,
	logger : require('pino')({}, fs.createWriteStream('./results/log.json', {'flags': 'a'})),
	puppeteer : require('puppeteer'),
	telnyx : require('telnyx')(process.env.TELNYX)
};