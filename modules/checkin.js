const globals = require('./globals');

module.exports = async function () {
   console.log('* ', new Date().toLocaleString());
   console.log('- loading browser ...');
	// const browser = await puppeteer.launch({headless: false});
	const browser = await globals.puppeteer.launch();
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
   globals.logger.info(new Date().toLocaleString(), `: checkin pts=${points}`);
   let success = globals.fs.writeFileSync('results/checkin_status.json',JSON.stringify({"date" : new Date().toLocaleString(), "points" : points}))

   await page.click('.checkin-btn');

   console.log('- done ');
   await browser.close();
	return;
}