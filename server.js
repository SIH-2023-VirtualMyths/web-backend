const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const dns2 = require('dns2');
const udp = require('dgram');
const cron = require('node-cron');
const {resolveIP} = require('./src/utils/utils');
const {fetchDataAndUpdateMongoDB, fetchDataAndUpdateLocalFile} = require('./src/utils/script');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const { Whitelist, Blacklist } = require('./model/domain');

const app = express();
const PORT = process.env.PORT || 3000;
const UDP_PORT = process.env.UDP_PORT || 3001;

const dbUrl = process.env.URL

mongoose.set('strictQuery', false);

mongoose.connect(dbUrl)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.log('Failed to connect to MongoDB ',error);
})
app.use(bodyParser.json());

const domainRegex = /^[a-zA-Z0-9.-]+$/;
//udp
// const udpServer = udp.createSocket('udp4');
// udpServer.on('listening', () => {
//     const address = udpServer.address();
//     console.log('Listening to ', 'Address: ', address.address, 'Port: ', address.port);
// })
// udpServer.on('message', async(message,info) => {
//     console.log('Message', message.toString());
//     if(!domainRegex.test(message.toString().trim())) {
//       return;
//     }
//     let isMaliciousResult = false;
//     let ipAddresses = [];
//     try {
//         const domain = message.toString().trim();
//         // Execute isMalicious and resolveIP middleware functions
//         const mal = await isMalicious({ body: { domain } }, {}, async () => {});
//         const ip = resolveIP({ body: { domain } }, {}, () => {});
//         // Access the results
//         console.log(mal," ",ip);
//     } catch (error) {
//         console.error('Error:', error.message);
//     }

//     // Send the response back over UDP
//     const response = Buffer.from(JSON.stringify({ domain, isMalicious: isMaliciousResult, ipAddresses }));
//     udpServer.send(response, info.port, info.address, (err) => {
//         if (err) {
//             console.error('Failed to send UDP response:', err);
//         } else {
//             console.log('UDP Response sent successfully');
//         }
//     });
// });

// udpServer.bind(UDP_PORT, () => {
//     console.log(`UDP server listening on port ${UDP_PORT}`);
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// Route to handle domain verification and IP resolution
app.post('/checkDomain', async(req, res) => {
    const domain = req.body.domain;
    const isBlack = await Blacklist.findOne({domain});

    //check DB
    if(isBlack) {
        return res.json({isMalicious: true});
    }
    const isWhite = await Whitelist.findOne({domain});
    if(isWhite) {
        return res.json({ isSuccess: true, domain });
    }

    //phishing
    const data = {"url": `https://www.${domain}`}
    const isPhis = await fetch("http://localhost:5000/checkPhishing", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify(data)
    })
    const result = await isPhis.json();
    if(result['isMalicious']==true || isBlack) {
       return res.json({isMalicious: true});
    }
    const ipAddress = resolveIP(domain);
    res.json({ isSuccess: true, domain });
});

// Schedule data updates using cron syntax
// cron.schedule('*/10 * * * *', async() => {
//   console.log("scheduler running");
//   await fetchDataAndUpdateMongoDB(); // Update MongoDB
//   //await fetchDataAndUpdateLocalFile(); // Update local file
// });
