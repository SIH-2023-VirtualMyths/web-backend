const dgram = require('dgram');
const fs = require('fs');
const glob = require('glob');

const port = 53;
const ip = '127.0.0.1';

const sock = dgram.createSocket('udp4');
sock.bind(port, ip);

let zonedata = loadZones();

function loadZones() {
    const jsonzone = {};
    const zonefiles = glob.sync('zones/*.zone');

    for (const zone of zonefiles) {
        const zonedata = fs.readFileSync(zone, 'utf-8');
        const data = JSON.parse(zonedata);
        const zonename = data["$origin"];
        jsonzone[zonename] = data;
    }
    return jsonzone;
}

function getFlags(flags) {
    const byte1 = flags.slice(0, 1);
    const byte2 = flags.slice(1, 2);

    const QR = '1';

    let OPCODE = '';
    for (let bit = 1; bit < 5; bit++) {
        OPCODE += String((byte1[0] & (1 << bit)) !== 0);
    }

    const AA = '1';
    const TC = '0';
    const RD = '0';

    // Byte 2
    const RA = '0';
    const Z = '000';
    const RCODE = '0000';

    return Buffer.concat([Buffer.from((parseInt(QR + OPCODE + AA + TC + RD, 2)).toString(16), 'hex'), Buffer.from((parseInt(RA + Z + RCODE, 2)).toString(16), 'hex')]);
}

function getQuestionDomain(data) {
    let state = 0;
    let expectedlength = 0;
    let domainstring = '';
    let domainparts = [];
    let x = 0;
    let y = 0;
    for (const byte of data) {
        if (state === 1) {
            if (byte !== 0) {
                domainstring += String.fromCharCode(byte);
            }
            x += 1;
            if (x === expectedlength) {
                domainparts.push(domainstring);
                domainstring = '';
                state = 0;
                x = 0;
            }
            if (byte === 0) {
                domainparts.push(domainstring);
                break;
            }
        } else {
            state = 1;
            expectedlength = byte;
        }
        y += 1;
    }

    const questiontype = data.slice(y, y + 2);

    return [domainparts, questiontype];
}

function getZone(domain) {
    const zone_name = domain.join('.');
    return zonedata[zone_name];
}

function getRecs(data) {
    const [domain, questiontype] = getQuestionDomain(data);
    let qt = '';
    if (questiontype.equals(Buffer.from([0, 1]))) {
        qt = 'a';
    }

    const zone = getZone(domain);

    return [zone[qt], qt, domain];
}

function buildQuestion(domainname, rectype) {
    let qbytes = Buffer.from('');

    for (const part of domainname) {
        const length = part.length;
        qbytes = Buffer.concat([qbytes, Buffer.from([length])]);

        for (const char of part) {
            qbytes = Buffer.concat([qbytes, Buffer.from(char.charCodeAt().toString(16), 'hex')]);
        }
    }

    if (rectype === 'a') {
        qbytes = Buffer.concat([qbytes, Buffer.from([0, 1])]);
    }

    qbytes = Buffer.concat([qbytes, Buffer.from([0, 1])]);

    return qbytes;
}

function recToBytes(domainname, rectype, recttl, recval) {
    let rbytes = Buffer.from([0xc0, 0x0c]);

    if (rectype === 'a') {
        rbytes = Buffer.concat([rbytes, Buffer.from([0, 1])]);
    }

    rbytes = Buffer.concat([rbytes, Buffer.from([0, 1])]);

    rbytes = Buffer.concat([rbytes, Buffer.from((recttl).toString(16).padStart(8, '0'), 'hex')]);

    if (rectype === 'a') {
        rbytes = Buffer.concat([rbytes, Buffer.from([0, 4])]);

        for (const part of recval.split('.')) {
            rbytes = Buffer.concat([rbytes, Buffer.from([parseInt(part)])]);
        }
    }
    return rbytes;
}

function buildResponse(data) {
    // Transaction ID
    const TransactionID = data.slice(0, 2);

    // Get the flags
    const Flags = getFlags(data.slice(2, 4));

    // Question Count
    const QDCOUNT = Buffer.from([0, 1]);

    // Answer Count
    const ANCOUNT = Buffer.from((getRecs(data.slice(12))[0].length).toString(16).padStart(4, '0'), 'hex');

    // Nameserver Count
    const NSCOUNT = Buffer.from([0, 0]);

    // Additional Count
    const ARCOUNT = Buffer.from([0, 0]);

    const dnsheader = Buffer.concat([TransactionID, Flags, QDCOUNT, ANCOUNT, NSCOUNT, ARCOUNT]);

    // Create DNS body
    let dnsbody = Buffer.from('');

    // Get answer for query
    const [records, rectype, domainname] = getRecs(data.slice(12));

    const dnsquestion = buildQuestion(domainname, rectype);

    for (const record of records) {
        dnsbody = Buffer.concat([dnsbody, recToBytes(domainname, rectype, record["ttl"], record["value"])]);
    }

    return Buffer.concat([dnsheader, dnsquestion, dnsbody]);
}

sock.on('message', (msg, rinfo) => {
    const response = buildResponse(msg);
    sock.send(response, rinfo.port, rinfo.address);
});

