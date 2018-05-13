

'use strict';

const crc = require('crc');
const _ = require('underscore');

const db = require('./lib/db');
const utils = require('./lib/utils');
const gps = require('./lib/gps');
const soilTemperature = require('./lib/ds18b20');
const luminosity = require('./lib/luminosity');
const soilMosture = require('./lib/soilMosture');
const dht22 = require('./lib/dht22');
const rpio = require('rpio');
const sleep = require('system-sleep');
const getmac = require('getmac');
const request = require('superagent');
const config = require('./config');

let controlFlow = {};
let lockedSerialPort = false;
let isReadingSensors = false;
var apiInterval = 45000;
var lastComm;
let dataAtual = null;
let minutos = null;
var macaddress;
getmac.getMac(function(err, macAddress){
    macaddress = macAddress;
})


setInterval(function () {

    try {

        let readSensorInterval = readSensorGenerator();
        readSensorInterval.next();
        readSensorInterval.next(readSensorInterval);

    } catch (error) {

    }
}, 15000);


// setInterval(function () {
//     try {
//         let sendData = sendDataWebApi()
//         sendData.next();
//         sendData.next(sendData);
//     }
//     catch (error) { console.log(error); }


// }, 120000);


function * sendDataWebApi() {

    try {
        console.log("entrou codigo");
         let controlFlowApi = yield;

        db.getAllDatabaseData(controlFlowApi);

        var measurement = yield;
        console.log(measurement);
        var bffrMeasurement = [];
        if (measurement.length > 0) {

            
            delete measurement[0]._id;
            bffrMeasurement = [measurement[0]];

            for (let i = 1; i < measurement.length; i++) {
                if(measurement[i].gps == {})
                    delete measurement[i].gps;

                delete measurement[i]._id;

                measurement[i].macaddress = macaddress;
                measurement[i].name = config.name;

                bffrMeasurement.push(measurement[i]);
                
                if (i % 10 == 0) {
                
                    request.post("http://192.168.100.106:3000/measurement")
                        .set("Content-type", "application/json")
                        .send(JSON.stringify(bffrMeasurement))
                        .then(function (res) {
                        });
                    bffrMeasurement = [];
                }
            }

            if (bffrMeasurement != []) {
                request.post("http://192.168.100.106:3000/measurement")
                    .set("Content-type", "application/json")
                    .send(JSON.stringify(bffrMeasurement))
                    .then(function (res) {
                        alert('yay got ' + JSON.stringify(res.body));
                    });

            }
        }
        db.removeAll(controlFlowApi);
        yield;
        

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
        soilMosture.read(controlFlow);
        measurement.soil.humidity = yield;

        soilTemperature.read(controlFlow);
        measurement.soil.temperature = yield;

        luminosity.read(controlFlow);
        measurement.luminosity = yield;

        dht22.read(controlFlow);
        measurement.air = yield;

        gps.read(controlFlow);
        measurement.gps = yield;

        console.log(measurement);

        measurement.timestamp = new Date();

        db.database.insert(measurement);
        console.log("\n\n\n", (new Date), "Measurement written to local database (', measurement.timestamp, ').");

        if(lastComm == null)
        {
            lastComm = new Date();
        }
        else 
        {
            let diff = Math.abs(lastComm.getTime() - new Date().getTime());
            console.log(diff);            
            if(diff > apiInterval)
            {

            let sendData = sendDataWebApi(controlFlow);
            sendData.next();
                sendData.next(sendData);

                 yield;
                 lastComm = new Date();
            }
        }

        

        isReadingSensors = false;

    } catch (error) {
        console.error((new Date), error);

        isReadingSensors = false;
        clearTimeout(isReadingSensorsLockCheckId);
    }
}
