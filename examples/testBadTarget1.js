var evilscan = require('../');

let options = {
    target: 'asasasas',
    port: 22,
    status: 'TROU',
    banner: true
}

let scanner = new evilscan(options);

scanner.on('error',err => {
	console.log(err);
});

scanner.run();
