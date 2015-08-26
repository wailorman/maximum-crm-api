require('sugar');

var request = require('supertest');
var app = require('../../max-crm-app.js');
var expect = require('chai').expect;
var async = require('async');
var mongoose = require('mongoose');
var assert = require('assert');

var CoachModel = require('../../models/coach.js');
var HallModel = require('../../models/hall.js');
var GroupModel = require('../../models/group.js');
var LessonModel = require('../../models/lesson.js');

var models = {
    coach: CoachModel,
    hall: HallModel,
    group: GroupModel,
    lesson: LessonModel
};

///////////////////////////

describe.only('Lessons http', function () {

    var mockedCoaches, mockedHalls, mockedGroups;

    var reCreateAllMocks;

    const URL_PREFIX = '/v0.2/lessons/';

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

    var clearDb = function (done) {

        async.each(
            mongoose.connection.collections,
            function (collection, ecb) {
                collection.remove(function () {
                    ecb();
                });
            },
            function () {
                console.log('Clearing db is done');
                done();
            }
        );

    };


    var refIds = {
        coaches: [],
        halls: [],
        groups: []
    };
    var createMockedRefs = function (done) {

        // init again
        refIds = {
            coaches: [],
            halls: [],
            groups: []
        };

        async.parallel([
            // coaches
            function (pcb) {
                async.each(mockedCoaches, function (coachMockTemplate, ecb) {
                    var newCoach = new CoachModel(coachMockTemplate);
                    newCoach.save(function (err, doc) {
                        assert(!err, 'Error in creating mocked coach');
                        refIds.coaches.push(doc._id);
                        ecb();
                    });
                }, function () {
                    console.log('Mocked coaches has been created');
                    pcb();
                });
            },
            // halls
            function (pcb) {
                async.each(mockedHalls, function (hallMockTemplate, ecb) {
                    var newHall = new HallModel(hallMockTemplate);
                    newHall.save(function (err, doc) {
                        assert(!err, 'Error in creating mocked hall');
                        refIds.halls.push(doc._id);
                        ecb();
                    });
                }, function () {
                    console.log('Mocked halls has been created');
                    pcb();
                });
            },
            // groups
            function (pcb) {
                async.each(mockedGroups, function (groupMockTemplate, ecb) {
                    var newGroup = new GroupModel(groupMockTemplate);
                    newGroup.save(function (err, doc) {
                        assert(!err, 'Error in creating mocked group');
                        refIds.groups.push(doc._id);
                        ecb();
                    });
                }, function () {
                    console.log('Mocked groups has been created');
                    pcb();
                });
            }
        ], function () {
            console.log('Creating mocked references is done');
            done();
        });

    };

    var getLessonTemplate = function () {

        assert(refIds.coaches.length > 0, 'Mocked coaches required');
        assert(refIds.halls.length > 0, 'Mocked halls required');
        assert(refIds.groups.length > 0, 'Mocked groups required');

        return {
            time: {
                start: new Date(2015, 5 - 1, 8, 14, 0),
                end: new Date(2015, 5 - 1, 8, 14, 30)
            },
            coaches: refIds.coaches,
            halls: refIds.halls,
            groups: refIds.groups
        };

    };

    var createMockedLesson = function (done) {

        var mockedLessonTemplate = getLessonTemplate();

        // required for created refs.
        // create refs before create mocked lesson!

        var mockedLesson = new LessonModel(mockedLessonTemplate);

        mockedLesson
            .save(function (err, doc) {
                assert(!err, 'Error in creating mocked lesson');

                mockedLesson = doc;
                done();
            });

    };

    reCreateAllMocks = function (done) {
        async.series([
            function (scb) {
                clearDb(scb); // Clearing db is done
            },
            function (scb) {
                createMockedRefs(scb); // Creating mocked references is done
            },
            function (scb) {
                createMockedLesson(scb);
            }
        ], function () {
            console.log('All mocks have been recreated');
            done();
        });
    };

    //////////////////////////////////

    beforeEach(reCreateAllMocks);

    it('should return empty array at first', function (done) {

        request(app)
            .get(URL_PREFIX)
            .expect(200)
            .end(function (err, res) {

                // result should be an empty array

                expect(res.body)
                    .to.be.an('array')
                    .and.have.length(1);

                done();

            });

    });

    describe('path validation', function () {

        var lessonMock;

        var tryToPost = function () {
            return request(app)
                .post(URL_PREFIX)
                .send(lessonMock)
        };

        beforeEach(function () {
            // every suite mocked lesson is recreating
            lessonMock = getLessonTemplate();
        });

        describe('time', function () {

            it('error if time not defined', function (done) {

                lessonMock.time = undefined;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        // error should be of ValidationError
                        expect(res.body.name).to.eql('ValidationError');

                        expect(res.body.errors['time.start'].kind).to.eql('required');
                        expect(res.body.errors['time.end'].kind).to.eql('required');

                        done();

                    });
            });

            it('error if time.start not defined', function (done) {

                lessonMock.time.start = undefined;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        // error should be of ValidationError

                        expect(res.body.name).to.eql('ValidationError');

                        expect(res.body.errors['time.start']).to.exist;
                        expect(res.body.errors['time.end']).not.to.exist;

                        done();

                    });

            });

            it('error if time.end not defined', function (done) {

                lessonMock.time.end = undefined;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        // error should be of ValidationError
                        expect(res.body.name).to.eql('ValidationError');


                        expect(res.body.errors['time.start']).not.to.exist;
                        expect(res.body.errors['time.end']).to.exist;

                        done();

                    });

            });

            it('error if time.start or .end not Date', function (done) {

                lessonMock.time = {
                    start: 'hello',
                    end: 'I am Ben'
                };

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        // error should be of ValidationError
                        expect(res.body.name).to.eql('ValidationError');


                        expect(res.body.errors['time.start'].kind).to.eql('Date');
                        expect(res.body.errors['time.end'].kind).to.eql('Date');

                        done();

                    });

            });

            it('success if time.end is greater than .end', function (done) {

                // lessonMock already has correct time

                tryToPost()
                    .expect(200)
                    .end(function () {
                        done();
                    });

            });

            it('error if time.start equals to .end', function (done) {

                lessonMock.time.end = lessonMock.time.start;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        expect(res.body.name).to.eql('ValidationError');

                        expect(res.body.errors['time.end']).to.exist;
                        expect(res.body.errors['time.end'].message).to.contain('should be greater than');

                        done();

                    });

            });

            it('error if time.start greater than .end', function (done) {

                var originalTime = lessonMock.time;

                lessonMock.time.start = originalTime.end;
                lessonMock.time.end = originalTime.start;

                tryToPost()
                    .expect(400)
                    .end(function (err, res) {

                        expect(res.body.name).to.eql('ValidationError');

                        expect(res.body.errors['time.end']).to.exist;
                        expect(res.body.errors['time.end'].message).to.contain('should be greater than');

                        done();

                    });

            });

        });

        /**
         * @param refName {string} Singular, lower case path name
         */
        var referencesSpecs = function (refName) {

            var RefModel;
            var refNamePluralized = refName.pluralize();

            return function () {

                // make check of passed reference name
                before(function () {

                    // should be defined in refIds object
                    assert(refIds[refNamePluralized],
                        'Reference ' + refNamePluralized + ' not defined in refIds object');

                    assert(models && typeof models === 'object',
                        'models object should be defined');

                    // model of particular reference should be defined in this file
                    assert(models[refName],
                        refName + ' model is not defined in models object');

                    RefModel = models[refName];

                });

                it('should create lesson with existent ' + refName, function (done) {

                    lessonMock[refNamePluralized] = refIds[refNamePluralized];

                    tryToPost()
                        .expect(201)
                        .end(function (err, res) {

                            // should resolve created lesson object
                            expect(res.body[refNamePluralized][0])
                                .to.eql(refIds[refNamePluralized][0].toString());

                            done();

                        });

                });

                it('should not create lesson with nonexistent ' + refName, function (done) {

                    lessonMock[refNamePluralized] = ['000000000000000000000000'];

                    tryToPost()
                        .expect(400)
                        .end(function (err, res) {

                            expect(res.body.name).to.eql('ValidationError');

                            // path should have validation error
                            expect(res.body.errors[refNamePluralized].message)
                                .to.eql("Some refs in `" + refNamePluralized + "` aren't exist");

                            done();

                        });

                });

                it('should not create lesson if at least one ' + refName + ' isn\'t exists', function (done) {

                    lessonMock[refNamePluralized] = refIds[refNamePluralized];
                    lessonMock[refNamePluralized].push('000000000000000000000000'); // add nonexistent ref

                    tryToPost()
                        .expect(400)
                        .end(function (err, res) {

                            expect(res.body.name).to.eql('ValidationError');

                            // path should have validation error
                            expect(res.body.errors[refNamePluralized].message)
                                .to.eql("Some refs in `" + refNamePluralized + "` aren't exist");

                            done();

                        });

                });

            };
        };

        describe('coaches', referencesSpecs('coach'));
        describe('halls', referencesSpecs('hall'));
        describe('groups', referencesSpecs('group'));

    });

});