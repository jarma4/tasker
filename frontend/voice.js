// let db=null, numRecordings=0;

async function displayRecordings() {
	const recordings = document.getElementById('recordings');
	const storedKeys = Object.keys(window.localStorage);
	let newRow, insertLocation;

	// blank out table
	recordings.innerHTML = '<table width="100%" class="recordings"><tbody><tr><th colspan=4>Recordings</th></tr></tbody></table>';
	dbAct({type: 'getAll'}).then(results => {
		// go through records and add table rows
		results.forEach(record => {
			// let dateArr = record.date.toString().split(' ');
			idSet.add(record._id);
			newRow = '<tr><td><button class="control play" data-_id="'+record._id+'"><span class="material-icons">play_arrow</span></button></td><td width=""><input class="comment" data-_id="'+record._id+'" value="'+record.comment+'"></input></td><td>'+(record.date.getMonth()+1)+'/'+record.date.getDate()+' '+record.date.getHours()+((record.date.getMinutes() < 10)?':0':':')+record.date.getMinutes()+'</td><td><span class="sync material-icons" data-_id="'+record._id+((record.sync)?'">sync':'">sync_disabled')+'</span></td><td><button class="control delete" data-_id="'+record._id+'"><span class="material-icons">delete_sweep</span></button></td></tr>';
			insertLocation=recordings.innerHTML.indexOf('</tbody>');
			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
			// numRecordings++;
		});
		// add button events
		let buttons = document.getElementsByClassName('control');
		for (let i=0; i < buttons.length; i++){
			buttons[i].addEventListener('click', (event2) => {
				if (event2.currentTarget.classList.contains('play')) {
					dbAct({type: 'getOne', _id: event2.currentTarget.getAttribute('data-_id')}).then(result => {
						const player = document.getElementById('player');
						player.src = result.blob_encoded;
						player.play();
						event2.target.classList.add('blinking');
						player.addEventListener('ended', err=>{
							event2.target.classList.remove('blinking');
						});
					});
				} else {
					deleteModal(event2.currentTarget);
				}
			});
		}
		// add comment input events
		let comments = document.getElementsByClassName('comment');
		for (let j=0; j < comments.length; j++){
			comments[j].addEventListener('change', (event3) => {
				const id = event3.currentTarget.getAttribute('data-_id');
				dbAct({type: 'update', _id: id, toUpdate: {comment: event3.currentTarget.value, sync: false}});
				document.querySelector("span.sync[data-_id='"+id+"']").textContent = 'sync_disabled';
				event3.currentTarget.blur();
			});
		}
	});
}

function dbAct(actObj){
	return new Promise((resolve, reject) => {
		let transaction = db.transaction('recordings', 'readwrite');
		let store = transaction.objectStore('recordings');
		let request;
		switch (actObj.type) {
			case 'getOne':
				request = store.get(actObj._id);
				request.onsuccess = () => {
					resolve(request.result);
				}
				break;
			case 'delete':
				request = store.delete(actObj._id);
				idSet.delete(actObj._id);
				request.onsuccess = () => {
					resolve();
				};
				break;
			case 'update':
				request = store.get(actObj._id);
				request.onsuccess = () => {
					for (let i=0; i < Object.keys(actObj.toUpdate).length; i++){
						request.result[Object.keys(actObj.toUpdate)[i]] = actObj.toUpdate[Object.keys(actObj.toUpdate)[i]];
					}
					store.put(request.result);
					resolve();
				};
				break;
			case 'getAll':
				// let results = [];
				request = store.getAll();
				// request = store.openCursor();
				request.onsuccess = (event) => {
					resolve(request.result);

					// if (event.target.result) {
					// 	results.push(event.target.result.value);
					// 	event.target.result.continue();
					// } else {
					// 	resolve(results);
					// }
				};
				break;
			case 'getAllKeys':
				request = store.getAllKeys();
				request.onsuccess = (event) => {
					resolve(request.result);
				};
				break;
		}
		request.onerror = (event) => {
			console.log('DB error'+event.err);
			reject();
		};
	});
}

async function initRecorder (){
	// setup recorder
	navigator.mediaDevices.getUserMedia({audio:true, video: false})
	.then(audioObj => {
		const recordBtn = document.getElementById('recordBtn');
		const player = document.getElementById('player');
		const recorder = new MediaRecorder(audioObj);
		let chunks = [];
		// add eventlisteners for buttons
		recordBtn.addEventListener('click', event => {
			if (recordBtn.textContent == 'Record') {
				recorder.start();
				recordBtn.textContent = 'Stop';
				recordBtn.classList.add('blinking');
			} else {
				recorder.stop();
				recordBtn.textContent = 'Record';
				recordBtn.classList.remove('blinking');
			}
		});
		// media recorder events
		recorder.ondataavailable = event => {
			chunks.push(event.data);
		};
		recorder.onstop = event=>{
			const blob = new Blob(chunks, { 'type' : 'audio/ogg;' });
			chunks = [];
			// below does the uuencode
			const reader = new FileReader();
			reader.onload = () => {
				let request = db.transaction('recordings', 'readwrite')
				.objectStore('recordings')
				.add({_id: uuidv4(), date: new Date(), comment: 'new note', sync: false, blob_encoded: reader.result})
				.onerror = () => console.log('error adding item to store');
				displayRecordings(); //when done
			};	
			reader.readAsDataURL(blob);
		};
	});
	await	initIndexedDb();
	displayRecordings();
}

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

function deleteModal(target){
	document.getElementById('deleteConfirm').setAttribute('data-_id', target.getAttribute('data-_id'));
	document.getElementById('deleteModal').style.display = 'block';
}

document.getElementById('deleteCancel').addEventListener('click', event => {
	document.getElementById('deleteModal').style.display = 'none';
});

document.getElementById('deleteConfirm').addEventListener('click', event => {
	dbAct({type: 'delete', _id: document.getElementById('deleteConfirm').getAttribute('data-_id')});
	document.getElementById('deleteModal').style.display = 'none';
	displayRecordings();
});

document.getElementById('syncBtn').addEventListener('click', e => {
	let needSync = [];

	dbAct({type: 'getAll'}).then(results => {
		// go through records and send items not synced
		results.forEach(record => {
			if (!record.sync) {
				needSync.push(record);
			}		
		});
		if (needSync.length) {
			postOptions.body = JSON.stringify({
				"recordings": needSync
			});
			fetch('/api/voicesync', postOptions)
			.then(res => res.json())
			.then(retData => {
				needSync.forEach(record => {
					if (!record.sync) {
						needSync.push(record);
						dbAct({type: 'update', _id: record._id, toUpdate: {sync: true}});
						document.querySelector("span.sync[data-_id='"+record._id+"']").textContent = 'sync';
					}		
				});
		
				console.log('Success syncing');
			})
			.catch(retData => console.log('Error syncing'));	
		}
	});	

});
