const globals = require('./globals');

module.exports = async function () {
   const today = new Date();
   console.log('* ', today.toLocaleString());
   console.log('- loading browser ...');
	// const browser = await puppeteer.launch({headless: false});
	const browser = await globals.puppeteer.launch();
   const page = await browser.newPage();
   await page.setViewport({ width: 1024, height: 1500});

   console.log('- logging in ...');
   let url = "http://192.168.1.1"
	await page.goto(url);
   await page.type('#user_name_field', process.env.GATEWAY_USER);
   await page.type('#password_field', process.env.GATEWAY_PASS);
   await page.click('#login_btn');
   await page.waitForNavigation();

   console.log('- goto devices page ...');
   url = "http://192.168.1.1/#/html/status/status_devicetable.html";
   await page.goto(url, {waitUntil: 'networkidle2'});

   console.log('- take screenshot ...');
   const filename = `./results/${today.getFullYear()}${('0'+(today.getMonth()+1)).slice(-2)}${('0'+today.getDate()).slice(-2)}_${('0'+today.getHours()).slice(-2)}${('0'+today.getMinutes()).slice(-2)}_snapshot.png`;
   await page.screenshot({path: filename});
   globals.fs.unlink('./public/images/latest.png',  err => {
      if (err) throw err;
      globals.fs.symlink('../.'+filename, './public/images/latest.png', 'file', err => {
         if (err) throw err;
         console.log('- symlink created');
      });
   });
   console.log('- done ');
   await browser.close();
	return;
}
