function dbAct(actObj){
	/*
	actObj = {
		objectStore: recordings/deleted
		type: getOne/getAll/update/delete
		_id: ''
		toUpdate: [
			{}, {}
		]
	}
	*/
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(actObj.objectStore, 'readwrite');
		const store = transaction.objectStore(actObj.objectStore);
		let request;
		switch (actObj.type) {
			case 'getOne':
				request = store.get(actObj._id);
				request.onsuccess = () => {
					resolve(request.result);
				}
				break;
			case 'add':
				request = store.add(actObj.toUpdate);
				request.onsuccess = () => {
					resolve();
				}
				break;
			case 'getOne':
				request = store.get(actObj._id);
				request.onsuccess = () => {
					resolve(request.result);
				}
				break;
			case 'delete':
				// const transaction2 = db.transaction('deleted', 'readwrite');
				// const store2 = transaction2.objectStore('deleted');
				// let request2;
				request = store.delete(actObj._id);
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

function initIndexedDb(){
	return new Promise((resolve, reject) => {
		let request = window.indexedDB.open('tasker', 2);
		request.onerror = event => {
			console.log('indexedDB open error');
		};
		request.onsuccess = event => {
			db = event.target.result;
			resolve();
		};
		request.onupgradeneeded = event => {
			console.log('checking');
			event.target.result.createObjectStore('recordings', {keyPath: '_id'});
			event.target.result.createObjectStore('deleted', {keyPath: '_id'});
		};
	});
}
