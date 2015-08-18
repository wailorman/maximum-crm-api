var request = require('supertest');
var app = require('../../max-crm-app.js');
var expect = require('chai').expect;
var async = require('async');

var CoachModel = require('../../models/coach.js');
var HallModel = require('../../models/hall.js');
var GroupModel = require('../../models/group.js');
var LessonModel = require('../../models/lesson.js');

///////////////////////////

describe('Lessons http', function () {

    var mockedLessonDocument,
        mockedCoaches, mockedHalls, mockedGroups,
        mockedLesson,
        refIds;

    var clearLessonsAndRefs, clearRefs,
        createMockedRefs, createMockedLesson,
        saveNewIdFromMongooseCallback,
        reCreateAllMocks;

    const urlPrefix = '/v0.2/lessons/';

    //////////////////////////////////

    mockedCoaches = [
        {name: 'Tommy'},
        {name: 'Chris'}
    ];

    mockedHalls = [
        {name: 'Middle'},
        {name: 'Big'}
    ];

    mockedGroups = [
        {name: 'M1'},
        {name: 'M2'}
    ];

    //////////////////////////////////

    /**
     *
     * @param idStorage {Array|any}
     * @param callback {Function}
     * @returns {Function}
     */
    saveNewIdFromMongooseCallback = function (idStorage, callback) {

        // pass this function to callback
        // which take an error & document
        return function (err, doc) {
            if (err) throw err;
            var id = doc._id;

            if (idStorage instanceof Array)
                idStorage.push(id);
            else
                idStorage = doc._id;
        }

    };

    clearRefs = function (done) {

        async.parallel([
            CoachModel.find({}).remove,
            HallModel.find({}).remove,
            GroupModel.find({}).remove
        ], done);

    };

    clearLessonsAndRefs = function (done) {

        async.parallel([
            clearRefs,
            LessonModel.find({}).remove
        ], done);

    };

    createMockedRefs = function (done) {

        refIds = {
            coaches: [],
            halls: [],
            groups: []
        };

        async.parallel([
            // coaches
            function (pcb) {
                async.each(mockedCoaches, function (coachMock, ecb) {
                    (new CoachModel(coachMock)).save(
                        saveNewIdFromMongooseCallback(refIds.coaches, ecb)
                    );
                }, pcb);
            },
            // halls
            function (pcb) {
                async.each(mockedHalls, function (hallMock, ecb) {
                    (new HallModel(hallMock)).save(
                        saveNewIdFromMongooseCallback(refIds.halls, ecb)
                    );
                }, pcb);
            },
            // groups
            function (pcb) {
                async.each(mockedGroups, function (groupMock, ecb) {
                    (new GroupModel(groupMock)).save(
                        saveNewIdFromMongooseCallback(refIds.groups, ecb)
                    );
                }, pcb);
            }
        ], done);

    };

    createMockedLesson = function (done) {

        // required for created refs.
        // create refs before create mocked lesson!

        (new LessonModel(
            {
                time: {
                    start: new Date(2015, 5 - 1, 8, 14, 0),
                    end: new Date(2015, 5 - 1, 8, 14, 30)
                },
                coaches: refIds.coaches,
                halls: refIds.halls,
                groups: refIds.groups
            }
        )).save(function (err, doc) {
                if (err) return done(err);

                mockedLesson = doc;
                done();
            });

    };

    reCreateAllMocks = function (done) {
        async.series([
            clearLessonsAndRefs,
            createMockedRefs,
            createMockedLesson
        ], done);
    };

    //////////////////////////////////

    beforeEach(reCreateAllMocks);

    it('should return empty array at first', function (done) {

        request(app)
            .get(urlPrefix)
            .expect(200)
            .end(function (err, res) {

                // result should be an empty array

                expect(res.body)
                    .to.be.an('array')
                    .and.have.length(0);

                done();

            });

    });

    describe('path validation', function () {

        describe('time', function () {

            // every suite mocked lesson document is recreating

            var tryToPost = function () {
                return request(app)
                    .post(urlPrefix)
                    .send(mockedLesson)
            };

            it('error if time not defined', function (done) {

                mockedLesson.time = undefined;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        // error should be of ValidationError
                        expect( res.body.name).to.eql('ValidationError');


                    });
            });

            it('error if time.start not defined');

            it('error if time.end not defined');

            it('error if time.start or .end not Date');

            it('error if time.start equals to .end');

            it('error if time.start greater than .end');

        });

    });

});