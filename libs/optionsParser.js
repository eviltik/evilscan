var net = require('net');
var output = require('./output');
var cidr = require('./cidr');

var getTargets = function(target) {

    if (!target) {
        return {error:"Please specify a target using --target [cidr|ipv4|host]"};
    }

    var ips = [];

    if (target.match(/\//)) {
        ips = cidr.get(target);
        if (!ips) {
            return {error:"Invalid IPv4 CIDR target. Please specify a target using --target [cidr|ip]"};
        }
        return ips;
    }

    if (net.isIPv6(target)) {
        return {error:"IPv6 not supported"};
    }

    if (target == '127.0.0.1') {
        return [target];
    }

    if (!net.isIPv4(target)) {
        return {error:"Target "+target+" is not a valid IPv4"};
    } else {
        return [target]
    }

    return {error:'Target: unknow error'};
}


var addPortRange = function(range,ports) {
    if (!range.match(/[0-9]+\-[0-9]+/)) return;
    var sp = range.split('-');
    var start = parseInt(sp[0]);
    var end = parseInt(sp[1]);
    if (!start||!end) return;
    for (var i = start;i<=end;i++) {
        ports.push(i);
    }
    return true;
}

var getPorts = function(port) {
    var ports = [];

    if (!port) {
        return {error:"Please specify target ports --ports=21-23,80"};
    }

    port+='';
    if (port.match(/^[0-9]+$/)) {
        return [parseInt(port)];
    }

    if (!port.match(/[0-9,\-]+/)) {
        return {error:"Invalid port "+port};
    }

    port+=',';

    var p = port.split(',');
    p.forEach(function(port) {
        if (!port) return;
        if (!addPortRange(port,ports)) {
            ports.push(parseInt(port));
        }
    })

    if (ports.length) return ports;

    return {error:'Port: unknow error'};
}

module.exports = {
    getTargets:getTargets,
    getPorts:getPorts
}
