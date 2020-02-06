window.onload = () => {
   getStats();
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

function getStats() {
   let message, target;

   fetch('/api/vpnstatus', getOptions)
   .then((res)=>res.json())
   .then(retData => {
      target = document.getElementById("vpnStatus");
      if (retData.date == 'none') {
         message = 'no data';
         retData.date = 'now';
      } else {
         if (retData.vpn && retData.network){
            message = 'UP';
            target.classList.add('good');
         } else {
            message = 'DOWN';
            target.classList.add('bad');            
         }
      }
      target.innerText = message;
      document.getElementById("vpnStatusDate").innerText = retData.date;
   });
   fetch('/api/checkinstatus', getOptions)
   .then((res)=>res.json())
   .then(retData => {
      target = document.getElementById("checkinPoints");
      if (retData.date == 'none') {
         message = 'no data';
         retData.date = 'now';
      } else {
         message = retData.points;
      }
      target.innerText = message;
      document.getElementById("checkinPointsDate").innerText = retData.date;
   });
}