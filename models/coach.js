var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coachSchema = new Schema({
    name: {type: String, required: true, unique: true}
}, {collection: 'coaches'});

var Coach = mongoose.model( 'Coach', coachSchema );

module.exports = Coach;