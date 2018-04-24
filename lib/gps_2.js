/**
 * Created by ibrahimnetto on 29/09/16.
 */

'use strict';

const exec = require('child_process').exec;
const serialPort = require('serialport');
const rpio = require('rpio');
const nmea = require('node-nmea');
const crc = require('crc');
let serial = null;

/*
 Physical pinout
 */

const relayPin = 36;

let gps = {};

rpio.init({
    gpiomem: false,
    mapping: 'physical'
});

gps.read = function() {

  

    try
    {
        serial.close(function (error) {
        });

    } catch (e) {

    }

        
          serial = new serialPort('/dev/ttyS0', {
            baudrate: 9600,
            parser: serialPort.parsers.readline('\r\n')
        });
        
        // rpio.open(muxSelectorPin, rpio.OUTPUT);
        // rpio.write(muxSelectorPin, rpio.HIGH);

          
        serial.on('open', function (error) {
            if (error) {
                console.error(error);
            }
        });

        

          setTimeout(LerGps,2000);
    
};

function LerGps()
{
    console.log("Lendo");  


    serial.on('data', function (data) {
        console.log(data);

        serial.close(function (error) {
            if (error) console.error(error);
        });


        
        
      
    });
   
 
}

module.exports = gps;