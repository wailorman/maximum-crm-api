var validationTools = require('../../tools/validation-tools');
var ObjectId = require('mongoose').Types.ObjectId;
var expect = require('chai').expect;
var mongooseMock = require('mongoose-mock');
var sinon = require('sinon');
var mongoose = require('mongoose');
var MongooseError = require('../../node_modules/mongoose/lib/error');

describe('Validation Tools', function () {

    describe('isAllItemsInArrayAreObjectIds()', function () {

        var mockedArray;

        var isAllItemsInArrayAreObjectIds = validationTools.isAllItemsInArrayAreObjectIds;

        beforeEach(function () {
            mockedArray = [new ObjectId('9365920573b95a73d0c58f00'), new ObjectId('7427a502ca47bf5dd9303857')];
        });

        it('should return true if all items are ObjectIds', function () {

            expect(isAllItemsInArrayAreObjectIds(mockedArray)).to.eql(true);

        });

        it('should return true if passed empty array', function () {

            mockedArray = [];
            expect(isAllItemsInArrayAreObjectIds(mockedArray)).to.eql(true);

        });

        it('should return false if passed string as argument', function () {

            mockedArray = 'heeey macarena';
            expect(isAllItemsInArrayAreObjectIds(mockedArray)).to.eql(false);

        });

        it('should return false if at least one item is not ObjectId', function () {

            mockedArray[0] = 'heeey macarena';
            expect(isAllItemsInArrayAreObjectIds(mockedArray)).to.eql(false);

        });

    });

    describe('checkRefExistence', function () {

        var checkRefExistence = validationTools.checkRefExistence;

        var mockedSchema = new mongooseMock.Schema({
            name: {type: String}
        });

        var mockedModel = mongooseMock.model('Mock', mockedSchema);

        var mockedDocuments;
        beforeEach(function () {
            mockedDocuments = [
                new mockedModel({name: 'First'}),
                new mockedModel({name: 'Second'})
            ];
        });

        var mockedArrayOfIds;
        beforeEach(function () {
            mockedArrayOfIds = [new ObjectId('9365920573b95a73d0c58f00'), new ObjectId('7427a502ca47bf5dd9303857')];
        });

        var callback = sinon.spy();
        beforeEach(function () {
            callback.reset();
        });

        var mongoosePromiseStub = {
            exec: sinon.stub()
        };
        beforeEach(function () {
            // to be able to use Model.find().exec(...)
            mockedModel.find.returns(mongoosePromiseStub);
        });

        it('should resolve true when val is empty array', function (done) {

            checkRefExistence(mockedModel)([], callback);

            mongoosePromiseStub.exec.callArgWith(0, null, []);

            process.nextTick(function () {
                callback.getCall(0).calledWith(true);
                done();
            });

        });

        it('should throw err when val is string', function () {

            expect(function () {
                checkRefExistence(mockedModel)('hey', callback);
            }).to.throw('val should be an array');

        });

        it('should throw err if at least one item in array is non-ObjectId', function () {

            mockedArrayOfIds[0] = 'hey';

            expect(function () {
                checkRefExistence(mockedModel)(mockedArrayOfIds, callback);
            }).to.throw('Some item(s) of val array is not ObjectId');

        });

        it('should resolve true array of existent refs', function (done) {

            checkRefExistence(mockedModel)([], callback);
            mongoosePromiseStub.exec.callArgWith(0, null, mockedDocuments);

            process.nextTick(function () {
                callback.lastCall.calledWith(true);
                done();
            });

        });

        it('should not accept array with at least one nonexistent item', function (done) {

            delete mockedDocuments[1];

            checkRefExistence(mockedModel)([], callback);
            mongoosePromiseStub.exec.callArgWith(0, null, mockedDocuments);

            process.nextTick(function () {
                callback.lastCall.calledWith(false);
                done();
            });

        });

        it('should throw mongoose error', function () {

            var mockedMongooseError = new MongooseError('Something went wrong');

            checkRefExistence(mockedModel)([], callback);
            expect(function () {
                mongoosePromiseStub.exec.callArgWith(0, mockedMongooseError)
            }).to.throw('Something went wrong');

        });

    });

});