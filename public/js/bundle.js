let numRecordings=0;

window.onload = () => {
	getInfo();
	initAudio();
};

async function initAudio (){
	navigator.mediaDevices.getUserMedia({audio:true,video:false})
	.then(audioObj => {
		const recordBtn = document.getElementById('recordBtn');
		const player = document.getElementById('player');
		const recorder = new MediaRecorder(audioObj);
		let chunks = [];

		recordBtn.addEventListener('click', event => {
			if (recordBtn.textContent == 'Start Recording') {
				recorder.start();
				recordBtn.textContent = 'Stop Recording';
				recordBtn.classList.add('recording');
			} else {
				recorder.stop();
				recordBtn.textContent = 'Start Recording';
				recordBtn.classList.remove('recording');
			}
		});
		recorder.ondataavailable = event => {
			chunks.push(event.data);
		};
		recorder.onstop = event=>{
			let blob = new Blob(chunks, { 'type' : 'audio/ogg;' });
			chunks = [];
			const reader = new FileReader();
			reader.onload = () => {
				localStorage.setItem('tasker'+numRecordings, reader.result);
				displayStorage(); //when done
			};
			reader.readAsDataURL(blob);
		};
	});
	displayStorage();
}

function displayStorage() {
	const recordings = document.getElementById('recordings');
	const storedKeys = Object.keys(localStorage);
	let newRow, insertLocation;

	// blank out table
	recordings.innerHTML = '<table width="100%" class="recordings"><tbody><tr><th colspan=4>Recordings</th></tr></tbody></table>';
	// fille table with items in localstorage
	if (storedKeys.length) {
		for (let key in storedKeys){
			if (storedKeys[key].slice(0,6) == 'tasker') {
				newRow = '<tr><td><button class="control play" data-key="'+storedKeys[key]+'"><span class="material-icons">play_arrow</span></button></td><td width="100%">'+storedKeys[key]+'</td><td><button class="control edit" data-key="'+storedKeys[key]+'"><span class="material-icons">edit</span></a></td><td><button class="control delete" data-key="'+storedKeys[key]+'"><span class="material-icons">delete_sweep</span></a></td></tr>';
				insertLocation=recordings.innerHTML.indexOf('</tbody>');
				recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
				numRecordings++;
			}
		}
	} else {
		newRow = '<tr><td colspan=4>None</td></tr>';
		insertLocation=recordings.innerHTML.indexOf('</tbody>');
		recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
	}

	// add events to control buttons
	let buttons = document.getElementsByClassName('control');
	for (let i=0; i < buttons.length; i++){
		buttons[i].addEventListener('click', (event) => {
			if (event.currentTarget.classList.contains('play')) {
				document.getElementById('player').src = localStorage.getItem(event.currentTarget.getAttribute('data-key'));
				document.getElementById('player').play();
			} else {
				localStorage.removeItem(event.currentTarget.getAttribute('data-key'));
				displayStorage();
			}
		});
	}
}

// for FETCH calls
let postOptions = {
		credentials: 'same-origin',
		method:'POST',
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type':'application/json'
		}
	},
	getOptions = {
		credentials: 'same-origin',
	};


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


function triggerSnapshot() {
   postOptions.body = JSON.stringify({
      'action': 'snapshot'
   });
   fetch('/api/action', postOptions)
   .then((res)=>res.json())
   .then(retData => {
		if (retData.message == 'success') {
			document.getElementById("snapshotDate").innerText = new Date().toLocaleString();
		}
   });
}

function getQuote() {
	let chars = '┤┘┴└├┌┬┐'.split('');
	// let chars = '▖▘▝▗'.split('');
	let spinner;
	
	function spin() {
		spinner = setInterval(() => {
			var char = chars.shift();
			document.getElementById('currentPrice').innerText = char;
			chars.push(char);
	
		}, 150);
	}

	spin();
   postOptions.body = JSON.stringify({
		'action': 'getquote',
		'stock': document.getElementById("stock").value
   });
   fetch('/api/action', postOptions)
   .then((res)=>res.json())
   .then(retData => {
		if (retData.message) {
			clearInterval(spinner);
			document.getElementById("currentPrice").innerText = retData.message;
			document.getElementById("change").innerText = ((Number(retData.message) - Number(document.getElementById("watchPrice").innerText))/Number(document.getElementById("watchPrice").innerText)*100).toPrecision(3)+'%';
		}
   });
}


	// navigator.mediaDevices.enumerateDevices()
	// .then(devices => {
	// 	devices.forEach(device=>{
	// 		console.log(device.kind + ": " + device.label +
	// 		" id = " + device.deviceId);
	// 	});
	// })
	// .catch(err=>{
	// 		console.log(err.name, err.message);
	// });
