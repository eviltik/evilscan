#!/usr/bin/env node
var cidr = require('./libs/cidr');
var portscan = require('./libs/portscan');
var printf = require('printf');
var dns = require('dns');
var argv = require('optimist').argv;
var async = require('async');
var output = require('./libs/output');
var parse = require('./libs/optionsParser');

var City = require('geoip').City;
var geoip = new City(__dirname+'/geoip/GeoLiteCity.dat');

var ips = parse.getTargets(argv.target||'127.0.0.1');
var ports = parse.getPorts(argv.port||'1-65535');

if (ips.error) {
    output(ips);
    process.exit(0);
}

if (ports.error) {
    output(ports);
    process.exit(0);
}

portscan.setSocketTimeout(argv.timeout||1000);

var li = 0;
var progress = 0;
var previousProgress = -1;
var currentIp, currentPort;
var banner = 150;
var lastMessage = 'Starting';

var geoCheck = function(args,next) {
    if (!argv.city &&! argv.country && !argv.loc) {
        return next();
    }
    geoip.lookup(args.ip,next);
}

var reverseLookup = function(args,next) {
    if (!argv.reverse) {
        return next();
    }
    dns.reverse(args.ip,next);
}


var scan = function(args,nextIteration) {

    var o = {};
    o.ip = args.ip;
    o.port = args.port;

    currentIp = args.ip;
    currentPort = args.port;

    async.series([
        function(next) {
            geoCheck(args,next);
        },

        function(next) {
            reverseLookup(args,next);
        },

        function(next) {
            portscan.isOpen(args,next);
        }

    ],function(err,arr) {

        // geolocalisation
        var geo = arr[0];
        if (argv.city || argv.loc) {
            o.city = geo.city || '';
        }

        if (argv.country || argv.loc) {
            o.country = geo.country_name || '';
        }

        if (argv.loc) {
            o.latitude = geo.latitude || '';
            o.longitude = geo.longitude || '';
        }

        // reverse
        if (argv.reverse) {
            o.reverse = arr[1][0]||'';
        }

        // scan
        var res = arr[2];

        if (res && res.status!='open') {

            if (res.status.match(/EMFILE/)) {
                output({"message":"Error: too many opened sockets, please ulimit -n 65535"});
                process.exit();
            }

            if (res.status.match(/refused/) && argv.isopen) {
                o = null;
            }
            if (res.status.match(/timeout/) && !argv.istimeout) {
                o = null;
            }
        }

        if (o) {
            o.status = res.status;
            if (argv.banner && res.banner) {
                o.banner = res.banner;
            }
            if (argv.raw) {
                o.raw = res.raw;
            }

            if (argv.showcount) {
                if (argv.ignore) {
                    o.__i = args.i;
                } else {
                    o.__i = li;
                }
                o.__max = args.max;
            }

            if (argv.output != 'json' &&! argv.json) {
                o.ip = o.ip+':'+o.port;
                delete o.port;
            }
            output(o);
        }

        nextIteration();
    });
}


var q = require('qjobs')({maxConcurrency:argv.concurrency||800});

if (argv.cidr == '127.0.0.1/24') {
    // For testing purpose, a telnet server can not
    // accept more than 50 simultaneous connection,
    // so let's make a pause between each pools
    q.setInterval(1000);
}

// Push scan jobs in the queue
var max = ips.length;
var i = 0;
while (ips.length) {
    var ip = ips.shift();
    ports.forEach(function(port) {
        if (port) q.add(scan,{ip:ip,port:port,i:i++,max:max});
    });
}

/*
q.on('jobStart',function(r) {
    console.log(r);
});
*/

/* progress indicator */

var displayProgress = function() {
    var o = q.stats();
    if (!paused) {
        o._message = lastMessage;
    } else {
        o._message = 'Paused';
        o._status='Paused';
    }

    progress = o.__progress;
    console.log(JSON.stringify(o));
}

if (argv.progress) {
    displayProgress();
    var progressTimer = setInterval(displayProgress,1000);
    q.on('end',function() {
        clearInterval(progressTimer);
        displayProgress();
    });
    q.on('jobEnd',function(args) {
        lastMessage = 'Scanned '+args.ip+':'+args.port;
    });
}

/* pause stuff */

var paused = false;
process.on('SIGUSR1',function() {
    //console.log('{"message":"Received SIGUSR1"}');
    if (!paused) {
        paused = true;
        lastMessage = 'Pause';
    } else {
        paused = false
    }
    q.pause(paused);
});

//try {
q.run();
//} catch (e) {
//    console.log(e)
//}

