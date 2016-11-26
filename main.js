var util = require('util');
var events = require('events').EventEmitter;
var tcpconnect = require('./libs/tcpconnect');
var options = require('./libs/options');

var dns = require('dns');
var async = require('async');
var geoip = require('geoip-lite');


var evilscan = function(opts,cb) {
    if (false === (this instanceof evilscan)) {
        return new evilscan(opts,cb);
    }

    var self = this;

    this.lastMessage = 'Starting';
    this.paused = false;
    this.progress = 0;
    this.progressTimer = null;
    this.info = {
        nbIpToScan:0,
        nbPortToScan:0
    };
    this.cacheGeo = {};
    this.cacheDns = {};

    this.options = opts;

    if (!opts.ips) {
        // Called from a js script, reparse options
        options.parse(opts,function(err,opts) {
            self.options = opts;
            self.init();
            events.call(self);
            if (cb) cb(self);
        });
    } else {
        this.init();
        events.call(this);
    }
};

util.inherits(evilscan, events);

evilscan.prototype.getOptions = function() {
    return this.options;
};

evilscan.prototype.initTestLocalhost = function() {
    if (
        this.options.ips.length == 1
        &&
        this.options.ips[0].match(/^127.0.0.1\//)
    ) {
        // For testing purpose, a telnet server can not
        // accept more than 50 simultaneous connection,
        // so let's make a pause between each pools
        this.q.setInterval(1000);
    }
};


evilscan.prototype.fireProgress = function() {
    var o = this.q.stats();
    if (!this.paused) {
        o._message = this.lastMessage;
    } else {
        o._message = 'Paused';
        o._status = 'Paused';
    }

    this.progress = o._progress;
    this.emit('progress',o);
};

evilscan.prototype.initQueueProgress = function() {
    if (!this.options.progress) return;

    var self = this;

    this.progressTimer = setInterval(self.fireProgress.bind(this),1000);

    this.q.on('start',function() {
        self.emit('start');
        self.fireProgress();
    });

    this.q.on('end',function() {
        clearInterval(self.progressTimer);
        self.fireProgress();
        if (self.cb) self.cb();
    });

};

evilscan.prototype.initQueue = function() {

    var self = this;

    // Push scan jobs in the queue
    var maxi = this.options.ips.length;
    var maxj = this.options.ports.length;
    var maxt = maxi*maxj;
    this.info.combinaison = maxt;
    var i = 0;

    var copyOfIps = JSON.parse(JSON.stringify(this.options.ips));

    while (copyOfIps.length) {
        var ip = copyOfIps.shift();
        if (this.options.ports.length) {
            var j = 0;
            var maxj = this.options.ports.length;
            for (var j=0;j<maxj;j++) {
                var args = {
                    ip:ip,
                    port:this.options.ports[j],
                    i:i,
                    max:maxt
                }
                this.info.nbPortToScan++;
                this.q.add(this.scan.bind(this),args);
                i++;
            }
            this.info.nbIpToScan++;
        } else {
            var args = {
                ip:ip,
                i:i,
                max:maxt
            }
            this.q.add(this.scan.bind(this),args);
            this.info.nbPortToScan = 0;
            this.info.nbIpToScan = 1;
            i++;
        }
    }

    this.q.on('end',function() {
        self.cacheGeo = {};
        self.cacheDns = {};
        self.emit('done');
        if (self.cbrun) self.cbrun();
    });

    this.q.on('jobStart',function(data) {
        var str = 'Scanning '+data.ip;
        if (data.port) str+=':'+data.port;
        self.lastMessage = str;
        self.emit('scan',data);
    });

    this.q.on('jobEnd',function(data) {
        var str = 'Scanned '+data.ip;
        if (data.port) str+=':'+data.port;
        self.lastMessage = str;
    });
};

evilscan.prototype.pause = function() {
    if (this.paused) return;
    this.paused = true;
    this.q.pause(true);
};

evilscan.prototype.unpause = function() {
    if (!this.paused) return;
    this.paused = false;
    this.q.pause(false);
};

evilscan.prototype.initQueuePause = function() {
    process.on('SIGUSR2',function() {
        if (!this.paused) {
            this.paused = true;
            this.lastMessage = 'Pause';
        } else {
            this.paused = false
        }
        this.q.pause(this.paused);
    }.bind(this));
};

evilscan.prototype.init = function() {

    this.q = require('qjobs')({
        maxConcurrency:this.options.concurrency||500
    });

    this.initTestLocalhost();
    this.initQueue();
    this.initQueueProgress();
    this.initQueuePause();
    //portscan.setSocketTimeout(argv.timeout||1000);
};

evilscan.prototype.lookupGeo = function(ip,cb) {

    if (!this.options.geo) {
        return cb();
    }

    if (this.cacheGeo[ip]) {
        return cb(null,this.cacheGeo[ip]);
    }

    var geo = geoip.lookup(ip);
    cb(null, geo);
};

evilscan.prototype.lookupDns = function(ip,cb) {
    var self = this;
    if (!this.options.reverse) return cb();

    if (this.cacheDns[ip]) {
        return cb(null,this.cacheDns[ip]);
    }

    dns.reverse(ip,function(err,domains) {
        if (err) {
            if (err.code == 'ENOTFOUND') {
                return cb(null);
            } else {
                // unknow error
                var e = {
                    fnc:'lookupDns',
                    err:err
                }
                self.emit('error',e);
                return cb(null);
            }
        }
        if (!domains.length) return cb(null);
        cb(null,domains[0]);
    });
};

evilscan.prototype.portScan = function(ip,port,cb) {
    if (!port) return cb();
    if (port == 0) return cb();

    var args = {
        ip : ip,
        port : port,
        banner : this.options.banner,
        bannerlen : this.options.bannerlen,
        timeout : this.options.timeout
    };

    var t = new tcpconnect(args);
    t.analyzePort(cb);
};

evilscan.prototype.resultAddGeo = function(result,r) {
    if (!this.options.geo) return r;

    r.city = '';
    r.country = '';
    r.region = '';
    r.latitude = '';
    r.longitude = '';

    if (!result) return r;

    this.cacheGeo[r.ip] = result;

    r.city = result.city || '';
    r.country = result.country || '';
    r.region = result.region || '';
    r.latitude = result.ll[0] || '';
    r.longitude = result.ll[1] || '';

    return r;
};

evilscan.prototype.resultAddDns = function(result,r) {
    if (!this.options.reverse || !r) return r;
    r.reverse = '';
    if (!result) return r;
    r.reverse = result;

    this.cacheDns[r.ip] = result;

    return r;
};

evilscan.prototype.resultAddPort = function(result,r) {

    if (!r || !this.options.port || !result) {
        return r;
    }

    if (!this.options.showTimeout && result.status.match(/timeout/i)) {
        return r = null;
    }

    if (!this.options.showRefuse && result.status.match(/refuse/i)) {
        return r = null;
    }

    if (!this.options.showOpen && result.status.match(/open/i)) {
        return r = null;
    }

    if (!this.options.showUnreachable && result.status.match(/unreachable/i)) {
        return r = null;
    }

    if (this.options.banner) {
        r.banner = result.banner || '';
    }

    if (this.options.bannerraw) {
        r.bannerraw = result.raw || '';
    }

    r.status = result.status;

    return r;
};

evilscan.prototype.resultClean = function(r) {
    if (!r) {
        return r;
    }

    if (this.options.reverse && this.options.reversevalid && r.reverse == '') {
        r = null;
    }

    if (!r.port) delete r.port;

    if (this.options.json) {

        if (r.status && r.status.match(/close/i)) {
            delete r.banner;
            delete r.bannerraw;
        }

        if (!r.reverse) {
            delete r.reverse;
        }

        if (!r.banner) {
            delete r.banner;
        }

        if (!r.bannerraw) {
            delete r.bannerraw;
        }
    }
    return r;
};

evilscan.prototype.scan = function(args,nextIteration) {

    var self = this;

    var result = {
        ip:args.ip,
        port:args.port
    };

    async.series([
        function(next) {
            self.lookupGeo(args.ip,next);
        },
        function(next) {
            self.lookupDns(args.ip,next);
        },
        function(next) {
            self.portScan(args.ip,args.port,next);
        }
    ],function(err,arr) {
        result = self.resultAddGeo(arr[0],result);
        result = self.resultAddDns(arr[1],result);
        result = self.resultAddPort(arr[2],result);
        result = self.resultClean(result);
        if (result) {
            self.emit('result',result);
        }
        nextIteration();
    });
};

evilscan.prototype.run = function(cb) {
    this.cbrun = cb;
    this.q.run();
    return;
};

evilscan.prototype.abort = function() {
    this.q.abort();
    return;
};

evilscan.prototype.getInfo = function() {
    return this.info;
};

module.exports = evilscan;
