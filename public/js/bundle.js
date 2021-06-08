let db=null, numRecordings=0;

window.onload = () => {
	getInfo();
	initAudio();
};

function initIndexedDb(){
	return new Promise((resolve, reject) => {
		let request = window.indexedDB.open('tasker', 1);
		request.onerror = event => {
			console.log('indexedDB open error');
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
			let request = db.transaction('recordings', 'readwrite')
				.objectStore('recordings')
				.add({date: new Date(), comment: 'new note', blob: blob})
				.onerror = () => console.log('error adding item to store');
			displayStorage(); //when done
		};
	});
	await	initIndexedDb();
	displayStorage();
}

function dbAct(actObj){
	return new Promise((resolve, reject) => {
		let transaction = db.transaction('recordings', 'readwrite');
		let store = transaction.objectStore('recordings');
		let request;
		switch (actObj.type) {
			case 'get':
				request = store.get(actObj.id);
				request.onsuccess = () => {
					resolve(request.result);
				}
				break;
			case 'delete':
				request = store.delete(actObj.id);
				request.onsuccess = () => {
					resolve();
				};
				break;
			case 'update':
				request = store.get(actObj.id);
				request.onsuccess = () => {
					request.result.comment = actObj.comment;
					store.put(request.result);
					resolve();
				};
				break;
			case 'getAll':
				let results = [];
				request = store.openCursor();
				request.onsuccess = (event) => {
					if (event.target.result) {
						results.push(event.target.result.value);
						event.target.result.continue();
					} else {
						resolve(results);
					}
				};
				break;
			}
		request.onerror = (event) => {
			console.log('DB error'+event.err);
			reject();
		};
	});
}

async function displayStorage() {
	const recordings = document.getElementById('recordings');
	const storedKeys = Object.keys(window.localStorage);
	let newRow, insertLocation;

	// blank out table
	recordings.innerHTML = '<table width="100%" class="recordings"><tbody><tr><th colspan=4>Recordings</th></tr></tbody></table>';
	dbAct({type: 'getAll'}).then(results => {
		// go through records and add table rows
		results.forEach(record => {
			let dateArr = record.date.toString().split(' ');
			newRow = '<tr><td><button class="control play" data-id="'+record.id+'"><span class="material-icons">play_arrow</span></button></td><td width=""><input class="comment" data-id="'+record.id+'" value="'+record.comment+'"></input></td><td>'+dateArr[1]+' '+dateArr[2]+' '+dateArr[4]+'</td><td><button class="control delete" data-id="'+record.id+'"><span class="material-icons">delete_sweep</span></a></td></tr>';
			insertLocation=recordings.innerHTML.indexOf('</tbody>');
			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
			numRecordings++;
		});
		// add button events
		let buttons = document.getElementsByClassName('control');
		for (let i=0; i < buttons.length; i++){
			buttons[i].addEventListener('click', (event2) => {
				if (event2.currentTarget.classList.contains('play')) {
					dbAct({type: 'get', id: Number(event2.currentTarget.getAttribute('data-id'))}).then(result => {
						document.getElementById('player').src = URL.createObjectURL(result.blob);
						document.getElementById('player').play();
					});
				} else {
					dbAct({type: 'delete', id: Number(event2.currentTarget.getAttribute('data-id'))});
					numRecordings--;
					displayStorage();
				}
			});
		}
		// add comment input events
		let comments = document.getElementsByClassName('comment');
		for (let j=0; j < comments.length; j++){
			comments[j].addEventListener('change', (event3) => {
				dbAct({type: 'update', id: Number(event3.currentTarget.getAttribute('data-id')), comment: event3.currentTarget.value});
				event3.currentTarget.blur();
			});
		}
	});
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
