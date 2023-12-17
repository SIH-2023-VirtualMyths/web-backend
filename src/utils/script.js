const fetch = require('node-fetch');
const fs = require('fs');
//const mongoose = require('mongoose');

// MongoDB connection setup
//mongoose.connect('mongodb://localhost:27017/yourdatabase', { useNewUrlParser: true, useUnifiedTopology: true });
// const Schema = mongoose.Schema;

// // Define a MongoDB schema
// const domainsSchema = new Schema({
//   RegisterPositionId: Number,
//   DomainAddress: String,
//   InsertDate: Date,
//   DeleteDate: Date
// });

//const Domain = mongoose.model('Domain', domainsSchema);

// Function to fetch data and update MongoDB
// async function fetchDataAndUpdateMongoDB() {
//   try {
//     const response = await fetch('https://hole.cert.pl/domains/domains.json');
//     const data = await response.json();

//     // Assuming data is an array of domains
//     for (const domain of data) {
//       await Domain.findOneAndUpdate(
//         { RegisterPositionId: domain.RegisterPositionId },
//         domain,
//         { upsert: true }
//       );
//     }

//     console.log('Data updated successfully.');
//   } catch (error) {
//     console.error('Error fetching or updating data:', error.message);
//   }
// }

// Function to fetch data and update local file
async function fetchDataAndUpdateLocalFile() {
  try {
    const response = await fetch('https://hole.cert.pl/domains/domains.json');
    const data = await response.json();

    fs.writeFileSync('malware_domains.json', JSON.stringify(data, null, 2));

    console.log('Data updated and saved to local file.');
  } catch (error) {
    console.error('Error fetching or updating data:', error.message);
  }
}

module.exports = fetchDataAndUpdateLocalFile

