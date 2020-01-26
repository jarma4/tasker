const express = require('express'),
   compression = require('compression');

const app = express();
const router = express.Router();

app.use(compression());
app.set('view engine', 'pug');
app.set('views', './views');
app.use('/', router);
app.listen(8082, function(){
   console.log('redirecting on port 8082');
});


router.get('/', function(req,res){
	res.render('home', {pagename:'home'});
});

module.exports = app;
