const Evilscan = require('../');

const options = {
    target: 'asasasas',
    port: 22,
    status: 'TROU',
    banner: true
};

const evilscan = new Evilscan(options);

evilscan.on('error', err => {
    throw err;
});

evilscan.run();
