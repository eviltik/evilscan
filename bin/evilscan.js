#!/usr/bin/env node
const evilscan = require('../');
const options = require('../libs/options');
const output = require('../libs/formater');
const printf = require('printf');
const argv = require('minimist2')(process.argv.slice(2));

options.parse(argv, (err, options) => {
    if (err) {
        console.log('Error: ',err);
        process.exit(0);
    }

    let scan = new evilscan(options);

    //console.log(scan.getInfo());

    scan.on('result',function(data) {
        if (!options.json) {
            process.stderr.write('\r\033[0K');
        }
        output(data,options);
    });

    scan.on('done',function() {
        if (!options.json) {
            console.log();
        }
    });

    scan.on('error',function(err) {
        console.log(err);
        process.exit(0);
    });

    scan.on('progress',function(data) {
        if (options.json) {
            output(data,options);
        } else {
            process.stderr.write('\r\033[0K'+data._message+' ('+data._jobsDone+'/'+data._jobsTotal+' '+data._progress+'%)');
        }
    });

    /*
    if (!options.json) {
        scan.on('scan',function(data) {
            process.stdout.write('\r\033[0KScanning '+data.ip+':'+data.port);
        })
    }
    */

    scan.run();
});
