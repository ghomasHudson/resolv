//Main logic

const express = require('express')
const app = express()
const request = require('request')
const path    = require("path");

const bodyParser = require('body-parser');
app.use(bodyParser.json())

//Database
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://mainApp:resolveURLs@ds147044.mlab.com:47044/resolver';


//Helpers
function validURL(str) {
  var pattern = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if(!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

//Routes
app.get('/resolve', function (req, res) {
	qSplit = req.query.q.split("-")
	var q = qSplit[0];

	var searchString = '';
	if (qSplit.length > 1){
		searchString = qSplit[1].replace(/\s/g,'+')
	}

	if (q == "home" || q == "resolver"){
		res.redirect("/");
		return;
	}
	if (q == "keyword" || q == "keywords"){
		res.redirect("/keywords.html");

		return;
	}



	//Check local db first
	db.collection('keywords').findOne({keyword:q},function(err,result){
		console.log(result)
		if (result != null){
			res.redirect(result["url"])
		}
		else{
			 //Look for duck duck go bangs
			request('http://api.duckduckgo.com/?q=!'+q+'+'+searchString+'&format=json&pretty=1&no_redirect=1', function (error, response, body) {
			 	body = JSON.parse(body)
			 	if (body["Redirect"] != ""){
			 		res.redirect(body["Redirect"])
			 	}else{
			 		//404
			 		res.status(404).sendFile(path.join(__dirname+'/404.html'))
			 	}
			});
		}
	});

	
})

//Add new keyword
app.post('/keyword', function (req, res) {
	console.log(req.body)
	if (!req.body["localStorage"] && validURL(req.body["url"])){
		delete req.body["localStorage"]
		db.collection('keywords').insertOne(req.body)
		res.send(200)
	}else{
		res.send(400)
	}
})


app.use(express.static('static'))


// Handle 404
app.use(function(req, res) {
 res.status(400);
 res.sendFile(path.join(__dirname+'/404.html'));
});


var db;
MongoClient.connect(url, function(err, database){
  if (err) return console.log(err)
  db = database
  app.listen(8080, function () {
  console.log('Resolve app listening on port 8080!')
})
})
