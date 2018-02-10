const net = require('net');
const cidr = require('./cidr');
const dns = require('dns');
const async = require('async');
const findup = require('findup-sync');
const fs = require('fs');

function getTargets(target, callback) {

    if (!target) {
        return callback("Please specify at least a target [cidr|ipv4|host], example:\nevilscan 192.168.0.0/24 --port=21,22,23,80,5900-5910");
    }

    let ips = [];

    async.series([
        (next) => {
            if (target.match(/[a-z]/i) && !target.match(/\//) && !net.isIPv6(target)) {
                dns.resolve4(target, next);
            } else {
                next(null,[[target]]);
            }
        }
    ],(err,result) => {
        if (err) {
            if (err.code=='ENOTFOUND') {
                return callback('Could not resolve '+target);
            }
            return callback(err);
        }

        target = result[0][0]+'';

        if (target.match(/\-/)) {
            let splitTarget = target.split('-');
            let minHost = splitTarget[0];
            let ips = [];
            let splitMinHost, maxHost;

            if (net.isIPv4(minHost)) {
                splitMinHost = minHost.split('.');
                if (net.isIPv4(splitTarget[1])) {
                    maxHost = splitTarget[1].split('.')[3];
                } else {
                    // Check if the string is a positive integer
                    if (splitTarget[1] >>> 0 === parseFloat(splitTarget[1])) {
                        maxHost = splitTarget[1];
                    } else {
                        return callback("Invalid IPv4 target range, ie: 192.168.0.1-5, 192.168.0.1-192.168.0.5");
                    }
                }
            } else {
                return callback("Invalid IPv4 target. ie: 192.168.0.1-5, 192.168.0.1-192.168.0.5");
            }

            for (i = parseInt(splitMinHost[3]); i <= parseInt(maxHost); i++) {
                ips.push(splitMinHost[0] + '.' + splitMinHost[1] + '.' + splitMinHost[2] + '.' + i);
            }

            if (!ips) {
                return callback("Invalid IPv4 target. Please specify a target using --target [cidr|ip|range]");
            }

            return callback(null,ips);
        }

        if (target.match(/\//)) {
            let ips = cidr.get(target);
            if (!ips) {
                return callback("Invalid IPv4 CIDR target. Please specify a target using --target [cidr|ip|range]");
            }
            return callback(null,ips);
        }

        if (net.isIPv6(target)) {
            return callback("IPv6 not supported");
        }

        if (target == '127.0.0.1') {
            return callback(null,[target]);
        }

        if (!net.isIPv4(target)) {
            return callback("Target "+target+" is not a valid IPv4");
        } else {
            return callback(null,[target]);
        }

        return callback("Target: unknow error");
    });
};

function addPortRange(range, ports) {
    if (!range.match(/[0-9]+\-[0-9]+/)) return;
    let sp = range.split('-');
    let start = parseInt(sp[0]);
    let end = parseInt(sp[1]);
    if (start+1 && end+1) {
        if (start == 0) start++;
        for (let i = start;i<=end;i++) {
            ports.push(i);
        }
    }
    return true;
};

function getPorts(port, callback) {
    var ports = [];

    if (!port) {
        return callback(null,[0]);
    }

    port+='';
    if (port.match(/^[0-9]+$/)) {
        return callback(null,[parseInt(port)]);
    }

    if (!port.match(/[0-9,\-]+/)) {
        return callback("Invalid port "+port);
    }

    port+=',';

    let p = port.split(',');
    p.forEach(function(port) {
        if (!port) return;
        if (!addPortRange(port,ports)) {
            ports.push(parseInt(port));
        }
    });

    if (ports.length) return callback(null,ports);

    return callback('Port: unknow error');
};

function defaultValues(argv) {
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

    return argv;
};

function help(args) {

    if (args.help) {
        console.log(fs.readFileSync(findup('help.txt')).toString());
        process.exit(0);
    }

    let packageInfo = {};

    if (args.version||args.about) {
        packageInfo = JSON.parse(fs.readFileSync(findup('package.json')));
    }

    if (args.version) {
        console.log(packageInfo.version);
        process.exit(0);
    }

    if (args.about) {
        console.log('%s v%s', packageInfo.name, packageInfo.version, packageInfo.description);
        console.log('License: %s', packageInfo.license);
        console.log('Author: %s', packageInfo.author);
        console.log('Repository: %s',packageInfo.repository.url.replace(/git/,'http'));
        process.exit(0);
    }
};

function takeCareOfCrazyPeople(args, callback) {
    let count = args.ips.length * args.ports.length;
    if (count>16580355) {
        let msg = 'limit of 16580355 numbers of ip/port combinaison reached ('+count+')';
        msg+=', see https://github.com/eviltik/evilscan/issues/25 for more information';
        callback(msg);
        return false;
    }
    return true;
};

function parse(args, callback) {

    help(args);

    args = defaultValues(args);

    async.series([
        (next) => {
            getTargets(args.target||args._[0], next);
        },
        (next) => {
            getPorts(args.port, next);
        }
    ], (err, result) => {

        if (err) return callback(err, args);

        args.ips = result[0];
        args.ports = result[1];

        if (!args.port && !args.reverse && !args.geo) {
            return callback('Please specify at least one port, --port=80', args);
        }

        takeCareOfCrazyPeople(args, callback);
        callback(null, args);
    });
};


module.exports = {
    getTargets:getTargets,
    getPorts:getPorts,
    parse:parse
};
