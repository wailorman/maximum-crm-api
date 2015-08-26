var validationTools = require('../../tools/validation-tools');
var ObjectId = require('mongoose').Types.ObjectId;
var expect = require('chai').expect;
var mongooseMock = require('mongoose-mock');
var sinon = require('sinon');
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

        var mockedArrayOfIds;
        beforeEach(function () {
            mockedArrayOfIds = [new ObjectId('9365920573b95a73d0c58f00'), new ObjectId('7427a502ca47bf5dd9303857')];
        });

        var mockedDocuments;
        beforeEach(function () {
            mockedDocuments = [
                new mockedModel({
                    _id: mockedArrayOfIds[0],
                    name: 'First'
                }),
                new mockedModel({
                    _id: mockedArrayOfIds[1],
                    name: 'Second'
                })
            ];
        });

        var callback = sinon.spy();
        beforeEach(function () {
            callback.reset();
        });

        var mongoosePromiseStub = {
            exec: sinon.stub()
        };
        beforeEach(function () {
            // to be able to use Model.find(...).exec(...)
            mockedModel.find.returns(mongoosePromiseStub);
        });

        it('should resolve true if empty array was passed. And should not call mongo', function (done) {

            checkRefExistence(mockedModel)([], callback);

            expect(mockedModel.find.getCalls().length).to.eql(0);

            process.nextTick(function () {
                // expect next(true) called
                callback.lastCall.calledWith(true);
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

        it('should make correct query', function () {

            checkRefExistence(mockedModel)(mockedArrayOfIds, callback);

            var expectedQuery = { '_id': { $in: mockedArrayOfIds} };

            mockedModel.find.getCall(0).calledWith(expectedQuery);
            mongoosePromiseStub.exec.callArgWith(0, null, mockedDocuments);

        });

        it('should resolve true if all refs in array are exist', function (done) {

            checkRefExistence(mockedModel)(mockedArrayOfIds, callback);
            mongoosePromiseStub.exec.callArgWith(0, null, mockedDocuments);

            process.nextTick(function () {
                // expect next(true) called
                callback.lastCall.calledWith(true);
                done();
            });

        });

        it('should not accept array with at least one nonexistent item', function (done) {

            // remove one document from mock
            delete mockedDocuments[1];

            checkRefExistence(mockedModel)(mockedArrayOfIds, callback);

            // resolve documents
            mongoosePromiseStub.exec.callArgWith(0, null, mockedDocuments);

            process.nextTick(function () {
                // expect next(false) called
                callback.lastCall.calledWith(false);
                done();
            });

        });

        it('should throw mongoose error', function () {

            var mockedMongooseError = new MongooseError('Something went wrong');

            checkRefExistence(mockedModel)(mockedArrayOfIds, callback);
            expect(function () {
                // emulate Mongo error
                // call .exec() promise with error argument
                mongoosePromiseStub.exec.callArgWith(0, mockedMongooseError);
            }).to.throw('Something went wrong');

        });

    });

});