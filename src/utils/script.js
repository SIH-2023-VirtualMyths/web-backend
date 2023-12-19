const fetch = require('node-fetch');
const fs = require('fs');
const mongoose = require('mongoose');
const {Blacklist, Whitelist} = require('../../model/domain');
const path = require('path');

// Function to fetch data and update MongoDB
async function fetchDataAndUpdateMongoDB() {
  try {
    const data = fs.readFileSync(path.resolve(__dirname,'White_list.txt'),'utf-8');
    const domains = data.split('\n').map(domain => domain.trim()).filter(Boolean);
    for (const entry of domains) {
      const existingEntry = await Whitelist.findOne({ domain: entry });
      if(!existingEntry) {
        const newWhitelistEntry = new Whitelist({
          domain: entry
        })
        await newWhitelistEntry.save();
        console.log('New Whitelist entry added:', newWhitelistEntry);
      }
      else {
        console.log('Already present');
      }
      }
    }
    catch (error) {
      console.error('Error updating Blacklist:', error.message);
    }
  }

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

module.exports = {fetchDataAndUpdateLocalFile, fetchDataAndUpdateMongoDB}