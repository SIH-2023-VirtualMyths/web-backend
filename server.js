const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const dns2 = require('dns2');
const udp = require('dgram');
const cron = require('node-cron');
const {isMalicious, resolveIP} = require('./src/utils/utils');
const fetchDataAndUpdateLocalFile = require('./src/utils/script');

const app = express();
const PORT = process.env.PORT || 3000;
const UDP_PORT = process.env.UDP_PORT || 3001;

app.use(bodyParser.json());

const domainRegex = /^[a-zA-Z0-9.-]+$/;
//udp
const udpServer = udp.createSocket('udp4');
udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log('Listening to ', 'Address: ', address.address, 'Port: ', address.port);
})
udpServer.on('message', async(message,info) => {
    console.log('Message', message.toString());
    if(!domainRegex.test(message.toString().trim())) {
      return;
    }
    let isMaliciousResult = false;
    let ipAddresses = [];
    try {
        const domain = message.toString().trim();
        // Execute isMalicious and resolveIP middleware functions
        const mal = await isMalicious({ body: { domain } }, {}, async () => {});
        const ip = resolveIP({ body: { domain } }, {}, () => {});
        // Access the results
        console.log(mal," ",ip);
    } catch (error) {
        console.error('Error:', error.message);
    }

    // Send the response back over UDP
    const response = Buffer.from(JSON.stringify({ domain, isMalicious: isMaliciousResult, ipAddresses }));
    udpServer.send(response, info.port, info.address, (err) => {
        if (err) {
            console.error('Failed to send UDP response:', err);
        } else {
            console.log('UDP Response sent successfully');
        }
    });
});

udpServer.bind(UDP_PORT, () => {
    console.log(`UDP server listening on port ${UDP_PORT}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res)=> {
    return res.send("Welcome to DNS Filter");
})

// Route to handle domain verification and IP resolution
app.post('/checkDomain', isMalicious, resolveIP, async(req, res) => {
    const domain = req.body.domain;
    const ipAddress = req.ipAddress;
    res.json({ isSuccess: true, domain, ipAddress });
});

// Schedule data updates using cron syntax
// cron.schedule('*/10 * * * *', async() => {
//   //fetchDataAndUpdateMongoDB(); // Update MongoDB
//   console.log("scheduler running");
//   await fetchDataAndUpdateLocalFile(); // Update local file
// });
module.exports = app