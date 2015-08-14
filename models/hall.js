var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hallSchema = new Schema({
    name: {type: String, required: true, unique: true}
}, {collection: 'halls'});

var Hall = mongoose.model( 'Hall', hallSchema );

module.exports = Hall;