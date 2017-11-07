const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

//let us use ES6 promises instead of Mongoose's built in
mongoose.Promise = global.Promise;

//we require config.js which has the port and db values
const {PORT, DATABASE_URL} = require('./config');
const {Blogpost} = require('./model');

const app = express();
app.use(bodyParser.json());

//GET endpoint for the root
app.get('/', (req, res) => {
	res.send(`Please add /blogposts in the URL to see the list.`);
});

//GET endpoint for /blogposts
app.get('/blogposts', (req, res) => {
	Blogpost
	.find()		//get all entries
	.then(data => {		//then pass the result and map thru each item
		res.json({
		//respond with an object that has a blogposts key and an array value
			blogposts: data.map((item) => item.apiRepr())
		});
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error occured.'});
	});
});

//GET endpoint for /blogposts/:id
app.get('/blogposts/:id', (req, res) => {
	Blogpost
	.findById(req.params.id)	//takes the params id and find it
	.then(result => res.json(result.apiRepr())) //pass the result
	.catch(err => {
		console.log(err);
		res.status(500).json({message: 'Internal server error occured.'});
	});
});

//POST endpoint for /blogposts
app.post('/blogposts', (req, res) => {
	//store the required fields
	const requiredFields = ['title', 'content', 'author'];
	//loop through to make sure that they are in the req body
	//if not return the error message
	for(let i=0; i < requiredFields.length; i++){
		const field = requiredFields[i];
		if(!(field in req.body)){
			const message = `Missing ${field} in request body.`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	//if everything in the required fields have value
	Blogpost
	.create({
		title: req.body.title,
		content: req.body.content,
		author: req.body.author,
		publishDate: req.body.publishDate
	})
	.then(result => res.status(201).json(result.apiRepr()))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error occured.'});
	});
});

//PUT endpoint for /blogposts/:id
app.put('/blogposts/:id', (req, res) => {
	// ensure that the id in the request path and the one in request body match
	if(!(req.params.id === req.body.id)){
		const message = `The request path id ${req.params.id} and request body id ${req.body.id} should match.`;
		console.error(message);
		return res.status(400).json({message: message});
	}

	//something to hold what the updated data will be
	const toUpdate = {};
	//data that client can update
	const fields = ['title', 'author', 'content'];
	for(let i = 0; i < fields.length; i++){
		const field = fields[i];
		if(field in req.body && req.body[field] !== null){
			toUpdate[field]=req.body[field];
		}
	}

	Blogpost
	.findByIdAndUpdate(req.params.id, {$set: toUpdate})
	.then(result => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error occured.'}));
});

//DELETE endpoint for /blogposts/:id
app.delete('/blogposts/:id', (req,res) => {
	Blogpost
	.findByIdAndRemove(req.params.id)
	.then(result => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error occured.'}));
});

//all other endpoints not specified should return a 404 status
app.use('*', function(req, res) {
  res.status(404).json({message: 'Page Not Found'});
});


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

//if server.js is directly called from node, we will invoke runServer
if(require.main === module){
	//if any error, catch it and log
	runServer().catch(err => console.error(err));
}

//exporting our app and the run and close functions for testing
module.exports = {app, runServer, closeServer};
