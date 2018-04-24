/**
 * Created by ibrahimnetto on 29/09/16.
 */

'use strict';

const exec = require('child_process').exec;
const serialPort = require('serialport');
const rpio = require('rpio');
const nmea = require('node-nmea');


const relayPin = 40;
let dataAtual = null;
let minutos = null;
let dt;

let boolLer = false;
/*
 Physical pinout
 */
let ultimaMedida = {};

let gps = {};

rpio.init({
    gpiomem: false,
    mapping: 'physical'
});

gps.read = function(controlFlow) {

    dt = new Date();

    if(dataAtual == null || dataAtual != dt.getDate())
    {
       if(minutos == null)
       {
           console.log("ligando");
           minutos = dt.getMinutes();
           rpio.open(relayPin, rpio.OUTPUT);

           rpio.write(relayPin, rpio.HIGH);
           boolLer = true;
       }   
       else if((dt.getMinutes() > minutos + 1 || (minutos > 57) && dt.getMinutes() >1 ))
       {
           dataAtual = dt.getDate();
           minutos = null;
           //rpio.open(relayPin, rpio.OUTPUT);
           rpio.write(relayPin, rpio.LOW);
            boolLer = false;
           console.log("desligando");
       }

        let measurement;
       if(boolLer)
       {
        console.log("LIGADO");
        const serial = new serialPort('/dev/ttyS0', {
            baudrate: 9600,
            parser: serialPort.parsers.readline('\r\n')
        });
    
        serial.on('open', function (error) {
            if (error) {
                console.error(error);
            }
        });
    
        serial.on('data', function (data) {
            //console.log(data);
            let readout = nmea.parse(data);
            
            if(readout.valid) {
                if (readout.datetime && readout.loc.dmm.latitude != 0 && readout.loc.dmm.longitude != 0) {
                    exec('date -s "' + readout.datetime.toString() + '"', function(error, stdout, stderr) {
                        if (error) {
                            console.log(error);
                        } else {
                            // console.log("Set time to " + readout.datetime.toString());
                        }
                    });
                }
    
                let measurement = {
                    geoJson: {
                        type: 'Point',
                        coordinates: readout.loc.geojson.coordinates
                    },
                    dmm: {
                        latitude: parseFloat(readout.loc.dmm.latitude),
                        longitude: parseFloat(readout.loc.dmm.longitude)
                    }
                };
    
                measurement.geoJson.coordinates[0] = parseFloat(measurement.geoJson.coordinates[0].toFixed(8));
                measurement.geoJson.coordinates[1] = parseFloat(measurement.geoJson.coordinates[1].toFixed(8));
    
                ultimaMedida = measurement;
    
                console.log(measurement);
                //rpio.close(muxSelectorPin);
    
                serial.close(function (error) {
                    if (error) console.error("Erro" + error);
                    controlFlow.next(ultimaMedida);
                });
            }
        });
       }
       else
       {
         console.log(ultimaMedida);
         setTimeout(function() {
           controlFlow.next(ultimaMedida);
        }, 1);
       }
      
    }
    else
    {
      console.log(ultimaMedida);
      setTimeout(function() {
        controlFlow.next(ultimaMedida);
    }, 1);
    }

};


module.exports = gps;