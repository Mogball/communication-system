const CONFIG = require('./config.js');
const socket = require('socket.io-client')(CONFIG.network_IP); // ip will probably change all the time
const readLine = require('readline');

let counter = 0;
let firstCounter = 0;
let PRINT_RATE = false;
const COUNTER_CHECK = 60;

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const cmds = {
    "ping": [function () {PRINT_RATE = true;}, "run connection test"],
    "connect": [function () {socket.emit('control', JSON.stringify({cmd: "connect", val: [1]}));}, "command to initiate arduino"],
    "start": [function () {socket.emit('control', JSON.stringify({cmd: "stop", val: [1]}));}, "command to start arduino sensors"],
    "stop": [function () {socket.emit('control', JSON.stringify({cmd: "stop", val: [0]}));}, "command to stop arduino sensors"],

    "data stop": [function () {socket.emit('save', 0);}, "start writing raw data to a file on pi"], // to start saving
    "data start": [function () {socket.emit('save', 1);}, "stop writing raw data to a file on pi"], // to stop writing to file
    "data save": [function () {socket.emit('trigger_save');}, "manually save raw out file"], // to manually trigger save into file

    // ball valve controls
    "bv on": [function () {socket.emit('control', JSON.stringify({cmd: "bv", val: [1]}));}, "turn ball valve on"],
    "bv off": [function () {socket.emit('control', JSON.stringify({cmd: "bv", val: [0]}));}, "turn ball valve off"],

    // dpr control
    "dpr on": [function () {socket.emit('control', JSON.stringify({cmd: "dpr", val: [1]}));}, "turn dpr on"],
    "dpr off": [function () {socket.emit('control', JSON.stringify({cmd: "dpr", val: [0]}));}, "turn dpr off"],

    // emergency drive control
    "drive on": [function () {socket.emit('control', JSON.stringify({cmd: "spddrive", val: [1]}));}, "turn emergency drive on"],
    "drive off": [function () {socket.emit('control', JSON.stringify({cmd: "spddrive", val: [0]}));}, "turn emergency drive off"],

    // emergency drive control
    "drop on": [function () {socket.emit('control', JSON.stringify({cmd: "ewr", val: [1]}));}, "turn emergency wheel release on"],
    "drop off": [function () {socket.emit('control', JSON.stringify({cmd: "ewr", val: [0]}));}, "turn emergency wheel release off"],

    // pod modes
    "auto on": [function () {socket.emit('control', JSON.stringify({cmd: "auto", val: [1]}));}, "enable autonomous mode"],
    "man on": [function () {socket.emit('control', JSON.stringify({cmd: "man", val: [1]}));}, "enable manual mode"],
    "start script": [function () {socket.emit('control', JSON.stringify({cmd: "scpt", val: [1]}));}, "run off script"],

    // arduino controls
    "ar rests": [function () {socket.emit('control', JSON.stringify({cmd: "rests", val: [1]}));}, "restart arduino and save states"],
    "ar restus": [function () {socket.emit('control', JSON.stringify({cmd: "restus", val: [1]}));}, "restart arduino and reset states"],

    // pod controls
    "brake on": [function () {socket.emit('control', JSON.stringify({cmd: "brk", val: [1]}));}, "turn brake on"],
    "brake off": [function () {socket.emit('control', JSON.stringify({cmd: "brk", val: [0]}));}, "turn brake off"],
    "emg on": [function () {socket.emit('control', JSON.stringify({cmd: "emg", val: [1]}));}, "turn on emergency mode"],
    "emg off": [function () {socket.emit('control', JSON.stringify({cmd: "emg", val: [0]}));}, "turn off emergency mode"],
    "speed": [function (num) {
        socket.emit('control', JSON.stringify({cmd: "spdmag", val: [num]}));
    }, "set speed (ex: to set speed to 50%, enter 'speed --50')"]
};

function main () {
    console.log("waiting for connection");

    rl.on('line', function (input) {
        try {
            if (input.substr(0, 5) === 'speed') {
                cmds.speed[0](parseInt(input.split('--')[1]));
            } else {
                cmds[input][0]();
                console.log("executing: " + cmds[input][1]);
            }
        } catch (e) {
            console.log(input + " command is not supported");
            console.log("Available commands:");
            Object.keys(cmds).forEach(function (key) {
                console.log("['" + key + "']    ", cmds[key][1]);
            });
        }
    });

    socket.on('connect', function () {
        console.log("connected");
    });

    socket.on('disconnect', function () {
        console.log("disconnected");
    });

    socket.on('message', function (data) {
        // console.log(JSON.parse(data).message);
    });

    socket.on('sensor', function (data) {
        let parsed = JSON.parse(data);

        if (parsed.sensor === 'gyro') {
            counter++;
            printHB(parsed);
        }

        if (parsed.sensor === 'start') {
            console.log("arduino connected");
        }
    });
}

function printHB(parsed) {
    if (counter === COUNTER_CHECK) {
        if (PRINT_RATE) {
            console.log("comm rate: " + (parsed.check - firstCounter) + "/" + COUNTER_CHECK);
        }
        PRINT_RATE = false;
        firstCounter = parsed.check;
        counter = 0;
    }
}

// invoking main script:
main();
