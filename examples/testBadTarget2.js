var evilscan = require('../');

let options = {
    target: 'asasasas',
    port: 22,
    status: 'TROU',
    banner: true
}

new evilscan(options, (err, scan) => {
    if (err) {
        console.log(err);
        process.exit();
    }

    scan.run();
});
