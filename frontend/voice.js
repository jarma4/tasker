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
			event.target.result.createObjectStore('recordings', {keyPath: '_id'});
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
				.add({_id: uuidv4(), date: new Date(), comment: 'new note', blob: blob})
				.onerror = () => console.log('error adding item to store');
			displayStorage(); //when done
		};
	});
	await	initIndexedDb();
	displayStorage();
}

// const reader = new FileReader();
// reader.onload = () => {
// 	localStorage.setItem('tasker'+numRecordings, reader.result);
// 	displayStorage(); //when done
// };
// reader.readAsDataURL(blob);

function dbAct(actObj){
	return new Promise((resolve, reject) => {
		let transaction = db.transaction('recordings', 'readwrite');
		let store = transaction.objectStore('recordings');
		let request;
		switch (actObj.type) {
			case 'get':
				request = store.get(actObj._id);
				request.onsuccess = () => {
					resolve(request.result);
				}
				break;
			case 'delete':
				request = store.delete(actObj._id);
				request.onsuccess = () => {
					resolve();
				};
				break;
			case 'update':
				request = store.get(actObj._id);
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
			newRow = '<tr><td><button class="control play" data-_id="'+record._id+'"><span class="material-icons">play_arrow</span></button></td><td width=""><input class="comment" data-_id="'+record._id+'" value="'+record.comment+'"></input></td><td>'+(record.date.getMonth()+1)+'/'+record.date.getDate()+' '+record.date.getHours()+((record.date.getMinutes() < 10)?':0':':')+record.date.getMinutes()+'</td><td><span class="sync material-icons" data-_id="'+record._id+'">sync_disabled</span></td><td><button class="control delete" data-_id="'+record._id+'"><span class="material-icons">delete_sweep</span></button></td></tr>';
			insertLocation=recordings.innerHTML.indexOf('</tbody>');
			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
			numRecordings++;
		});
		// add button events
		let buttons = document.getElementsByClassName('control');
		for (let i=0; i < buttons.length; i++){
			buttons[i].addEventListener('click', (event2) => {
				if (event2.currentTarget.classList.contains('play')) {
					dbAct({type: 'get', _id: event2.currentTarget.getAttribute('data-_id')}).then(result => {
						document.getElementById('player').src = URL.createObjectURL(result.blob);
						document.getElementById('player').play();
					});
				} else {
					dbAct({type: 'delete', _id: event2.currentTarget.getAttribute('data-_id')});
					numRecordings--;
					displayStorage();
				}
			});
		}
		// add comment input events
		let comments = document.getElementsByClassName('comment');
		for (let j=0; j < comments.length; j++){
			comments[j].addEventListener('change', (event3) => {
				dbAct({type: 'update', _id: event3.currentTarget.getAttribute('data-_id'), comment: event3.currentTarget.value});
				event3.currentTarget.blur();
			});
		}
	});
}
