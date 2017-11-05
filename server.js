const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

//let us use ES6 promises instead of Mongoose's built in
mongoose.Promise = global.Promise;

//we require config.js which has the port and db values
const {PORT, DATABASE_URL} = require('./config');
const {Blogposts} = require('./models');

const app = express();
app.use(bodyParser.json());

//will store the server object we are starting
let server;

//connects to the db and starts the server
function runServer(databaseUrl=DATABASE_URL, port=PORT){
	return new Promise ((resolve, reject) => {
		//connect to the db first
		mongoose.connect(databaseUrl, err => {
			//if there is an error connecting, return the promise
			//with reject and the error
			if(err){
				return reject(err);
			}
			//if not, move on to starting a server
			server = app.listen(port, () => {
				console.log(`The app is listening on ${port}.`);
				resolve();
			})
			//if there is an error, disconnect server and return a reject
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

//disconnects from the db and close the server
function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise ((resolve, reject) => {
			console.log('Closing the server.');
			//closing the server
			server.close(err => {
				//if there is an error, return a reject
				if(err){
					return reject(err);
				}
				//if not, return a resolve
				resolve();
			});
		});
	});
}


