//requiring our dependencies fpr testing 
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require ('faker');
const mongoose = require('mongoose');

//we will use the should syntax for assertion
const should = chai.should();

//importing data from other modules
const {app, runServer, closeServer} = require('../server.js');
const {Blogpost} = require('../model.js');
const {TEST_DATABASE_URL} = require('../config.js');

chai.use(chaiHttp);

//function to seed 10 blog data
function seedDatabase(){
	console.log('Seeding database with information.');
	//variable to store our data objects
	const dataSeed = [];
	//use a for loop to generate 10 blog objects
	//then push it to data[]
	for(let i=0; i<10;i++){
		dataSeed.push(generateBlog());
	}
	//return with the data[] being inserted to the collection
	return Blogpost.insertMany(dataSeed);
}

//function to generate the blog data
function generateBlog(){
	return {
		title: faker.lorem.sentence(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		content: faker.lorem.text(),
		publishDate: faker.date.past()
	}
}

//function to tear down the db
function tearDownDb(){
	console.log('Deleting database.');
	return mongoose.connection.dropDatabase();
}

//---------------TESTS----------------------

//main describe
describe('Blogpost API test', function(){
	//before all the test hook
	before(function(){
		//we are using the test db not to affect the prod db
		return runServer(TEST_DATABASE_URL);
	});
	//before each test hook
	beforeEach(function(){
		//seed the db first
		return seedDatabase();
	});
	//after each test hook
	afterEach(function(){
		//drop the db
		return tearDownDb();
	});
	//after all the test hook
	after(function(){
		//disconnect from the server
		return closeServer();
	});

	//test GET endpoint /
	describe('GET endpoint for the root /', function(){
		//it should be a string that says 'Please add /blogposts
		//in the URL to see the list.'
		it('should return a message', function(){
			const message = `Please add /blogposts in the URL to see the list.`;
			return chai.request(app)
				.get('/')
				.then(res =>{
					console.log(res.text);
					res.should.have.status(200);
					res.text.should.be.a('string');
					res.text.should.equal(message);
				});
		});
	});

	//test GET with /blogposts endpoint
	describe('GET endpoint for /blogposts', function(){
		//do a get request
		//then assign the data to res
		//assert res status
		//assert 
		it('should return all the blogposts', function(){
			//initialize a var where we keep the res object
			let res;
			return chai.request(app)
				.get('/blogposts')
				.then(data => {
					res = data;
					res.should.have.status(200);
					res.body.blogposts.should.have.length.of.at.least(1);
					return Blogpost.count();
				})
				.then(count => {
					res.body.blogposts.should.have.length(count);
				});
		});

		it('should return the posts with all the keys', function(){
			let post;
			return chai.request(app)
				.get('/blogposts')
				.then(res => {
					res.should.have.status(200);
          			res.should.be.json;
          			res.body.blogposts.should.be.a('array');
          			res.body.blogposts.should.have.length.of.at.least(1);
					res.body.blogposts.forEach(function(item) {
            			item.should.be.a('object');
            			item.should.include.keys('id', 'title', 'author', 'content', 'publishDate');
            		});
            		post = res.body.blogposts[0];
            		return Blogpost.findById(post.id);
            	})
            	then(res => {
            		post.id.should.equal(res.id);
          			post.title.should.equal(res.title);
          			post.author.should.equal(res.author);
          			post.content.should.equal(res.content);
          			post.publishDate.should.equal(res.publishDate);
            	});
		});

		it('should get blogpost by id', function(){
			return Blogpost.findOne()
				.then(res => { 
					return chai.request(app)
					.get(`/blogposts/${res.id}`)
					
				})
				.then(data=>{
						data.should.have.status(200);
						data.body.should.be.a('object');
						data.body.should.include.keys('id', 'title', 'author', 'content', 'publishDate');
				});
		});
	});

	//test PUT endpoint
	describe('POST endpoint', function(){
		it('should add a new blog', function(){
			const newItem = generateBlog();
			return chai.request(app)
        	.post('/blogposts')
        	.send(newItem)
        	.then(function(res) {
          		res.should.have.status(201);
          		res.should.be.json;
          		res.body.should.be.a('object');
          		res.body.should.include.keys('id', 'title', 'author', 'content', 'publishDate');
          		res.body.title.should.equal(newItem.title);
          		res.body.id.should.not.be.null;
          		res.body.author.should.equal(`${newItem.author.firstName} ${newItem.author.lastName}`);
          		res.body.content.should.equal(newItem.content);
          		return Blogpost.findById(res.body.id);
        	})
        	.then(function(data) {
          		data.title.should.equal(newItem.title);
          		data.content.should.equal(newItem.content);
          		data.author.firstName.should.equal(newItem.author.firstName);
          		data.author.lastName.should.equal(newItem.author.lastName);
        	});
		});
	});

	//test PUT endpoint
	describe('PUT endpoint', function(){
		it('should update the posts that you change', function(){
			const toUpdate = {
        		title: 'updated title',
        		content: 'updated content',
        		author: {
          			firstName: 'updated first name',
          			lastName: 'updated last name'
        		}
      		};

      		return Blogpost
        	.findOne()
        	.then(data => {
          		toUpdate.id = data.id;
          		return chai.request(app)
            		.put(`/blogposts/${data.id}`)
            		.send(toUpdate);
        	})
        	.then(res => {
         		res.should.have.status(204);
          		return Blogpost.findById(toUpdate.id);
        	})
        	.then(post => {
          		post.title.should.equal(toUpdate.title);
          		post.content.should.equal(toUpdate.content);
          		post.author.firstName.should.equal(toUpdate.author.firstName);
          		post.author.lastName.should.equal(toUpdate.author.lastName);
        	});
		});
	});

	//test for DELETE endpoint
	describe('DELETE endpoint', function() {
    	it('should delete a post by id', function() {
			let post;
			return Blogpost
        	.findOne()
        	.then(_data => {
          		post = _data;
          		return chai.request(app).delete(`/blogposts/${post.id}`);
        	})
        	.then(res => {
          		res.should.have.status(204);
          		return Blogpost.findById(post.id);
        	})
        	.then(blog => {
          		should.not.exist(blog);
        	});
    	});
  	});
});






