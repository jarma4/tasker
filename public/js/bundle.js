let db=null, numRecordings=0;

window.onload = () => {
	getInfo();
	initAudio();
};

function initIndexDb(){
	return new Promise((resolve, reject) => {
		let request = window.indexedDB.open('tasker', 1);
		request.onerror = event => {
			console.log('indexDB open error');
		};
		request.onsuccess = event => {
			db = event.target.result;
			resolve();
		};
		request.onupgradeneeded = event => {
			event.target.result.createObjectStore('recordings', {keyPath: 'id', autoIncrement: true});
		};
	});
}

async function initAudio (){
	// setup recorder
	navigator.mediaDevices.getUserMedia({audio:true,video:false})
	.then(audioObj => {
		const recordBtn = document.getElementById('recordBtn');
		const player = document.getElementById('player');
		const recorder = new MediaRecorder(audioObj);
		let chunks = [];

		recordBtn.addEventListener('click', event => {
			if (recordBtn.textContent == 'Record') {
				recorder.start();
				recordBtn.textContent = 'Stop';
				recordBtn.classList.add('recording');
			} else {
				recorder.stop();
				recordBtn.textContent = 'Record';
				recordBtn.classList.remove('recording');
			}
		});
		recorder.ondataavailable = event => {
			chunks.push(event.data);
		};
		recorder.onstop = event=>{
			let blob = new Blob(chunks, { 'type' : 'audio/ogg;' });
			chunks = [];
			// indexDb version
			let request = db.transaction('recordings', 'readwrite')
				.objectStore('recordings')
				.add({date: new Date(), comment: 'new note', blob: blob})
				.onerror = () => console.log('error adding item to store');
			displayStorage(); //when done
			// const reader = new FileReader();
			// reader.onload = () => {
			// 	// localStorage version
			// 	window.localStorage.setItem('tasker'+numRecordings, reader.result);
			// };
			// reader.readAsDataURL(blob);
		};
	});
	await	initIndexDb();
	displayStorage();
}

function displayStorage() {
	const recordings = document.getElementById('recordings');
	const storedKeys = Object.keys(window.localStorage);
	let newRow, insertLocation;

	// blank out table
	recordings.innerHTML = '<table width="100%" class="recordings"><tbody><tr><th colspan=4>Recordings</th></tr></tbody></table>';
	// indexdb
	let recs=[];
	let request = db.transaction('recordings').objectStore('recordings').openCursor().onsuccess=event=>{
		let cursor=event.target.result;
		if(cursor){
			recs.push(cursor.value);
			newRow = '<tr><td><button class="control play" data-id="'+cursor.value.id+'"><span class="material-icons">play_arrow</span></button></td><td width="100%">'+cursor.value.comment+'</td><td><button class="control edit" data-id="'+cursor.value.id+'"><span class="material-icons">edit</span></a></td><td><button class="control delete" data-id="'+cursor.value.id+'"><span class="material-icons">delete_sweep</span></a></td></tr>';
			insertLocation=recordings.innerHTML.indexOf('</tbody>');
			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
			numRecordings++; //look for others, incrementing somewhere
			cursor.continue();
		} else { // no more
			let buttons = document.getElementsByClassName('control');
			for (let i=0; i < buttons.length; i++){
				buttons[i].addEventListener('click', (event) => {
					if (event.currentTarget.classList.contains('play')) {
						let transaction = db.transaction('recordings');
						let store = transaction.objectStore('recordings');
						let request = store.get(Number(event.currentTarget.getAttribute('data-id')));
							// .onerror = (event) => {
							// 	console.log('error getting item from store');
							// }
						request.onsuccess = (event) => {
							document.getElementById('player').src = URL.createObjectURL(request.result.blob);
							document.getElementById('player').play();
						};
					} else {
						let request = db.transaction('recordings', 'readwrite')
							.objectStore('recordings')
							.delete(Number(event.currentTarget.getAttribute('data-id')))
							.onerror = () => console.log('error deleting item from store');
						// localstorage
						// window.localStorage.removeItem(event.currentTarget.getAttribute('data-key'));
						numRecordings--;
						displayStorage();
					}
				});
			}
		
		}
	};

	// fille table with items in window.localStorage
	// if (storedKeys.length) {
	// 	numRecordings = 0;
	// 	for (let key in storedKeys){
	// 		if (storedKeys[key].slice(0,6) == 'tasker') {
	// 			newRow = '<tr><td><button class="control play" data-key="'+storedKeys[key]+'"><span class="material-icons">play_arrow</span></button></td><td width="100%">'+storedKeys[key]+'</td><td><button class="control edit" data-key="'+storedKeys[key]+'"><span class="material-icons">edit</span></a></td><td><button class="control delete" data-key="'+storedKeys[key]+'"><span class="material-icons">delete_sweep</span></a></td></tr>';
	// 			insertLocation=recordings.innerHTML.indexOf('</tbody>');
	// 			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
	// 			numRecordings++; //look for others, incrementing somewhere
	// 		}
	// 	}
	// } else {
	// 	newRow = '<tr><td colspan=4>None</td></tr>';
	// 	insertLocation=recordings.innerHTML.indexOf('</tbody>');
	// 	recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
	// }

	// add events to control buttons
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
