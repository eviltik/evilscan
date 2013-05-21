#!/usr/bin/env node
var cidr = require('./libs/cidr');
var portscan = require('./libs/portscan');
var printf = require('printf');
var dns = require('dns');
var argv = require('optimist').argv;
var Step = require('step');
var async = require('async');

var City = require('geoip').City;
var geoip = new City(__dirname+'/geoip/GeoLiteCity.dat');

if (!argv.cidr&&!argv.host) {
    console.log('{"error":"Please specify at list a CIDR range"}');
    process.exit();
}

var ips = [];
if (argv.host) {
    ips.push(argv.host);
} else {
    if (!argv.cidr.match(/\//)) {
        ips.push(argv.cidr);
    } else {
        ips = cidr.get(argv.cidr);
    }
}

portscan.setSocketTimeout(argv.timeout||1000);

var li = 0;
var progress = 0;
var previousProgress = -1;
var currentIp, currentPort;
var banner = 150;
var lastMessage = 'Starting';

var scan = function(args,nextIteration) {

    var o = {};
    o.ip = args.ip;
    o.port = args.port;

    currentIp = args.ip;
    currentPort = args.port;

    Step(
        function() {
            if (argv.nocity && !argv.nocountry && !argv.noloc) return this();
            geoip.lookup(args.ip,this);
        },
        function(err,res) {
            if (res) {
                if (!argv.nocity) {
                    o.city = res.city||'N/A';
                }
                if (!argv.nocountry) {
                    o.country = res.country_name||'N/A';
                }
                if (!argv.noloc) {
                    o.latitude = res.latitude||'N/A';
                    o.longitude = res.longitude||'N/A';
                }
            }
            this();
        },
        function() {
            if (argv.noreverse) return this();
            dns.reverse(args.ip,this);
        },
        function(err,domains) {
            if (argv.noreverse) return this();

            o.reverse = o.ip;
            if (domains && domains.length) {
                o.reverse = domains[0];
            }
            this();
        },
        function() {
            if (!argv.port) return this();
            portscan.isOpen(args.ip,args.port,this);
        },
        function(err,res) {

            if (!argv.port) return this();

            if (err) {
                var msg = err.code+'';
                if (err.code == 'EMFILE') {
                    console.log('{"message":"Error: too many opened sockets, please ulimit -n 65535"}');
                    process.exit();
                }
            }

            if (!res.isOpen) {
                if (argv.ignore) {
                    o = null;
                    return this();
                } else {
                    o.response='closed';
                }
            }

            var odata = res.data;
            var data = new (require('string_decoder').StringDecoder)('utf-8').write(res.data);
            data = data.toString().replace(/[\t\r\n ]/gm,' ');
            var e = data.match(/([a-z0-9'":%]+)/gi);
            if (e) {
                data = e.join(' ');
                o.response = data.substr(0,banner);
            } else {
                o.response = data;
            }
            this();
        },
        function(err) {
            li++;

            if (o) {
                if (argv.showcount) {
                    if (argv.ignore) {
                        o.__i = args.i;
                    } else {
                        o.__i = li;
                    }
                    o.__max = args.max;
                }
                /*
                if (argv.progress) {
                    var qs = q.stats();
                    o.__progress = progress;
                    o.__jobsTotal = qs.__jobsTotal;
                    o.__jobsDone = qs.__jobsDone;
                    o.__jobsRunning = qs.__jobsRunning;
                    o.__timeStart = qs.__timeStart;
                }*/

                // Output
                console.log(JSON.stringify(o));
            }
            nextIteration();
        }
    );
}

var q = new require('qjobs');
q.setConcurrency(argv.concurrency||5000);

var max = ips.length;
var i = 0;
if (argv.port) argv.port+=',';

while (ips.length) {
    var ip = ips.shift();
    argv.port.split(',').forEach(function(port) {
        if (port) q.add(scan,{ip:ip,port:port,i:i++,max:max});
    });
}

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

