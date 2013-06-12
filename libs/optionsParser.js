var net = require('net');
var output = require('./output');
var cidr = require('./cidr');
var dns = require('dns');
var async = require('async');

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

module.exports = {
    getTargets:getTargets,
    getPorts:getPorts
}
