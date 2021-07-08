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

