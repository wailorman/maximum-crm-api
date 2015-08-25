var assert = require('assert');
var ObjectId = require('mongoose').Types.ObjectId;


/**
 * Make sure that all items in array are ObjectIds
 *
 * @param array {Array.<ObjectId>}
 * @returns {boolean}
 */
module.exports.isAllItemsInArrayAreObjectIds = function (array) {
    if (!(array instanceof Array)) return false;

    for (var i = 0; array.hasOwnProperty(i); i++) {
        var item = array[i];

        var isItemTypeConsidering = item instanceof ObjectId || typeof item === 'number' || typeof item === 'string';

        if (!isItemTypeConsidering) return false;


        // if item already instance of ObjectId
        if (item instanceof ObjectId)
            continue; // go to the next item. Item is absolutely valid

        // if item is not valid ObjectId
        if (ObjectId.isValid(item) == false)
            return false; // break for and return false
    }

    // if all items are valid return true
    return true;
};

//////////  checkRefExistence   ////////////
// This function will be used to be sure that passed refs is correct

/**
 * Mongoose validator.
 * Validate model references to existence.
 *
 * @example
 * ```
 * var CoachModel = require('../models/coach.js');
 * ...
 * lessonSchema.path('coaches').validate( checkRefExistence(CoachModel), 'Some of coaches aren't exist' );
 * ```
 *
 * @throws {AssertionError} val should be an array
 * @throws {AssertionError} Some item(s) of val array is not ObjectId
 *
 * @param Model
 * @returns {Function}
 */
module.exports.checkRefExistence = function (Model) {

    // val is an array. Array of ref IDs

    var isAllItemsInArrayAreObjectIds = module.exports.isAllItemsInArrayAreObjectIds;

    return function (val, next) {

        // val -- array of ObjectIds

        // next() callback get one boolean argument
        // true -- if array of refs are valid
        // false -- if not

        // make sure that val is Array.
        // val variable was validated by mongoose built-in validator.
        // he promise that val will be an array
        assert(val instanceof Array, 'val should be an array');

        // make sure that all items of val is ObjectId.
        // mongoose built-in validator promise that all items in array are ObjectIds.
        assert(isAllItemsInArrayAreObjectIds(val), 'Some item(s) of val array is not ObjectId');

        // get all documents via $or.
        Model.find({$or: val}).exec(function (err, docs) {
            assert.ifError(err);

            // if count of resolved docs == val.length -- all refs are exist
            if (docs.length === val.length) {
                next(true); // all refs are exist
            }
            // else return false
            else{
                next(false); // some refs are not exists
            }
        });

    };

};