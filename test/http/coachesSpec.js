var request = require('supertest');
var app = require('../../max-crm-app.js');
var expect = require('chai').expect;
var CoachModel = require('../../models/coach.js');

///////////////////////////

describe('Coaches http', function () {

    var createdCoachId;
    const urlPrefix = '/v0.2/coaches/';

    // clear database
    before(function (done) {

        CoachModel.find({}).remove(done);

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

    it('should create new coach and then find him', function (done) {

        request(app)
            .post(urlPrefix)
            .send({name: 'Tommy'})
            .end(function (err, res) {

                // no errors should happened
                expect(err).to.be.a('null');

                // server should passed all necessary properties
                expect(res.body).to.have.property('_id');
                expect(res.body).to.have.property('name', 'Tommy');
                expect(res.body).to.have.property('__v', 0);

                createdCoachId = res.body._id;

                // is new coach available to GET
                request(app)
                    .get(urlPrefix + res.body._id)
                    .expect(200, done);
            });

    });

    it('should find new coach in list of coaches', function (done) {

        request(app)
            .get(urlPrefix)
            .expect(200)
            .end(function (err, res) {

                // no errors should happened
                expect(err).to.be.a('null');

                // new coach should be found
                expect(res.body).to.be.an('array').and.have.property('length', 1);
                expect(res.body[0].name).to.eql('Tommy');

                done();
            });

    });

    it('should update name property', function (done) {

        request(app)
            .put(urlPrefix + createdCoachId)
            .expect(200)
            .send({
                _id: createdCoachId,
                name: 'Chris',
                __v: 0
            })
            .end(function (err, res) {

                expect(err).to.be.a('null');

                // should resolve updated object
                expect(res.body._id).to.eql(createdCoachId);
                expect(res.body.name).to.eql('Chris');

                done();

            });

    });

});