const { GoogleSpreadsheet } = require('google-spreadsheet');
 
module.export = {
	getQuote: async (stock) => {
		// spreadsheet key is the long id in the sheets URL
		const doc = new GoogleSpreadsheet('1JXQ_xrPRWGNQDTn3b1CEw6c5ReGWhrbCYAzMO8PCTls');
		
		await doc.useServiceAccountAuth(require('./credentials.json'));
		await doc.loadInfo(); // loads document properties and worksheets
		
		const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
		await sheet.loadCells('A1:B4');
		sheet.getCell(0,1).value = stock;
		await sheet.saveUpdatedCells();
		setTimeout(() => {
			return sheet.getCell(3,1).value;
		}, 5000);
	}
}

