const net = require('net');
const iac = require('./iac');

class TcpScan {

    constructor(opts) {
        this.debug = false;

        this.cb = null;

        this.opts = opts;
        this.opts.bannerlen = opts.bannerlen || 512;
        this.opts.timeout = opts.timeout || 2000;

        this.result = {
            ip:opts.ip,
            port:opts.port,
            bannerraw:[],
            banner:'',
            status:null,
            opened:false
        };

        this.socket = null;
        this.bufArray = [];


        /*
        var handlerModules = fs.readdirSync(__dirname+'/probes/');
        var handlers = [];

        for (var i = 0;i<handlerModules.length;i++) {
            var filename = handlerModules[i];
            if (filename.match(/\.js$/)) {
                var handler = require('./probes/'+filename);
                handlers.push(handler);
            }
        }
        */
    }

    log(msg) {
        if (this.debug) console.log('TcpScan: %s:%s => %s', this.opts.ip, this.opts.port, msg);
    }

    formatBanner(str) {
        // Convert to utf-8,
        // encode special chars
        // remove trailing spaces
        str = new (require('string_decoder').StringDecoder)('utf-8').write(str);
        str = str.toString();
        str = str.replace(/\n/gm, '\\n');
        str = str.replace(/\r/gm, '\\r');
        str = str.replace(/\t/gm, '\\t');
        str = str.replace(/ *$/, '');
        str = str.replace(/^ */, '');
        str = str.substr(0, this.opts.bannerlen);
        return str;
    }

    _sendResult(timeouted) {
        this.log('onEnd');

        if (this.bufArray.length) {
            this.result.raw = Buffer.concat(this.bufArray);
        }

        if (this.result.banner) {
            this.result.banner = this.formatBanner(this.result.banner);
        }

        if (!this.result.status) {
            if (!this.result.opened) {
                if (timeouted) {
                    this.result.status = 'timeout';
                } else {
                    this.result.status =' closed';
                }
            } else {
                this.result.status = 'open';
            }
        }

        this.log(JSON.stringify(this.result));
        if (this.socket) {
            this.socket.destroy();
            delete this.socket;
        }
        this.cb(null, this.result);
    }

    _onClose() {
        if (!this.result.banner) {
            this.result.opened = false;
        }
        this._sendResult();
    }

    _onError(e) {
        if (e.message.match(/ECONNREFUSED/)) {
            return this.result.status = 'closed (refused)';
        }
        if (e.message.match(/EHOSTUNREACH/)) {
            return this.result.status = 'closed (unreachable)';
        }
        this.result.status = e.message;
    }

    _onConnect(/*e*/) {
        this.log('connected');
        this.result.opened = true;
    }

    _onTimeout() {
        this.log('socket timeout (opened '+this.result.opened+')');
        if (!this.result.opened) {
            this.result.status = 'closed (timeout)';
        } else {
            this.result.status = 'open';
        }
        this.socket && this.socket.destroy();
    }

    _onData(buf) {
        this.bufArray.push(buf);
        buf = iac.negotiate(buf, this.socket);
        if (this.result.banner.length < this.opts.bannerlen) {
            const d = buf.toString('ascii');
            if (d) this.log(d.replace(/[\n\r]/, ' '));
            return this.result.banner += d;
        }
        this.socket && this.socket.destroy();
    }


    setSocketTimeout(t) {
        this.opts.timeout = t;
    }

    analyzePort(callback) {

        this.log('analyzePort '+this.host+':'+this.port);

        this.cb = callback;

        this.socket = net.createConnection(this.opts.port, this.opts.ip);
        this.socket.removeAllListeners('timeout');
        this.socket.setTimeout(this.opts.timeout);

        this.socket.on('close', this._onClose.bind(this));
        this.socket.on('error', this._onError.bind(this));
        this.socket.on('connect', this._onConnect.bind(this));
        this.socket.on('timeout', this._onTimeout.bind(this));
        this.socket.on('data', this._onData.bind(this));
    }
}


module.exports = TcpScan;
