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

// postOptions.body = JSON.stringify({
//    'sport': sport,
//    'season': 2019, //too specific to football, needs to fixed
//    'period': period
// });

function getInfo() {
   let message, target;

   fetch('/api/getinfo', getOptions)
   .then((res)=>res.json())
   .then(retData => {
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
      target = document.getElementById("checkinPoints");
      if (retData.checkinStatus.date == 'none') {
         message = 'no data';
         retData.checkinStatus.date = 'now';
      } else {
         message = retData.checkinStatus.points;
      }
      target.innerText = message;
		document.getElementById("checkinPointsDate").innerText = retData.checkinStatus.date;
		document.getElementById("snapshotDate").innerText = new Date(retData.snapshotDate).toLocaleString();
   });
}