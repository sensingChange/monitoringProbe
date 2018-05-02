/**
 * Created by ibrahimnetto on 29/09/16.
 */

'use strict';

const serialPort = require('serialport');
const rpio = require('rpio');
const sensor = require('ds18b20');
/*
    Physical pinout
 */


let ds18b20 = {};



ds18b20.read = function(controlFlow) {
    sensor.temperature('28-01162e6617ee', function (err, value) {

       let measurement = {
            unity: '°C',
            value: parseFloat(value)
        };
        controlFlow.next(measurement);
    });
};

module.exports = ds18b20;