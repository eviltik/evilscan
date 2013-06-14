var net = require('net');
var cidr = require('./cidr');
var dns = require('dns');
var async = require('async');
var program = require('commander');


var getTargets = function(target,cb) {

    if (!target) {
        return cb("Please specify at least a target using --target [cidr|ipv4|host], example:\nevilscan --target=192.168.0.0/24 --port=21,22,23,80,5900-5910");
    }

    var ips = [];

    async.series([
        function(next) {
            if (target.match(/[a-z]/i) && !target.match(/\//) && !net.isIPv6(target)) {
                dns.resolve4(target,next);
            } else {
                next(null,[[target]]);
            }
        }
    ],function(err,result) {
        if (err) {
            if (err.code=='ENOTFOUND') {
                return cb('Could not resolve '+target);
            }
            return cb(err);
        }

        target = result[0][0]+'';

        if (target.match(/\//)) {
            var ips = cidr.get(target);
            if (!ips) {
                return cb("Invalid IPv4 CIDR target. Please specify a target using --target [cidr|ip]");
            }
            return cb(null,ips);
        }

        if (net.isIPv6(target)) {
            return cb("IPv6 not supported");
        }

        if (target == '127.0.0.1') {
            return cb(null,[target]);
        }

        if (!net.isIPv4(target)) {
            return cb("Target "+target+" is not a valid IPv4");
        } else {
            return cb(null,[target]);
        }

        return cb("Target: unknow error");
    });
}


var addPortRange = function(range,ports) {
    if (!range.match(/[0-9]+\-[0-9]+/)) return;
    var sp = range.split('-');
    var start = parseInt(sp[0]);
    var end = parseInt(sp[1]);
    if (start+1 && end+1) {
        if (start == 0) start++;
        for (var i = start;i<=end;i++) {
            ports.push(i);
        }
    }
    return true;
}

var getPorts = function(port,cb) {
    var ports = [];

    if (!port) {
        return cb(null,[0]);
    }

    port+='';
    if (port.match(/^[0-9]+$/)) {
        return cb(null,[parseInt(port)]);
    }

    if (!port.match(/[0-9,\-]+/)) {
        return cb("Invalid port "+port);
    }

    port+=',';

    var p = port.split(',');
    p.forEach(function(port) {
        if (!port) return;
        if (!addPortRange(port,ports)) {
            ports.push(parseInt(port));
        }
    })

    if (ports.length) return cb(null,ports);

    return cb('Port: unknow error');
}

var defaultValues = function(argv) {
    if (!argv.concurrency) {
        argv.concurrency = 500;
    }

    if (!argv.timeout) {
        argv.timeout = 2000;
    }

    if (!argv.status) {
        argv.status = 'O';
    }

    if (argv.status.match(/T/)) {
        argv.showTimeout = true;
    }

    if (argv.status.match(/R/)) {
        argv.showRefuse = true;
    }

    if (argv.status.match(/O/)) {
        argv.showOpen = true;
    }

    if (argv.status.match(/U/)) {
        argv.showUnreachable = true;
    }

    if (!argv.scan) {
        argv.scan = 'tcpconnect';
    }

    if (argv.json) {
        argv.display = 'json';
    }

    if (argv.xml) {
        argv.display = 'xml';
    }

    if (argv.console) {
        argv.display = 'console';
    }

    if (!argv.display) {
        argv.display = 'console';
    }

    if (argv.display == 'console') {
        argv.console = true;
    }

    if (argv.display == 'json') {
        argv.json = true;
    }

    if (argv.display == 'xml') {
        argv.xml = true;
    }

    if (!argv.timeout) {
        argv.timeout = 2000;
    }
}

var help = function(optimist,argv) {
    if (!argv.port && ! argv.geo && !argv.reverse) {
        argv.help = true;
    }
    if (argv.help) {
        return optimist.showHelp();
    }

    if (argv.version||argv.about) {
        var fs = require('fs');
        var package = JSON.parse(fs.readFileSync('package.json'));
    }

    if (argv.version) {
        return console.log(package.version);
    }

    if (argv.about) {
        console.log(
            package.name,
            package.version,'\n',
            'Resume: '+package.description,'\n',
            'License: '+package.license,'\n',
            'Author: '+package.author,'\n',
            'Repository: '+package.repository.url.replace(/git/,'http')
        );
        return;
    }

}

var takeCareOfCrazyPeople = function(argv,cb) {
    var count = argv.ips.length * argv.ports.length;
    if (count>16580355 && !argv.force) {
        var msg = 'limit of 16580355 numbers of ip/port combinaison reached ('+count+')';
        msg+=', use --hugescan if you really want to go on';
        cb(msg);
        return false;
    }
    return true;
}

var parse = function(args,cb) {
    var opts = process.argv;
    if (typeof args == 'function') {
        cb = args;
    } else {
        opts = args;
    }

    var optimist = require('optimist')
        .usage('Usage: evilscan <fqdn|ipv4|cidr> [options]\n\nExample: evilscan 192.168.0.0/24 --port=21-23,80')
        .demand('_')

        .describe('port','port(s) you want to scan, examples:\n--port=80\n--port=21,22\n--port=21,22,23,5900-5902\n')
        .describe('reverse', 'display DNS reverse lookup')
        .describe('reversevalid','only display results having a valid reverse dns, except if ports specified')
        .describe('geo', 'display geoip (free maxmind)')
        .describe('banner', 'display banner')
        .describe('bannerraw', 'display raw banner (as a JSON Buffer)')
        .describe('progress', 'display progress indicator each seconds\n')
        .describe('status', 'ports status wanted in results (example --status=OT)\nT(timeout)\nR(refused)\nO(open, default)\nU(unreachable)\n')
        .describe('scan', 'scan method\ntcpconnect (full connect, default)\ntcpsyn (half opened, not yet implemented)\nudp (not yet implemented)\n')
        .describe('concurrency','max number of simultaneous socket opened\ndefault 500\n')
        .describe('timeout','maximum number of milliseconds before closing the connection\ndefault 2000\n')
        .describe('hugescan','allow number of ip/port combinaison greater than 16580355 (i.e a /24 network with port range 0-65535)')
        .describe('display', 'display result format (json,xml,console)\ndefault console\n')
        .describe('json', 'shortcut for --display=json')
        .describe('xml', 'shortcut for --display=xml')
        .describe('console', 'shortcut for --display=console')
        .describe('help','display help')
        .describe('about','display about')
        .describe('version','display version number')
        .wrap(80)

    var argv = optimist.parse(opts);

    help(optimist,argv);
    defaultValues(argv);

    async.series([
        function(next) {
            getTargets(argv._[2]||opts.target,next);
        },
        function(next) {
            getPorts(argv.port||opts.port,next);
        }
    ],function(err,result) {

        if (err) return cb(err);

        argv.ips = result[0];
        argv.ports = result[1];

        takeCareOfCrazyPeople(argv,cb);

        cb(null,argv);
    });
}


module.exports = {
    getTargets:getTargets,
    getPorts:getPorts,
    parse:parse
}
