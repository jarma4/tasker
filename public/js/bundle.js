window.onload = () => {
   getInfo();
};

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

