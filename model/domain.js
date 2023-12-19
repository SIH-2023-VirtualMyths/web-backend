const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const domainSchema = new Schema({
    domain: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      default: Date.now,
      required: false,
    },
  });  

const Whitelist = mongoose.model('Whitelist', domainSchema);
const Blacklist = mongoose.model('Blacklist', domainSchema);

module.exports = {
    Whitelist,
    Blacklist,
};