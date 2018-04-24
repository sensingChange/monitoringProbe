/**
 * Created by ibrahimnetto on 29/09/16.
 */

'use strict';

const dht = require('node-dht-sensor');

/*
    GPIO pinout
 */
const sensorDataPin = 20;

let temperature = {};
let initialized = dht.initialize(22, sensorDataPin);

temperature.read = function(controlFlow) {
    if(initialized) {
        let readout = dht.read();
        let measurement = {};

        measurement.temperature = {
            unity: '°C',
            value: parseFloat(readout.temperature.toFixed(2))
        };

        // measurement.humidity = {
        //     unity: '%',
        //     value: parseFloat(readout.humidity.toFixed(2))
        // };

        setTimeout(function() {
            controlFlow.next(measurement);
        }, 1);
    }
};

module.exports = temperature;