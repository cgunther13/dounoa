var config = require('./config');
var client = require('twilio')(config.accountSid, config.authToken);

function sendSMS(to, message) {
  client.messages.create({
    body: message,
    to: to,
    from: config.sendingNumber
    // mediaUrl: 'http://www.yourserver.com/someimage.png'
  }, function(err, data) {
    if (err) {
      console.error('Could not notify administrator');
      console.error(err);
    } else {
      console.log('Searcher notified');
    }
  });
};

module.exports = {
  sendSMS: sendSMS
};
