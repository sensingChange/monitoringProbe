/**
 * Created by ibrahimnetto on 02/10/16.
 */

'use strict';

const crc = require('crc');
const _ = require('underscore');

const db = require('./lib/db');
const utils = require('./lib/utils');
// const gps = require('./lib/gps');
// const soilTemperature = require('./lib/ds18b20');
// const luminosity = require('./lib/luminosity');
// const conversor = require('./lib/conversor');
// const temperature = require('./lib/temperature');

 const request = require('request');
let controlFlow = {};
let lockedSerialPort = false;
let isReadingSensors = false;


let dataAtual = null;
let minutos = null;


setInterval(function () {
    
    try {
        sendDataWebApi();
        let readSensorInterval = readSensorGenerator();
        readSensorInterval.next();
        readSensorInterval.next(readSensorInterval);
        
    } catch (error) {
       
    }
// }, 900000);
  //  }, 15000);
}, 60000);


setInterval(function () {
    try{
        let sendData = sendDataWebApi()
        sendData.next();
        sendData.next(sendData);
    }
    catch(error) {console.log(error);}

    
// }, 900000);
}, 10000);


function *sendDataWebApi()
{
    try {
            console.log("enviando");
         let controlFlow = yield;
        db.getAllDatabaseData(controlFlow);
        
        var measurement = yield;
        if(measurement.length > 0 )
        {
            delete measurement[0]._id;
            let bffrMeasurement = [measurement[0]];
        
            for(let i =1;i<50;i++)
            {
                delete measurement[i]._id;
                bffrMeasurement.push(measurement[i]);
                if(i % 10 == 0)
                {
                    console.log("ENVIANDO");
                    //console.log("\n" + measurementJson);
                    request({
                        url: "192.168.100.107:3000/measurement",
                        method: "POST",
                        json: true,   // <--Very important!!!
                        body: JSON.stringify(bffrMeasurement)
                    }, function (error, response, body){
                        console.log(error,response);
                    });

                    bffrMeasurement = [];
                }
            }
            
            if(bffrMeasurement != [])
            {
                console.log("ENVIANDO");
                //console.log("\n" + measurementJson);
                request({
                    url: "http://192.168.100.107:3000/measurement",
                    method: "POST",
                    json: true,   // <--Very important!!!
                    body: bffrMeasurement
                }, function (error, response, body){
                    console.log(response);
                });
            
            }
        }
          console.log("\nenviado");
        
    } catch (error) {

     console.log(error);

    }
}

function *readSensorGenerator() {
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

        measurement = {
            timestamp: new Date(),
            air: {},
            soil: {}
        };

       
        console.log((new Date), '\n\n\nReading sensors interval.\n\n');
       
        soilTemperature.read(controlFlow);
        measurement.soil.temperature = yield;
        
        temperature.read(controlFlow);
        measurement.air.temperature = yield;
        
        luminosity.read(controlFlow);
        measurement.air.luminosity = yield;
        
        conversor.read(controlFlow);
        measurement.soil.humidity = yield;

        //  gps.read(controlFlow);
        //  measurement.gps = yield;
        measurement.timestamp = new Date();

        db.database.insert(measurement);
        console.log("\n\n\n" ,(new Date), "Measurement written to local database (', measurement.timestamp, ').");

        isReadingSensors = false;

    } catch (error) {
        console.error((new Date), error);

        isReadingSensors = false;
        clearTimeout(isReadingSensorsLockCheckId);
    }
}

// function *frameReceiveGenerator(command, frame) {
//     try {
//         let controlF;low = yield;

//         let startTime = new Date().getTime();
//         console.log((new Date), 'Sensor reading request from address [' + frame.remote16 + '].');

//         let measurement = {};

//         if (command === 48) {
//             console.log((new Date), 'Get all local database data.');

//             db.getAllDatabaseData(controlFlow);
//             measurement = yield;
//             console.log((new Date), 'Total docs = ', measurement.length, '.');
//         } else if (command === 49) {
//             console.log((new Date), 'Get last reading values from local database.');

//             db.getLastSensorReading(controlFlow);
//             measurement = yield;
//         } else if (command === 50) {

//             if (isReadingSensors) {
//                 let isReadingSensorsCheckId = setInterval(function () {
//                     if (!isReadingSensors) {
//                         clearInterval(isReadingSensorsCheckId);
//                         controlFlow.next();
//                     }
//                 }, 1000);

//                 yield;
//             }

//             isReadingSensors = true;

//             measurement = {
//                 timestamp: new Date(),
//                 ambient: {},
//                 soil: {}
//             };

//             console.log((new Date), 'Start reading sensors.');

//             // gps.read(controlFlow);
//             // measurement.gps = yield;

//             // soil.read(controlFlow);
//             // measurement.soil = yield;

