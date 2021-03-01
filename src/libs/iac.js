const IAC = {
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
};

function negotiate(buf, socket) {
    let nbIAC = 0;
    let count = 0;
    //let str = '';
    for (let i = 0; i<buf.length;i++) {
        if (buf[i] == IAC.IAC) {
            count = 1;
            nbIAC++;
            //str='IAC ';
        } else if (count==1) {
            /*
            switch (buf[i]) {
            case IAC.DO:    str+='DO ';     break;
            case IAC.DONT:  str+='DONT ';   break;
            case IAC.WILL:  str+='WILL ';   break;
            case IAC.WONT:  str+='WONT ';   break;
            }
            */
            count++;
        } else if (count==2) {
            /*
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
            */
            const nbuf = new Buffer.from([IAC.IAC, IAC.WONT, buf[i]]);
            socket.write(nbuf);
            buf.slice(count*nbIAC);
        }
    }
    return buf.slice(nbIAC*3);
}

module.exports = {
    negotiate
};

