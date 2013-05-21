var net = require('net');
var socketTimeout = 10000; //miliseconds

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

var isOpen = function(host, port, cb) {
    var isOpen = false;
    var executed = false;
    var reason = 'closed';
    var data='';

    var onClose = function() {
        if (executed) return;
        executed = true;
        clearTimeout(timeoutId);
        delete socket;
        var o = {
            isOpen:isOpen,
            host:host,
            port:port,
            reason:reason,
            data:data
        }
        cb(null,o);
    };

    var timeoutId = setTimeout(function() {
        reason = 'timeout';
        socket.destroy();
    }, socketTimeout);

    //console.log('Create connection',host,port);

    var socket = net.createConnection(port, host);
    socket.setTimeout(socketTimeout);

    //socket.setEncoding('ascii');

    socket.on('close', function() {
        //console.log('socket closed');
        if (!executed) {
            if (!data) isOpen = false;
            onClose();
        }
    });

    socket.on('error', function(e) {
        //console.log('socket error');
        if (e.message.match(/EMFILE/)) {
            cb(e);
        }
        reason = e.message;
        if (!executed) onClose();
        //socket.end();
    });

    socket.on('connect', function() {
        //console.log('socket connected');
        isOpen = true;
        //socket.end();
    });

    var handleIAC = function(buf) {
        var nbIAC = 0;
        var count = 0;
        var str = '';
        for (var i = 0; i<buf.length;i++) {
            //console.log(buf[i]);
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
        buf = handleIAC(buf);
        data+=buf.toString();
        if (port = 23) {
            if (data.match(/login ?:/)) {
                socket.destroy();
            }
        }
        //console.log(data);
    });
}

var setSocketTimeout = function(t) {
    timeout=t;
}

module.exports = {
    isOpen:isOpen,
    setSocketTimeout:setSocketTimeout
}
