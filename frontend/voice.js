async function displayRecordings() {
	const recordings = document.getElementById('recordings');
	const storedKeys = Object.keys(window.localStorage);
	let newRow, insertLocation;

	// blank out table
	recordings.innerHTML = '<table width="100%" class="recordings"><tbody><tr><th colspan=4>Recordings</th></tr></tbody></table>';
	dbAct({objectStore: 'recordings', type: 'getAll'}).then(results => {
		// go through records and add table rows
		results.forEach(record => {
			// let dateArr = record.date.toString().split(' ');
			idSet.add(record._id);  // global list to check at doorbell
			newRow = '<tr><td><button class="control play" data-_id="'+record._id+'"><span class="material-icons">play_arrow</span></button></td><td class="date">'+record.transcription+'</td><td>'+(record.date.getMonth()+1)+'/'+record.date.getDate()+' '+record.date.getHours()+((record.date.getMinutes() < 10)?':0':':')+record.date.getMinutes()+'</td><td><span class="sync material-icons" data-_id="'+record._id+((record.sync)?'">sync':'">sync_disabled')+'</span></td><td><button class="control delete" data-_id="'+record._id+'"><span class="material-icons">delete_sweep</span></button></td></tr>';
			insertLocation=recordings.innerHTML.indexOf('</tbody>');
			recordings.innerHTML = recordings.innerHTML.slice(0,insertLocation)+newRow+recordings.innerHTML.slice(insertLocation);
			// numRecordings++;
		});
		// add button events
		let buttons = document.getElementsByClassName('control');
		for (let i=0; i < buttons.length; i++){
			buttons[i].addEventListener('click', (event2) => {
				if (event2.currentTarget.classList.contains('play')) {
					dbAct({objectStore: 'recordings', type: 'getOne', _id: event2.currentTarget.getAttribute('data-_id')}).then(result => {
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
	});
}

async function initVoice (){
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
			reader.onload = () => {  // when encoded, save in db
				const id = uuidv4();
				dbAct({objectStore: 'recordings', type: 'add', toUpdate: {_id: id, date: new Date(), transcription: 'pending', sync: false, blob_encoded: reader.result}});
				displayRecordings(); //when done
				getTranscript(id, reader.result)
				.then(retData => {
					dbAct({objectStore: 'recordings', type: 'update', _id: id, toUpdate: {transcription: retData}});
					displayRecordings(); //when done
				})
				.catch(err => console.error(err));
			};	
			reader.readAsDataURL(blob); //encode
		};
	});
	await	initIndexedDb();
	displayRecordings();
}

function getTranscript(id, blob_encoded){
	return new Promise((resolve, reject)=>{
		postOptions.body = JSON.stringify({
			"blob_encoded": blob_encoded
		});
		fetch('/api/starttranscript', postOptions)
		.then(res => res.json())
		.then(retData => {
			postOptions.body = JSON.stringify({
				'id': retData.id
			});
			setTimeout(() => {
				fetch('/api/gettranscript', postOptions)
				.then(res => res.json())
				.then(retData2 => {
					resolve(retData2.text);
				})
				.catch(err2 => {
					reject();
					console.error(err2);
				});
			}, 15000);
		})
		.catch(err => reject(err));	
	});
}

function deleteModal(target){
	document.getElementById('deleteConfirm').setAttribute('data-_id', target.getAttribute('data-_id'));
	document.getElementById('deleteModal').style.display = 'block';
}

function syncRecordings(list){
	return new Promise((resolve, reject)=>{
		postOptions.body = JSON.stringify({
			"recordings": list
		});
		fetch('/api/voicesync', postOptions)
		.then(res => res.json())
		.then(retData => resolve (retData))
		.catch(err => reject(err));	
	});
}

document.getElementById('syncBtn').addEventListener('click', e => {
	let needSync = [];
	dbAct({objectStore: 'recordings', type: 'getAll'}).then(results => {
		// go through records and send items not synced
		results.forEach(record => {
			if (!record.sync) {
				needSync.push(record);
			}		
		});
		if (needSync.length) {
			syncRecordings(needSync)
			.then (retData => {
				needSync.forEach(record => { // assume no promblem syncing on server; review later
					dbAct({objectStore: 'recordings', type: 'update', _id: record._id, toUpdate: {sync: true}});
					document.querySelector("span.sync[data-_id='"+record._id+"']").textContent = 'sync';
				});
			})
			.catch(err => console.log(err));
		}
	});	

});

document.getElementById('deleteCancel').addEventListener('click', event => {
	document.getElementById('deleteModal').style.display = 'none';
});

document.getElementById('deleteConfirm').addEventListener('click', event => {
	dbAct({objectStore: 'recordings', type: 'getOne', _id: document.getElementById('deleteConfirm').getAttribute('data-_id')}).then(result => {
		if (result.sync) {
			// add to deleted objectstore
			console.log('in synced');
		}
	});
	dbAct({objectStore: 'recordings', type: 'delete', _id: document.getElementById('deleteConfirm').getAttribute('data-_id')});
	document.getElementById('deleteModal').style.display = 'none';
	displayRecordings();
});

