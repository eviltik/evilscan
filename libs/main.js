#!/usr/bin/env node
var cidr = require('./cidr');
var portscan = require('./portscan');
var printf = require('printf');
var dns = require('dns');
var async = require('async');
var output = require('./output');
var options = require('./options');

var City = require('geoip').City;
var geoip = new City(__dirname+'/../geoip/GeoLiteCity.dat');

var ips,ports;
var li = 0;
var progress = 0;
var previousProgress = -1;
var currentIp, currentPort;
var banner = 150;
var lastMessage = 'Starting';
var progressTimer;

var scan = function(args,nextIteration) {

    var o = {};
    o.ip = args.ip;
    o.port = args.port;

    currentIp = args.ip;
    currentPort = args.port;

    async.series([
        function(next) {
            if (!argv.geo) return next();
            geoip.lookup(args.ip,next);
        },

        function(next) {
            if (!argv.reverse) return next();
            dns.reverse(args.ip,function(err,domains) {
                if (err) return next(null);
                if (!domains.length) return next(null);
                next(null,domains[0]);
            });
        },

        function(next) {
            if (o.port == 0) return next();
            portscan.isOpen(args,next);
        }

    ],function(err,arr) {

        // geolocalisation
        var geo = arr[0];

        if (argv.geo) {
            o.city = '';
            o.country = '';
            o.latitude = '';
            o.longitude = '';
            if (geo) {
                o.city = geo.city || '';
                o.country = geo.country_name || '';
                o.latitude = geo.latitude || '';
                o.longitude = geo.longitude || '';
            }
        }

        // reverse
        if (argv.reverse) {
            o.reverse = '';
            if (arr[1]) {
                o.reverse = arr[1];
                //console.log(o.ip,o.reverse,JSON.stringify(arr[2]));
            }
        }

        if (o && o.port == 0 && !argv.reverse) {
            argv.showall = true;
            delete o.port;
            if (!argv.json) process.stdout.write('\r\033[0K');
            output(o);
            return nextIteration();
        }

        // scan
        var res = arr[2];
        if (res && o) {

            o.status = res.status;
            if (argv.banner && res.banner) {
                o.banner = res.banner;
            }
            if (argv.raw) {
                o.raw = res.raw;
            }

            if (argv.output != 'json' &&! argv.json) {
                o.ip = o.ip+':'+o.port;
                delete o.port;
            }

            if (res.status!='open') {

                if (res.status.match(/EMFILE/)) {
                    output({"message":"Error: too many opened sockets, please ulimit -n 65535"});
                    process.exit();
                }

                if (!argv.isclose) {
                    if (res.status.match(/refused/) && !argv.isrefuse) {
                        o = null;
                    }
                    if (res.status.match(/timeout/) && !argv.istimeout) {
                        o = null;
                    }
                    if (res.status.match(/unreachable/) && !argv.isunreachable) {
                        o = null;
                    }
                }
            }

            if (res.status == 'open' && argv.isopen == 'false') {
                o = null;
            }
        }

        if (argv.reverse) {
            if (o) {
                if (o.port == 0) {
                    delete o.port;
                    if (o.reverse == '') {
                        return nextIteration();
                    }
                } else {
                    if (o.status == undefined) {
                        return nextIteration();
                    }
                }
            }
        }

        if (o) {
            if (!argv.json) process.stdout.write('\r\033[0K');
            output(o);
        }

        nextIteration();
    });
}


var start = function(argv) {

    var q = require('qjobs')({maxConcurrency:argv.concurrency||500});
    portscan.setSocketTimeout(argv.timeout||1000);

    if (argv.ips.length == 1 && argv.ips[0].match(/^127.0.0.1\//)) {
        // For testing purpose, a telnet server can not
        // accept more than 50 simultaneous connection,
        // so let's make a pause between each pools
        q.setInterval(1000);
    }

    // Push scan jobs in the queue
    var max = argv.ips.length;
    var i = 0;
    while (argv.ips.length) {
        var ip = argv.ips.shift();
        argv.ports.forEach(function(port) {
            q.add(scan,{ip:ip,port:port,i:i++,max:max});
        });
    }

    /* progress indicator */
    var displayProgress = function() {
        var o = q.stats();
        if (!paused) {
            o._message = lastMessage;
        } else {
            o._message = 'Paused';
            o._status = 'Paused';
        }

        progress = o._progress;
        if (argv.json) {
            console.log(JSON.stringify(o));
        } else {
            process.stdout.write(printf("\r%s (%s%)",lastMessage,o._progress));
        }
    }

    if (argv.progress) {
        displayProgress();
        progressTimer = setInterval(displayProgress,1000);
        q.on('end',function() {
            clearInterval(progressTimer);
            displayProgress();
            if (!argv.json) console.log();
        });

        q.on('jobEnd',function(args) {
            var str = args.ip;
            if (args.port!=0) str+=':'+args.port;
            lastMessage = 'Scanned '+str;
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

    q.run();
}

var run = function(opts) {
    options.parse(opts,function(err,options) {
        if (err) {
            console.log('Error: ',err);
            process.exit(0);
        }
        start(options);
    });
}

module.exports = {
    run:run
}