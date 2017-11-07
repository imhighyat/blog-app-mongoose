//configure values for the Mongo database URL and the port the application will run on

exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/blog-app'; //edit for the name of the db
exports.PORT = process.env.PORT || 8080;