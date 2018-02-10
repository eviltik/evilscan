const expect = require('chai').expect;
const net = require('net')
const spawn = require('child_process').spawn;
const rl = require('readline');
const evilscan = require('../');
const path = require('path');

function cleanCmdLineArgs(str) {
    str = str.replace(/.\/bin\/evilscan.js /,' ').trim();
    str = str.replace(/\-\-/g,'');
    return '['+str+']';
}

suite(path.basename(__filename), () => {

    const checkResult = (data, exp) => {
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

    let arr = [{
        title:'should be pausable/unpausable',
        args:'./bin/evilscan.js 127.0.0.1/24 --port=0-25 --json --progress --concurrency=10',
    }]

    // simulate command line

    arr.forEach(item => {
        test('Binary: ['+item.args+'] '+item.title, function(next) {

            this.timeout(10000);

            let checked = false;
            let proc = spawn('node',item.args.split(' '));
            let linereaderStdout = rl.createInterface(proc.stdout, proc.stdin);
            let linereaderStderr = rl.createInterface(proc.stderr, proc.stdin);

            let paused = false;
            let unpaused = false;
            let pausedunpaused = false;

            linereaderStdout.on('line', data => {
                checkResult(data);
                data = JSON.parse(data);
                if (data._jobsDone > 100 && !paused && !unpaused) {
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
                        proc.kill('SIGKILL');
                    }
                }
                checked = true;
            });

            proc.on('close',() => {
                expect(pausedunpaused,'pause/unpause should be true').to.be.ok;
                next();
            });

            proc.stderr.on('data',data => {throw new Error(data.toString())});

        });
    });


    // simulate module usage

    arr.forEach(item => {
        let o = item.args.split(' ');
        let argv = {};
        argv.target = o[1];
        o.forEach(function(arg) {
            if (arg.match(/\-\-/)) {
                arg = arg.replace(/\-\-/,'');
                if (arg.match(/=/)) {
                    let v = arg.split('=');
                    argv[v[0]]=v[1];
                } else {
                    argv[arg] = true;
                }
            }
        });

        delete argv.json;

        test('Module: '+cleanCmdLineArgs(item.args)+' '+item.title,function(next) {

            this.timeout(10000);

            let checked = false;
            let paused = false;
            let unpaused = false;
            let pausedunpaused = false;

            new evilscan(argv)
                .on('error',err => {throw new Error(data.toString())})
                .on('done',() => {
                    expect(pausedunpaused,'pause/unpause should be true').to.be.ok;
                    next();
                })
                .on('progress', (data, scan) => {
                    if (data._jobsDone > 100 && !paused && !unpaused) {
                        // let's send pause signal
                        scan.pause();
                        paused = true;
                    } else if (paused && !unpaused) {
                        if (data._status && data._status.match(/paused/i)) {
                            // let's send unpause signal
                            unpaused = true;
                            scan.unpause();
                        }
                    } else if (unpaused) {
                        if (data._status && data._status.match(/running/i)) {
                            pausedunpaused = true;
                            scan.abort();
                        }
                    }
                })
                .run();
        });
    });
});