//             if(ligarRele < 5)
//             {
//                 temperature.read(controlFlow,true);
//             }
//             else
//             {
//                 temperature.read(controlFlow,false);
//             }
//             measurement.ambient = yield;
//             if(ligarRele == 10)
//             {
//                 ligarRele = 0;
//             }
//             else
//             {
//                 ligarRele = ligarRele + 1;
//             }

            

//             luminosity.read(controlFlow);
//             measurement.ambient.luminosity = yield;

//             db.database.insert(measurement);

//             console.log((new Date), 'End reading sensors.');

//             isReadingSensors = false;
//         }

//         let buffer = new Buffer(JSON.stringify(measurement));
//         let response = {
//             type: xBee.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
//             destination64: frame.address64,
//             broadcastRadius: 0x00,
//             options: 0x00,
//         };

//         console.log((new Date), 'Transmitting data.');

//         let id = 1;
//         response.data = utils.getDataInfoBuffer(buffer, id);

//         if (lockedSerialPort) {
//             let checkSerialPort = setInterval(function () {
//                 if (!lockedSerialPort) {
//                     controlFlow.next();
//                     clearInterval(checkSerialPort);
//                 }
//             }, 1000);

//             yield;
//         }

//         lockedSerialPort = true;

//         xBee.serial.write(xBee.api.buildFrame(response), function (error) {
//             if (error) console.error((new Date), error);
//             lockedSerialPort = false;
//         });

//         let sequence = 0;
//         let buffers = [];

//         for (let i = 0; i < buffer.length; i += 64) {
//             let responseBuffer = buffer.slice(i, (i + 64));
//             responseBuffer = utils.prependPacketInfoBuffer(responseBuffer, id, sequence);
//             buffers.push(responseBuffer);
//             sequence++;
//         }

//         console.log((new Date), 'Buffers Array Length = ', buffers.length);

//         sequence = yield;

//         while (sequence !== -1) {
//             console.log((new Date), 'sequence = ', sequence);
//             response.data = buffers[sequence];
//             console.log((new Date), 'sequenceBufferData = ', utils.getBufferData(buffers[sequence]));

//             if (lockedSerialPort) {
//                 let checkSerialPort = setInterval(function () {
//                     if (!lockedSerialPort) {
//                         controlFlow.next();
//                         clearInterval(checkSerialPort);
//                     }
//                 }, 1000);

//                 yield;
//             }

//             lockedSerialPort = true;

//             xBee.serial.write(xBee.api.buildFrame(response), function (error) {
//                 if (error) console.error((new Date), error);
//                 lockedSerialPort = false;
//             });

//             sequence = yield;
//         }

//         if(_.isArray(measurement)) {
//             let docIds = _.pluck(measurement, '_id');

//             db.database.update({_id: {$in: docIds}}, {
//                 $set: {
//                     deleteFlag: true
//                 }
//             }, {multi: true}, function(error, numAffected) {
//                 if(error) {
//                     console.log((new Date), error);
//                 } else {
//                     console.log((new Date), 'DocIds:', docIds);
//                     console.log((new Date), 'Total updated documents with delete flag:', numAffected)
//                     console.log('');
//                 }
//             });
//         }

//         let endTime = new Date().getTime();
//         console.log((new Date), 'Data transmitted (' + (endTime - startTime) + 'ms).');
//         console.log('');

//         lockedSerialPort = false;
//     } catch (error) {
//         console.error((new Date), error);
//         lockedSerialPort = false;
//     }
// }

// function *removeAllLocalDataGenerator(frame) {
//     console.log((new Date), 'Remove all local data request from ', frame.remote16, '.');

//     try {
//         let controlFlow = yield;

//         let id = utils.getBufferId(frame.data);

//         let response = {
//             type: xBee.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
//             destination64: frame.address64,
//             broadcastRadius: 0x00,
//             options: 0x00
//         };

//         if (lockedSerialPort) {
//             let checkSerialPort = setInterval(function () {
//                 if (!lockedSerialPort) {
//                     controlFlow.next();
//                     clearInterval(checkSerialPort);
//                 }
//             }, 1000);

//             yield;
//         }

//         lockedSerialPort = true;

//         db.database.remove({deleteFlag: true}, {multi: true}, function (error, totalRemoved) {
//             if (error) {
//                 response.data = utils.getNodeCommandBuffer(11, id);
//                 console.log((new Date), error);
//             } else {
//                 response.data = utils.getNodeCommandBuffer(10, id);
//                 console.log((new Date), totalRemoved, 'documents removed.');
//                 console.log('');
//             }

//             xBee.serial.write(xBee.api.buildFrame(response), function (error) {
//                 if (error) console.error(error);
//                 lockedSerialPort = false;
//             });
//         });
//     } catch (error) {
//         console.error((new Date), error);
//         lockedSerialPort = false;
//     }
// }

// // process.on('exit', function () {
// //     process.exit();
// // });
// //
// // process.on('SIGINT', function () {
// //     process.exit();
// // });
// //
// // process.on('uncaughtException', function () {
// //     process.exit();
// // });