var express = require('express');
var bodyParser = require('body-parser');
var restMongoose = require('express-restify-mongoose');
var mongoose = require('mongoose');
var app = express();
var router = express.Router();

var CoachModel = require('./models/coach.js');
var HallModel = require('./models/hall.js');

///////////////////////

const DB_URI = 'mongodb://localhost/maximum-crm';
const restMongooseConfig = {
    prefix: '',
    version: '/v0.2',
    lowercase: true,
    limit: 1000
};

///////////////////////

app.use( bodyParser.json() );

restMongoose.serve(app, CoachModel, restMongooseConfig);
restMongoose.serve(app, HallModel, restMongooseConfig);

///////////////////////

mongoose.connect( DB_URI, {}, function () {

    app.listen(21080, function () {
        console.log('Start Maximum CRM server on port 21080');
    });

} );
mongoose.connection.on( 'connected', function () {
    console.log( 'Mongoose connected to ' + DB_URI );
} );
mongoose.connection.on( 'error', function ( err ) {
    console.log( 'Mongoose error: ' + err );
} );

//////////////////////

module.exports = app;