const net = require('net');
const cidr = require('./cidr');
const dns = require('dns');
const async = require('async');
const fs = require('fs');

function getTargets(target, callback) {

    if (!target) {
        return callback(
            'Please specify at least a target [ipv4-cidr|ipv4|ipv6|host], examples:\n' +
            'evilscan 192.168.0.0/24 --port=21,22,23,80,5900-5910\n' +
            'evilscan 2a00:1450:400e:800::200e --port=80,443\n'
            );
    }

    async.series(
        [
            (next) => {
                if (target.match(/[a-z]/i) && !target.match(/\//) && !net.isIPv6(target)) {
                    dns.resolve4(target, next);
                } else {
                    next(null, [[target]]);
                }
            }
        ],
        (err, result) => {
            if (err) {
                if (err.code === 'ENOTFOUND' || err.code === 'ESERVFAIL') {
                    callback('Could not resolve '+target);
                    return;
                }
                callback(err.message);
                return;
            }

            target = result[0][0]+'';
            if (target.match(/\-/)) {
                const splitTarget = target.split('-');
                const minHost = splitTarget[0];
                const maxHost = splitTarget[1];
                const ips = [];
                let splitMinHost, splitMaxHost;
                if (net.isIPv4(minHost)) {
                    splitMinHost = minHost.split(".").map(Number)

                    if (net.isIPv4(maxHost)) {
                        splitMaxHost = maxHost.split('.').map(Number);
                    } else {
                        // Check if the string is a positive integer
                        if (splitTarget[1] >>> 0 === Number(maxHost)) {
                            splitMaxHost = [
                                splitMinHost[0],
                                splitMinHost[1],
                                splitMinHost[2],
                                Number(maxHost)
                            ];
                        } else {
                            callback('Invalid IPv4 target range, ie: 192.168.0.1-5, 192.168.0.1-192.168.0.5');
                            return;
                        }
                    }
                } else if (net.isIPv6(minHost)) {
                    callback('IPv6 ranges are not yet supported');
                    return;
                } else {
                    callback('Invalid IPv4 target. ie: 192.168.0.1-5, 192.168.0.1-192.168.0.5');
                    return;
                }

                const numMinHost = splitMinHost.reduce((prev, val, i) => prev + val * 256 ** (3 - i), 0)
                const numMaxHost = splitMaxHost.reduce((prev, val, i) => prev + val * 256 ** (3 - i), 0)

                if (net.isIPv4(minHost)) {
                    for (let ip = numMinHost; ip <= numMaxHost; ip++) {
                        ips.push(cidr.long2ip(ip))
                    }
                }

                if (!ips) {
                    callback('Invalid IPv4 target. Please specify a target using --target [cidr|ip|range]');
                    return;
                }

                callback(null, ips);
                return;
            }

            if (targetMatch = target.match(/\//)) {
                if (net.isIPv6(target.substring(0, targetMatch.index))) {
                    callback('IPv6 subnet scanning not yet implemented');
                    return;
                }
                const ips = cidr.get(target);
                if (!ips) {
                    callback('Invalid IPv4 CIDR target. Please specify a target using --target [cidr|ip|range]');
                    return;
                }
                callback(null, ips);
                return;
            }

            if (target == '127.0.0.1') {
                callback(null, [target]);
                return;
            }

            if (!net.isIPv4(target) && !net.isIPv6(target)) {
                callback('Target '+target+' is not a valid IPv4/IPv6');
                return;
            }
            callback(null, [target]);
        });
}

function addPortRange(range, ports) {
    if (!range.match(/[0-9]+\-[0-9]+/)) return;
    const sp = range.split('-');
    let start = parseInt(sp[0]);
    const end = parseInt(sp[1]);
    if (start+1 && end+1) {
        if (start == 0) start++;
        for (let i = start;i<=end;i++) {
            ports.push(i);
        }
    }
    return true;
}

function getPorts(port, callback) {
    var ports = [];

    if (!port) {
        return callback(null, [0]);
    }

    port+='';
    if (port.match(/^[0-9]+$/)) {
        return callback(null, [parseInt(port)]);
    }

    if (!port.match(/[0-9,\-]+/)) {
        return callback('Invalid port '+port);
    }

    port+=',';

    const p = port.split(',');
    p.forEach(function(port) {
        if (!port) return;
        if (!addPortRange(port, ports)) {
            ports.push(parseInt(port));
        }
    });

    if (ports.length) {
        callback(null, ports);
        return;
    }

    callback('Port: unknow error');
}

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
}

function help(args) {

    if (args.help) {
        console.log(fs.readFileSync(`${__dirname}/help.txt`).toString());
        process.exit(0);
    }

    let packageInfo = {};

    if (args.version||args.about) {
        console.log(__dirname);
        packageInfo = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`));
    }

    if (args.version) {
        console.log(packageInfo.version);
        process.exit(0);
    }

    if (args.about) {
        console.log('%s v%s', packageInfo.name, packageInfo.version, packageInfo.description);
        console.log('License: %s', packageInfo.license);
        console.log('Author: %s', packageInfo.author);
        console.log('Repository: %s', packageInfo.repository.url.replace(/git/, 'http'));
        process.exit(0);
    }
}

function takeCareOfCrazyPeople(args, callback) {
    const count = args.ips.length * args.ports.length;
    if (count>16580355) {
        let msg = 'limit of 16580355 numbers of ip/port combinaison reached ('+count+')';
        msg+=', see https://github.com/eviltik/evilscan/issues/25 for more information';
        callback(msg);
        return false;
    }
    return true;
}

function parse(args, callback) {

    help(args);

    args = defaultValues(args);

    async.series([
        (next) => {
            if (args.infile) {
                args.target = fs.readFileSync(args.infile).toString().trim().split('\n');
            } else {
                args.target = [args.target || args._[0]];
            }
            async.mapSeries(args.target, (target, nextTarget) => {
                getTargets(target, nextTarget);
            }, next);
        },
        (next) => {
            getPorts(args.port, next);
        }
    ], (err, result) => {

        if (err) return callback(err, args);

        args.ips = result[0];
        let nips = [];
        if (typeof args.ips === 'object') {
            for (const ips of args.ips) {
                nips = nips.concat(ips);
            }
            args.ips = nips;
        }

        args.ports = result[1];

        if (!args.port && !args.reverse && !args.geo) {
            return callback('Please specify at least one port, --port=80', args);
        }

        takeCareOfCrazyPeople(args, callback);
        callback(null, args);
    });
}


module.exports = {
    getTargets,
    getPorts,
    parse
};