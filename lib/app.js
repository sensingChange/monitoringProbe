
'use strict';

const crc = require('crc');
const _ = require('underscore');
const moment = require('moment-timezone');

const db = require('./lib/db');
const utils = require('./lib/utils');
    const soilTemperature = require('./lib/ds18b20');
 const luminosity = require('./lib/luminosity');
 const temperature = require('./lib/temperature');
 const ds18b20 = require('./lib/ds18b20');
let ligarRele = 0;
let controlFlow = {};
let lockedSerialPort = false;
let isReadingSensors = false;

const rpio = require('rpio');

const relayPin = 36;

let dataAtual = null;
let minutos = null;

rpio.init({
    gpiomem: false,
    mapping: 'physical'
});

setInterval(function () {
    
    try {
        console.log('Iniciou');
        var dt = new Date();

        let measurement = {
                         timestamp: new Date(),
                         ambient: {},
                         soil: {}
                     };
     
        
        soilTemperature.read(controlFlow);
        measurement.soilTemperature = yield;
        luminosity.read(controlFlow);
        measurement.ambient.luminosity = yield;

        console.log(measurement.soil.tSemperature);
        console.log(measurement.ambient.luminosity);


        
    } catch (error) {
       
    }
    }, 10000);

