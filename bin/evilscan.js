#!/usr/bin/env node
var evilscan = require('../main');
var options = require('../libs/options');
var output = require('../libs/formater');
var printf = require('printf');

options.parse(process.argv,function(err,options) {
    if (err) {
        console.log('Error: ',err);
        process.exit(0);
    }

    var scan = new evilscan(options);

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




