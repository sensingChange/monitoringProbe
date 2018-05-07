/**
 * Created by ibrahimnetto on 10/10/16.
 */

'use strict';

const nedb = require('nedb');

const database = new nedb({filename: '/home/pi/monitoring-node/db/node.db', autoload: true});
const db = {};

db.database = database;

db.getAllDatabaseData = function(controlFlow) {
    database.find({}, {deleteFlag: 0}).exec(function(err, docs) {
        controlFlow.next(docs);
    });
};

db.getLastSensorReading = function(controlFlow) {
    database.find({}).sort({timeStamp: -1}).limit(1).exec(function(err, doc) {
        controlFlow.next(doc[0]);
    });
};

module.exports = db;