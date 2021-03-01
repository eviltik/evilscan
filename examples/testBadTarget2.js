const Evilscan = require('../');

const options = {
    target: 'asasasas',
    port: 22,
    status: 'TROU',
    banner: true
};

new Evilscan(options, (err, scan) => {
    if (err) {
        console.log(err);
        process.exit();
    }

    scan.run();
});
