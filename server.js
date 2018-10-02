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
var url = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@ds147044.mlab.com:47044/resolver';
//var url = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@nodejs-mongo-persistent-reolv.7e14.starter-us-west-2.openshiftapps.com:27017'
//Helpers
function validURL(str) {
  var pattern = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if(!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

function resolve(query,callback){
	qSplit = query.split("-")
	var q = qSplit[0];

	var searchString = '';
	if (qSplit.length > 1){
		searchString = qSplit[1].replace(/\s/g,'+')
	}

	if (q == "home" || q == "resolver"){
		callback(null,"/","built in")
		return;
	}
	if (q == "keyword" || q == "keywords"){
		callback(null,"/keywords.html","built in")
		return;
	}



	//Check local db first
	db.collection('keywords').findOne({keyword:q},function(err,result){
		if (result != null){

			//check for %s
			result["url"] = result["url"].replace(/%s/g, qSplit[1]);

			callback(null,result["url"],"database")
			return;			
		}
		else{
			 //Look for duck duck go bangs
			request('http://api.duckduckgo.com/?q=!'+q+'+'+searchString+'&format=json&pretty=1&no_redirect=1', function (error, response, body) {
			 	body = JSON.parse(body)
			 	if (body["Redirect"] != ""){
			 		callback(null,body["Redirect"],"duck duck go bangs")
			 		return;
			 	}else{
			 		//404
			 		callback("404");
			 	}
			});
		}
	});
}

//Routes

//Resolve keyword
app.get('/resolve', function (req, res) {
	resolve(req.query.q,function(e,url,source){
		if (e){
			res.status(404).sendFile(path.join(__dirname+'/404.html'))
		}
		else{
			//Log
			qSplit = req.query.q.split("-")
			var q = qSplit[0];
			var searchString = '';
			db.collection('log').insertOne({"keyword":qSplit[0]});

			//Redirect
			res.redirect(url)
		}
	})
})

//Check keyword
app.get('/keyword/:kw', function (req, res) {
	resolve(req.params.kw,function(e,url,source){
		if (e){
			res.send(404);
		}
		else{
			res.json({"url":url,"source":source})
		}
	})
})

//Add new keyword
app.post('/keyword', function (req, res) {
	console.log(req.body)
	if (!req.body["localStorage"] && validURL(req.body["url"])){
		delete req.body["localStorage"]
		db.collection('keywords').insertOne(req.body,function(e){
			if (e){
				res.status(400).json({"error":"Duplicate keyword"});
			}else{
				res.send(200);
			}
		});
	}else{
		res.status(400).json({"error":"Bad URL"})
	}
})

//Get most recent
app.get('/recent', function (req, res) {
	db.collection('log').find({},{"limit":50,"sort":{_id:-1}}).toArray(function(err, results){
	    res.json(results);
	});

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
  db = database;
  db.collection('keywords').createIndex( { "keyword": 1 }, { unique: true } )
  db.createCollection("log", { capped: true, size: 1000 } );

  var port = process.env.PORT || 8080;

  app.listen(port, function () {
  console.log('Resolve app listening on port '+port+'!')
})
})
