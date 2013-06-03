var net = require('net');

var long2ip = function(ip) {
    if (!isFinite(ip)) return false;
    return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.');
}

var bindec = function(binary_string) {
    binary_string = (binary_string + '').replace(/[^01]/gi,'');
    return parseInt(binary_string,2);
}

var ip2long = function(ip) {
    var i = 0;
    ip+='';
    ip = ip.match(/^([1-9]\d*|0[0-7]*|0x[\da-f]+)(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?$/i);
    if (!ip) return;

    ip[0]=0;
    for (i=1;i<5;i++) {
        ip[0]+=!!((ip[i]||'').length);
        ip[i] =parseInt(ip[i])||0;
    }

    ip.push(256,256,256,256);
    ip[4+ip[0]]*=Math.pow(256,4-ip[0]);
    if (ip[1]>=ip[5]||ip[2]>=ip[6]||ip[3]>=ip[7]||ip[4]>=ip[8]) return;
    return ip[1]*(ip[0]===1||16777216)+ip[2]*(ip[0]<2||65536)+ip[3]*(ip[0]<=3||256)+ip[4]*1;
}

var get = function(range,cb) {
    var ip_addr_cidr = range;
    var ip_arr = ip_addr_cidr.split('/');
    if (!ip_arr[1]) return;
    if (!ip_arr[1].match(/^[0-9]{1,2}$/)) return;
    if (!net.isIPv4(ip_arr[0])) return;

    var bin='';
    for (var i=1;i<=32;i++) {
        bin+=ip_arr[1]>=i?'1':'0';
    }

    ip_arr[1] = bindec(bin);

    var ip = ip2long(ip_arr[0]);
    var nm = ip2long(ip_arr[1]);
    var nw = (ip & nm);
    var bc = nw | (~nm);

    var ips = [];
    for (var zm=1;(nw+zm)<(bc-1);zm++) {
        ips.push(long2ip(nw+zm));
    }
    return ips;
}

module.exports = {
    get:get
}


