function getInfo() {
	let message, target;

	fetch('/api/getinfo', getOptions)
	.then(res => res.json())
	.then(retData => {
		// VPN
		target = document.getElementById("vpnStatus");
		if (retData.vpnStatus.date == 'none') {
			message = 'no data';
			retData.vpnStatus.date = 'now';
		} else {
			if (retData.vpnStatus.vpn){
				message = 'UP';
				target.classList.add('good');
			} else {
				message = 'DOWN';
				target.classList.add('bad');            
			}
		}
		target.innerText = message;
		document.getElementById("vpnStatusDate").innerText = new Date(retData.vpnStatus.date).toLocaleString();
		// CHECKIN
		target = document.getElementById("checkinPoints");
		if (retData.checkinStatus.date == 'none') {
			message = 'no data';
			retData.checkinStatus.date = 'now';
		} else {
			message = retData.checkinStatus.points;
		}
		target.innerText = message;
		document.getElementById("checkinPointsDate").innerText = retData.checkinStatus.date;
		// SNAPSHOT
		document.getElementById("snapshotDate").innerText = new Date(retData.snapshotDate).toLocaleString();
		// STOCK
		document.getElementById("stock").value = retData.stockStatus.stock;
		document.getElementById("watchPrice").innerText = retData.stockStatus.watch;
	});
}
