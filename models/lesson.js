var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var lessonSchema = new Schema({
    time: {
        start: {type: Date, required: true},
        end: {type: Date, required: true}
    },
    coaches: [{type: Schema.Types.ObjectId, ref: 'Coach'}],
    halls: [{type: Schema.Types.ObjectId, ref: 'Hall'}],
    groups: [{type: Schema.Types.ObjectId, ref: 'Group'}]
}, {collection: 'lessons'});

var Lesson = mongoose.model( 'Lesson', lessonSchema );

module.exports = Lesson;