#!/usr/bin/env node
const Evilscan = require('../src/');
const options = require('../src/libs/options');
const output = require('../src/libs/formater');
const argv = require('minimist2')(process.argv.slice(2));

const emptyLine = ''.padEnd(process.stdout.columns, ' ');

function runScan(options) {

    let count = 0;

    function resetLine() {
        if (options.json) return;
        process.stdout.write(`${emptyLine}\r`);
    }

    function onResult(data) {
        count++;
        resetLine();
        output(data, options);
    }

    function onDone() {
        if (options.json) return;
        if (!options.progress) return;
        if (!count) {
            resetLine();
            console.log('done, nothing found');
        } else {
            console.log(`done, ${count} result(s)`);
        }
    }

    function onError(err) {
        resetLine();
        if (err.message) {
            console.log(err.message);
        } else {
            console.log(err);
        }
        process.exit(1);
    }

    function onProgress(data) {
        if (options.json) {
            output(data, options);
        } else {
            resetLine();
            process.stdout.write(`${data._message} (${data._jobsDone}/${data._jobsTotal} ${data._progress}%)\r`);
        }
    }

    const evilscan = new Evilscan(options);

    evilscan.on('result', onResult);
    evilscan.on('done', onDone);
    evilscan.on('error', onError);
    evilscan.on('progress', onProgress);

    evilscan.run();
}

function onOptionParsed(err, options) {

    if (err) {
        console.log(err);
        process.exit(1);
    }

    if (!options.json) {
        process.stdout.write('Preparing scan, please wait ...\r');
    }

    runScan(options);
}

options.parse(argv, onOptionParsed);
