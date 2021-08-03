const idSet = new Set();

window.onload = () => {
	initRecorder();
	doorBell();
};

// for FETCH calls
let postOptions = {
	credentials: 'same-origin',
	method:'POST',
	headers: {
		'Accept': 'application/json, text/plain, */*',
		'Content-Type':'application/json'
	}
};
const getOptions = {
	credentials: 'same-origin',
};

function doorBell() {
	fetch('/api/voiceinfo', getOptions)
	.then(res => res.json())
	.then(retData => {
		// VOICE
		for (let i=0; i < retData.recordings.length; i++) {
			if (!idSet.has(retData.recordings[i]._id)) {
				console.log(`${retData.recordings[i]._id} not in DB`);
				document.querySelector("#moreOnServer").textContent = 'sync_problem';
				break;
			}
		}
		// VPN
		let message, target;
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
		// SNAPSHOT
		document.getElementById("snapshotDate").innerText = new Date(retData.snapshotDate).toLocaleString();
		// STOCK
		document.getElementById("stock").value = retData.stockStatus.stock;
		document.getElementById("watchPrice").innerText = retData.stockStatus.watch;
		// CHECKIN
		// target = document.getElementById("checkinPoints");
		// if (retData.checkinStatus.date == 'none') {
		// 	message = 'no data';
		// 	retData.checkinStatus.date = 'now';
		// } else {
		// 	message = retData.checkinStatus.points;
		// }
		// target.innerText = message;
		// document.getElementById("checkinPointsDate").innerText = retData.checkinStatus.date;
	});
}

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
 }
