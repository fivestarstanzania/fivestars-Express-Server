const admin = require('firebase-admin');
const serviceAccount = require('../fivestarsecom-7a7d2-firebase-adminsdk-z8mre-b488dc53d8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
