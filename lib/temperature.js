/**
 * Created by ibrahimnetto on 29/09/16.
 */

'use strict';

const dht = require('node-dht-sensor');

/*
    GPIO pinout
 */
const sensorDataPin = 26;

let temperature = {};
let initialized = dht.initialize(22, sensorDataPin);

temperature.read = function(controlFlow) {
    try
    {
    if(initialized) {
        let readout = dht.read();
        let measurement = {};

        let measurement = {
            unity: '°C',
            value: parseFloat(readout.temperature.toFixed(2))
        };
	console.log(measurement);
        // measurement.humidity = {
        //     unity: '%',
        //     value: parseFloat(readout.humidity.toFixed(2))
        // };

        setTimeout(function() {
            controlFlow.next(measurement);
        }, 1);
    }
    }
    catch(ex)
    {
         let measurement = {
            unity: '°C',
            value: 0
        };
        
        setTimeout(function() {
            controlFlow.next(measurement);
        }, 1);
    }
};

module.exports = temperature;
