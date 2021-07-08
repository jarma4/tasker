let db=null, numRecordings=0;

window.onload = () => {
	getInfo();
	initAudio();
};

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
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




	// navigator.mediaDevices.enumerateDevices()
	// .then(devices => {
	// 	devices.forEach(device=>{
	// 		console.log(device.kind + ": " + device.label +
	// 		" _id = " + device.deviceId);
	// 	});
	// })
	// .catch(err=>{
	// 		console.log(err.name, err.message);
	// });
