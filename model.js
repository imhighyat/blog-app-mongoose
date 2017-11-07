const mongoose = require('mongoose');

//our schema
const blogpostSchema = mongoose.Schema({
	title: {type: String, required: true},
	author: {
		firstName: {type: String, required: true},
		lastName: {type: String, required: true}
	},
	content: {type: String, required: true},
	publishDate: { type: Date, default: Date.now }
});

//virtuals
blogpostSchema.virtual('authorName').get(function(){
	return `${this.author.firstName} ${this.author.lastName}`.trim()
});

//instance method will be available on all instances
//method to return what we want the API to represent
blogpostSchema.methods.apiRepr = function() {
	return {
		id: this._id,
		title: this.title,
		author: this.authorName,
		content: this.content,
		publishDate: this.publishDate
	};
}

const Blogpost = mongoose.model('Blogpost', blogpostSchema);

module.exports = {Blogpost};