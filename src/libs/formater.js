const fs = require('fs');

function outputJson(o, outputFile) {
    const msg = JSON.stringify(o);
    if (outputFile) {
        return msg;
    } else {
        console.log(msg);
    }
}

function outputRaw(o, outputFile) {
    if (o.error) {
        const msg = `Error: ${o.error}`;
        if (outputFile) {
            return msg;
        }
        console.log(msg);
        return;
    }
    let str = '';
    for (const key in o) str+=o[key]+'|';
    str = str.replace(/\| ?$/, '');
    if (outputFile) {
        return str;
    } else {
        console.log(str);
    }
}

function output(o, argv) {
    if (argv.outfile) {
        let line = '';
        if (argv.json) {
            line = outputJson(o, argv.outfile);
        } else {
            line = outputRaw(o, argv.outfile);
        }
        fs.appendFileSync(argv.outfile, line+'\n');
        return;
    }

    if (argv.json) {
        outputJson(o);
        return;
    }

    outputRaw(o);
}

module.exports = output;
