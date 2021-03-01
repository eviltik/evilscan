const Evilscan = require('../');

const options = {
    target:'173.194.45.67',
    // target:'192.168.1.1-5',
    // target:'192.168.1.1-192.168.1.5',
    port:'21, 22, 23, 80, 443, 4443, 4444, 5038, 5060-5070, 8080',
    status:'TROU', // Timeout, Refused, Open, Unreachable
    timeout:3000,
    banner:true,
    //geo:true
};

const evilscan = new Evilscan(options);

evilscan.on('result', (data) => {
    // trigger for each ip:port found
    console.log(JSON.stringify(data));
});

evilscan.on('error', (err) => {
    throw err;
});

evilscan.on('done', () => {
    // finished !
});

evilscan.run();
