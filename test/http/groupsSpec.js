var request = require('supertest');
var app = require('../../max-crm-app.js');
var expect = require('chai').expect;
var HallModel = require('../../models/group.js');

///////////////////////////

describe('Halls http', function () {

    var createdObjectId;
    const urlPrefix = '/v0.2/halls/';
    var clearCollection;

    // clear database
    before(function (done) {

        clearCollection = function (done) {
            HallModel.find({}).remove(done);
        };

        clearCollection(done);

    });

    it('should response 200 & [] at start (empty)', function (done) {

        request(app)
            .get(urlPrefix)
            .expect(200)
            .end(function (err, res) {

                // should finish without errors
                expect(err).to.be.a('null');

                // result should be an empty array

                expect(res.body).to.deep.equal([]);

                done();

            });

    });

    it('should create new object and then find him', function (done) {

        request(app)
            .post(urlPrefix)
            .send({name: 'Middle'})
            .end(function (err, res) {

                // no errors should happened
                expect(err).to.be.a('null');

                // server should passed all necessary properties
                expect(res.body).to.have.property('_id');
                expect(res.body).to.have.property('name', 'Middle');
                expect(res.body).to.have.property('__v', 0);

                createdObjectId = res.body._id;

                // is new object available to GET
                request(app)
                    .get(urlPrefix + res.body._id)
                    .expect(200, done);
            });

    });

    it('should find new object in list of objects', function (done) {

        request(app)
            .get(urlPrefix)
            .expect(200)
            .end(function (err, res) {

                // no errors should happened
                expect(err).to.be.a('null');

                // new object should be found
                expect(res.body).to.be.an('array').and.have.property('length', 1);
                expect(res.body[0].name).to.eql('Middle');

                done();
            });

    });

    it('should update name property', function (done) {

        request(app)
            .put(urlPrefix + createdObjectId)
            .expect(200)
            .send({
                _id: createdObjectId,
                name: 'Big',
                __v: 0
            })
            .end(function (err, res) {

                expect(err).to.be.a('null');

                // should resolve updated object
                expect(res.body._id).to.eql(createdObjectId);
                expect(res.body.name).to.eql('Big');

                done();

            });

    });

    it('should delete object', function (done) {

        request(app)
            .del(urlPrefix + createdObjectId)
            .expect(204) // No Content
            .end(function (err) {
                expect(err).to.be.a('null');

                // check nonexistence
                request(app)
                    .get(urlPrefix + createdObjectId)
                    .expect(404, done);

            })

    });

    describe('validation', function () {

        beforeEach(function (done) {
            clearCollection(done);
        });

        it('should resolve with error if name did not passed', function (done) {

            //noinspection JSUnresolvedFunction
            request(app)
                .post(urlPrefix)
                .send({})
                .expect(400)
                .end(function (err, res) {
                    /* jshint expr:true */
                    /** @namespace res.body.errors */
                    expect(res.body.errors.name.kind).to.eql('required');
                    done();
                });

        });

        it('should not create two identical objects', function (done) {

            request(app)
                .post(urlPrefix)
                .send({name: 'Middle'})
                .expect(201)
                .end(function (err, res) {

                    expect(res.body.name).to.eql('Middle');

                    request(app)
                        .post(urlPrefix)
                        .send({name: 'Middle'})
                        .expect(400, done);

                });

        });

    });

});