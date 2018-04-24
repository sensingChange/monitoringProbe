/**
 * Created by ibrahimnetto on 02/10/16.
 */

'use strict';

const xBeeAPI = require('xbee-api');
const serialPort = require('serialport');

let xBee = {};

xBee.constants = xBeeAPI.constants;

xBee.api = new xBeeAPI.XBeeAPI({
    api_mode: 2,
});

xBee.serial = new serialPort('/dev/ttyUSB0', {
    baudrate: 115200,
    bufferSize: 2048,
    xon: true,
    xoff: true,
    platformOptions: {
        vtime: 1
    },
    parser: xBee.api.rawParser()
});

xBee.serial.on('open', function (error) {
    if (error) {
        console.error(error);
    }
});

module.exports = xBee;