const tester = require('tape');
const spawn = require('child_process').spawn;
const rl = require('readline');
const Evilscan = require('../');
const path = require('path');
const scriptName = path.basename(__filename);

function cleanCmdLineArgs(str) {
    str = str.replace(/.\/bin\/evilscan.js /, ' ').trim();
    str = str.replace(/\-\-/g, '');
    return '['+str+']';
}

const arr = [{
    title:'should be pausable/unpausable',
    args:'./bin/evilscan.js 127.0.0.1/24 --port=0-25 --json --progress --concurrency=10',
}];

function checkResult(test, data, exp) {
    if (typeof data !='object') {
        data = data.toString();
        test.equal(typeof data, 'string', 'should return a string');
        test.equal(data.length>1, true, 'response length should be > 1');
        data = JSON.parse(data);
    }
    test.equal(typeof data, 'object', 'JSON.parse should return an object');
    if (exp) {
        test.deepEqual(data, exp, 'result object should match');
    }
    return true;
};

// simulate command line

arr.forEach(item => {
    tester(scriptName+':binary: ['+item.args+'] '+item.title, { timeout: 10000 }, function(test) {

        const proc = spawn('node', item.args.split(' '));
        const linereaderStdout = rl.createInterface(proc.stdout, proc.stdin);

        let paused = false;
        let unpaused = false;
        let pausedunpaused = false;

        linereaderStdout.on('line', data => {
            checkResult(test, data);
            data = JSON.parse(data);
            if (data._jobsDone > 2 && !paused && !unpaused) {
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
        });

        proc.on('close', () => {
            test.equal(pausedunpaused, true, 'pause/unpause should be true');
            test.end();
        });

        proc.stderr.on('data', data => {
            throw new Error(data.toString());
        });

    });
});


// simulate module usage

arr.forEach(item => {
    const o = item.args.split(' ');
    const argv = {};
    argv.target = o[1];
    o.forEach(function(arg) {
        if (arg.match(/\-\-/)) {
            arg = arg.replace(/\-\-/, '');
            if (arg.match(/=/)) {
                const v = arg.split('=');
                argv[v[0]]=v[1];
            } else {
                argv[arg] = true;
            }
        }
    });

    delete argv.json;

    tester(
        scriptName+':module: '+cleanCmdLineArgs(item.args)+' '+item.title,
        { timeout: 10000 },
        (test) => {

            let paused = false;
            let unpaused = false;
            let pausedunpaused = false;

            new Evilscan(argv)
                .on('error', err => {
                    throw new Error(err);
                })
                .on('done', () => {
                    test.equal(pausedunpaused, true, 'pause/unpause should be true');
                    test.end();
                })
                .on('progress', (data, scan) => {
                    if (data._jobsDone > 2 && !paused && !unpaused) {
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
