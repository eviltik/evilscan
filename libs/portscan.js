var net = require('net');
var socketTimeout = 10000; //miliseconds
var debug = false;

var IAC={
    ECHO:1,
    SUPPRESS_GO_AHEAD:3,
    STATUS:5,
    TIMING_MARK:6,
    TERMINAL_TYPE:24,
    WINDOW_SIZE:31,
    TERMINAL_SPEED:32,
    REMOTE_FLOW_CONTROL:33,
    LINEMODE: 34,
    ENV_VARS: 36,
    SE:0xF1,
    NOP:0xF2,
    DM:0xF3,
    BRK:0xF4,
    IP:0xF5,
    AO:0xF6,
    AYT:0xF7,
    EC:0xF8,
    GA:0xF9,
    SB:0xFA,
    WILL:0xFB,
    WONT:0xFC,
    DO:0xFD,
    DONT:0xFE,
    IAC:0xFF
}

var log = function(msg) {
    if (debug) console.log(msg);
}

var isOpen = function(options, cb) {

    var host = options.ip||options.host;
    var port = options.port;
    var snaplen = options.snaplen||512;
    var status = 'close';
    var banner = '';
    var raws = [];

    var onClose = function() {

        log('closing');

        var raw = null;
        if (raws.length) {
            raw = Buffer.concat(raws);
        }

        if (banner) {
            // Convert to utf-8,
            // encode special chars
            // remove trailing spaces
            banner = new (require('string_decoder').StringDecoder)('utf-8').write(banner);
            banner = banner.toString();
            banner = banner.replace(/\n/gm,'\\n');
            banner = banner.replace(/\r/gm,'\\r');
            banner = banner.replace(/\t/gm,'\\t');
            banner = banner.replace(/ *$/,'');
            banner = banner.replace(/^ */,'');
        }

        var o = {
            host:host,
            port:port,
            status:status,
            banner:banner,
            raw:JSON.stringify(raw)
        }

        log(o);

        socket.destroy();
        delete socket;
        cb(null,o);
    };

    var socket = net.createConnection(port, host);
    socket.removeAllListeners('timeout');
    socket.setTimeout(socketTimeout);

    socket.on('close', function() {
        if (!banner) isOpen = false;
        onClose();
    });

    socket.on('error', function(e) {
        if (e.message.match(/ECONNREFUSED/)) {
            return status = 'close (refused)';
        }
        if (e.message.match(/EHOSTUNREACH/)) {
            return status = 'close (unreachable)';
        }
        status = e.message;
    });

    socket.on('connect', function() {
        log('connected');
        isOpen = true;
    });

    socket.on('timeout',function() {
        log('socket timeout');
        if (!banner) {
            status = 'close (timeout)';
        } else {
            status = 'open';
        }
        socket.destroy();;
    });

    var handleIAC = function(buf,socket) {
        var nbIAC = 0;
        var count = 0;
        var str = '';
        for (var i = 0; i<buf.length;i++) {
            if (buf[i] == IAC.IAC) {
                count = 1;
                nbIAC++;
                str='IAC ';
            } else if (count==1) {
                switch (buf[i]) {
                    case IAC.DO:    str+='DO ';     break;
                    case IAC.DONT:  str+='DONT ';   break;
                    case IAC.WILL:  str+='WILL ';   break;
                    case IAC.WONT:  str+='WONT ';   break;
                }
                count++;
            } else if (count==2) {
                switch (buf[i]) {
                    case IAC.ECHO:                  str+='ECHO';                break;
                    case IAC.SUPPRESS_GO_AHEAD:     str+='SUPPRESS_GO_AHEAD';   break;
                    case IAC.STATUS:                str+='STATUS';              break;
                    case IAC.TIMING_MARK:           str+='TIMING_MARK';         break;
                    case IAC.TERMINAL_TYPE:         str+='TERMINAL_TYPE';       break;
                    case IAC.WINDOW_SIZE:           str+='WINDOW_SIZE';         break;
                    case IAC.TERMINAL_SPEED:        str+='TERMINAL_SPEED';      break;
                    case IAC.REMOTE_FLOW_CONTROL:   str+='REMOTE_FLOW_CONTROL'; break;
                    case IAC.LINEMODE:              str+='LINEMODE';            break;
                    case IAC.ENV_VARS:              str+='ENV_VARS';            break;
                    default:                        str+='UNKNOW';              break;
                }
                var nbuf = new Buffer([IAC.IAC,IAC.WONT,buf[i]]);
                socket.write(nbuf);
                buf.slice(count*nbIAC);
            }
        }
        return buf.slice(nbIAC*3);
    }

    socket.on('data',function(buf) {
        raws.push(buf);
        buf = handleIAC(buf,socket);
        if (banner.length < snaplen) {
            log('onData: '+buf.toString('ascii'));
            return banner+=buf.toString('ascii');
        }
        socket.destroy();
    });
}

var setSocketTimeout = function(t) {
    socketTimeout = t;
}

module.exports = {
    isOpen:isOpen,
    setSocketTimeout:setSocketTimeout
}
