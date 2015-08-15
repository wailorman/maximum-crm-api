var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var groupSchema = new Schema({
    name: {type: String, required: true, unique: true}
}, {collection: 'groups'});

var Group = mongoose.model( 'Group', groupSchema );

module.exports = Group;