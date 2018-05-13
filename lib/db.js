/**
 * Created by ibrahimnetto on 10/10/16.
 */

'use strict';

const nedb = require('nedb');
const fs = require('fs');

var database = new nedb({filename: '../db/node.db', autoload: true});
const db = {};

db.database = database;

db.getAllDatabaseData = function(controlFlowApi) {
    database = new nedb({filename: '../db/node.db', autoload: true});
    database.find({}, {deleteFlag: 0}).exec(function(err, docs) {
    
        controlFlowApi.next(docs);
    });
};

db.getLastSensorReading = function(controlFlow) {
    database.find({}).sort({timeStamp: -1}).limit(1).exec(function(err, doc) {
        controlFlow.next(doc[0]);
    });
};

db.removeAll = function(controlFlow)
{
    fs.writeFile('../db/node.db', '', function(){controlFlow.next(true);})
};

module.exports = db;