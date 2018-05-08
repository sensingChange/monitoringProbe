    /**
 * Created by ibrahimnetto on 02/10/16.
 */

'use strict';

const crc = require('crc');
const _ = require('underscore');

const db = require('./lib/db');
const utils = require('./lib/utils');
const gps = require('./lib/gps');
const soilTemperature = require('./lib/ds18b20');
const luminosity = require('./lib/luminosity');
const conversor = require('./lib/conversor');
const temperature = require('./lib/temperature');
const rpio = require('rpio');
const sleep = require('system-sleep');
const getmac = require('getmac');
const request = require('superagent');
const config = require('./config');

let controlFlow = {};
let lockedSerialPort = false;
let isReadingSensors = false;


let dataAtual = null;
let minutos = null;
var macaddress;
getmac.getMac(function(err, macAddress){
    this.macaddress = macAddress;
})


setInterval(function () {

    try {

        let readSensorInterval = readSensorGenerator();
        readSensorInterval.next();
        readSensorInterval.next(readSensorInterval);

    } catch (error) {

    }
}, 15000);


setInterval(function () {
    try {
        let sendData = sendDataWebApi()
        sendData.next();
        sendData.next(sendData);
    }
    catch (error) { console.log(error); }


}, 120000);


function* sendDataWebApi() {

    try {
         let controlFlow = yield;
        db.getAllDatabaseData(controlFlow);

        var measurement = yield;
        var bffrMeasurement = [];
        if (measurement.length > 0) {
            delete measurement[0]._id;
            bffrMeasurement = [measurement[0]];

            for (let i = 1; i < measurement.length; i++) {
                delete measurement[i]._id;
                measurement[i].macaddress = macaddress;
                measurement[i].name = config.name;
                bffrMeasurement.push(measurement[i]);
                
                if (i % 10 == 0) {
                
                    request.post("http://192.168.100.106:3000/measurement")
                        .set("Accept", "application/json")
                        .send(JSON.stringify(bffrMeasurement))
                        .then(function (res) {
                            alert('yay got ' + JSON.stringify(res.body));
                        });
                    bffrMeasurement = [];
                }
            }

            if (bffrMeasurement != []) {
                request.post("http://192.168.100.106:3000/measurement")
                    .set("Accept", "application/json")
                    .send(JSON.stringify(bffrMeasurement))
                    .then(function (res) {
                        alert('yay got ' + JSON.stringify(res.body));
                    });

            }
        }

    } catch (error) {

        console.log(error);

    }
}

function* readSensorGenerator() {
    try {
        let controlFlow = yield;

        if (isReadingSensors) {
            let readingSensorsCheckIntervalId = setInterval(function () {
                if (!isReadingSensors) {
                    controlFlow.next();
                    clearInterval(readingSensorsCheckIntervalId);
                }
            }, 30000);

            yield;
        }

        isReadingSensors = true;

        let isReadingSensorsLockCheckId = setTimeout(function () {
            isReadingSensors = false;
        }, 30000);

        let measurement = {
            timestamp: new Date(),
            air: {},
            soil: {}
        };


        console.log((new Date), '\n\n\nReading sensors interval.\n\n');


        //do what you need here
        conversor.read(controlFlow);
        measurement.soil.humidity = yield;

        soilTemperature.read(controlFlow);
        measurement.soil.temperature = yield;


        luminosity.read(controlFlow);
        measurement.air.luminosity = yield;

        temperature.read(controlFlow);
        measurement.air.temperature = yield;


        measurement.timestamp = new Date();

        db.database.insert(measurement);
        console.log("\n\n\n", (new Date), "Measurement written to local database (', measurement.timestamp, ').");

        isReadingSensors = false;

    } catch (error) {
        console.error((new Date), error);

        isReadingSensors = false;
        clearTimeout(isReadingSensorsLockCheckId);
    }
}
