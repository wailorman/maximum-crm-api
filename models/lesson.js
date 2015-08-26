var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validationTools = require('../tools/validation-tools');

var CoachModel = require('./coach');
var HallModel = require('./hall');
var GroupModel = require('./group');

var lessonSchema = new Schema({
    time: {
        start: {type: Date, required: true},
        end: {type: Date, required: true}
    },
    coaches: [{type: Schema.Types.ObjectId, ref: 'Coach'}],
    halls: [{type: Schema.Types.ObjectId, ref: 'Hall'}],
    groups: [{type: Schema.Types.ObjectId, ref: 'Group'}]
}, {collection: 'lessons'});

lessonSchema.path('time.end').validate(function () {
    var document = this;

    if ( !document.time || !document.time.start || !document.time.end )
        return true; // pass this document to the next validator

    var startTime = document.time.start.getTime();
    var endTime = document.time.end.getTime();

    return startTime < endTime;
}, '`time.end` should be greater than `time.start`');

const REFS_ARENT_EXIST_ERROR = "Some refs in `{PATH}` aren't exist";

lessonSchema.path('coaches').validate( validationTools.checkRefExistence(CoachModel), REFS_ARENT_EXIST_ERROR );
lessonSchema.path('halls').validate( validationTools.checkRefExistence(HallModel), REFS_ARENT_EXIST_ERROR );
lessonSchema.path('groups').validate( validationTools.checkRefExistence(GroupModel), REFS_ARENT_EXIST_ERROR );

var Lesson = mongoose.model( 'Lesson', lessonSchema );

module.exports = Lesson;