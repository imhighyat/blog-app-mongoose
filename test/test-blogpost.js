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
					res.body.blogposts.should.have.length.of(count);
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

		it('should ')
	});
});






