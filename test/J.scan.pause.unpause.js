
var expect = require('chai').expect;
var net = require('net')
var spawn = require('child_process').spawn;
var rl = require('readline');
var evilscan = require('../main.js');
var path = require('path');

var cleanCmdLineArgs = function(str) {
    str = str.replace(/.\/bin\/evilscan.js /,' ').trim();
    str = str.replace(/\-\-/g,'');
    return '['+str+']';
}

suite(path.basename(__filename), function() {

    var checkResult = function(data,exp) {
        if (typeof data !='object') {
            data = data.toString();
            expect(data,'response type should be a string').to.be.a('string');
            expect(data.length > 1,'response length should be >1').to.be.ok;
            data = JSON.parse(data);
        }
        expect(data,'JSON.parse should return an object').to.be.a('object');
        if (exp) expect(data,'object should match').to.be.deep.equal(exp);
        return true;
    }

    var arr = [{
        title:'should return a real result',
        args:'./bin/evilscan.js 127.0.0.1 --port=0-6000 --json --progress --concurrency=10',
    }]

    // simulate command line

    arr.forEach(function(item) {
        test('Binary: ['+item.args+'] '+item.title,function(next) {

            this.timeout(10000);

            var checked = false;
            var proc = spawn('node',item.args.split(' '));
            var linereaderStdout = rl.createInterface(proc.stdout, proc.stdin);
            var linereaderStderr = rl.createInterface(proc.stderr, proc.stdin);

            var paused = false;
            var unpaused = false;
            var pausedunpaused = false;

            linereaderStdout.on('line',function(data) {
                checkResult(data);
                data = JSON.parse(data);
                if (data._jobsDone > 1000 && !paused && !unpaused) {

                    // let's send pause signal

                    proc.kill('SIGUSR2');
                    paused = true;

                } else if (paused && !unpaused) {

                    // when pausing the process, current task running will
                    // continue to send result, until the number of
                    // running task is 0

                    if (data._status && data._status.match(/paused/i)) {

                        // let's send unpause signal

                        unpaused = true;
                        proc.kill('SIGUSR2');
                    }
                } else if (unpaused) {
                    if (data._status && data._status.match(/running/i)) {
                        pausedunpaused = true;
                    }
                }
                checked = true;
            });

            proc.on('close',function() {
                expect(pausedunpaused,'pause/unpause should be true').to.be.ok;
                next();
            });

            proc.stderr.on('data',function(data) {
                throw new Error(data.toString());
            });

        });
    });

    // simulate module usage

    arr.forEach(function(item) {
        var o = item.args.split(' ');
        var argv = {};
        argv.target = o[1];
        o.forEach(function(arg) {
            if (arg.match(/\-\-/)) {
                arg = arg.replace(/\-\-/,'');
                if (arg.match(/=/)) {
                    var v = arg.split('=');
                    argv[v[0]]=v[1];
                } else {
                    argv[arg] = true;
                }
            }
        });

        delete argv.json;

        test('Module: '+cleanCmdLineArgs(item.args)+' '+item.title,function(next) {

            this.timeout(10000);

            var checked = false;
            var paused = false;
            var unpaused = false;
            var pausedunpaused = false;

            var scan = new evilscan(argv,function(s) {

                s.on('error',function(err) {
                    throw new Error(data.toString());
                });

                s.on('done',function() {
                    expect(pausedunpaused,'pause/unpause should be true').to.be.ok;
                    next();
                });

                s.on('progress',function(data) {
                    if (data._jobsDone > 1000 && !paused && !unpaused) {

                        // let's send pause signal

                        s.pause();
                        paused = true;

                    } else if (paused && !unpaused) {

                        if (data._status && data._status.match(/paused/i)) {

                            // let's send unpause signal

                            unpaused = true;
                            s.unpause();
                        }
                    } else if (unpaused) {
                        if (data._status && data._status.match(/running/i)) {
                            pausedunpaused = true;
                        }
                    }
                });

                s.run();
            });
        });
    });
});
