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
