const fs = require('fs');
const path = require('path');
const dns = require('dns');
const fetch = require('node-fetch');
const { Blacklist } = require('../../model/domain');

const maliciousDomains = JSON.parse(fs.readFileSync(path.resolve(__dirname,"malware_domains.json")));

// Middleware to check if a domain is malicious
// async function isMalicious(req, res, next) {
//     const domain = req.body.domain;
//     const isMalicious = await Blacklist
//     if (isMalicious) {
//         return res.status(403).json({ error: 'Malicious domain detected!' });
//     }
//     next();
// }

// Middleware to resolve the IP address of a domain
function resolveIP(domain) {
    dns.lookup(domain, (err, addresses) => {
        if (err) {
            return res.status(500).json({ error: 'Error resolving IP address' });
        }
       // else return addresses;
    });
}

module.exports = {resolveIP}
