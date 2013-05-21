var execSync = require('execSync');
var log = require('./logger').log;

var pause = function(start,timeout) {
    var now = new Date().getTime();
    var diff = now - start;
    var diffTxt = (diff/1000).toFixed(2)+' secs';

    log.info('Waiting since '+diffTxt+', max='+timeout);

    if (diff>timeout) return true;

    execSync.stdout('sleep 1');

}

var execCmd = function(optOrCmd) {
    var opt = {};
    if (typeof optOrCmd == 'object') {
        opt = optOrCmd;
    } else if (typeof optOrCmd == 'string') {
        opt.cmd = optOrCmd;
    }
    var i=0;
    var max=opt.waitRetry||5;
    var timeout = (opt.timeout||1)*5000;
    var start = new Date().getTime();

    if (opt.cmd) {
        log.debug('Executing '+opt.cmd);
        var res = execSync.stdout(opt.cmd);
        if (res) res = res.replace(/\n$/gm,'');
    }

    if (!opt.waitCmd) return res;

    while (true) {

        log.debug(opt.waitCmd);

        var out = execSync.stdout(opt.waitCmd);
        if (out) out.replace(/\n$/gm,'');

        if (opt.waitUntil&&opt.waitUntil.exec(out)) break;
        if (opt.waitUntilNot&&!opt.waitUntilNot.exec(out)) break;
        if (opt.waitUntilEmptyResult&&!out) break;

        log.debug(out);

        if (pause(start,timeout)) {
            if (opt.cbTimeout) opt.cbTimeout();
            break;
        }
    }


}


module.exports = {
    execCmd:execCmd
}

