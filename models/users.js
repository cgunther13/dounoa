const pg = require('pg');
const scrypt = require('scrypt');
var scryptParameters = scrypt.paramsSync(0.1);

// Connect to the postgres database
const connString = process.env.DATABASE_URL || 'postgres://localhost/dounoa';
const client = new pg.Client(connString);
client.connect((err) => {
  if (err) { return; }
});

function hashPassword(plaintextPassword, callback){
  return scrypt.kdfSync(plaintextPassword, scryptParameters);
}

function insertUser(name, email, hash, callback){
  client.query('INSERT INTO USERS(NAME, EMAIL, PASSWORD) VALUES($1, $2, $3)',
    [name, email, hash]);
}

function authenticate(email, password, callback){
  // Retrieve user's password
  var query = client.query('SELECT PASSWORD FROM USERS WHERE EMAIL = $1',
    [email]);
  query.on("row", function (row, result) {
    result.addRow(row);
  });
  query.on("end", function (result) {
    if (result.rows.length > 0) {
      // Email found and password returned
      const hash = result.rows[0].password;
      // Return true if password correct; false otherwise
      callback(null, scrypt.verifyKdfSync(hash, password));
    } else {
      callback("Email not found", false);
    }
  });
}

function storeSession(req, email, password){
  // Retrieve user's information
  var query = client.query("SELECT * FROM USERS WHERE EMAIL = $1 AND PASSWORD ="
    + " $2", [email, password]);
  if (query) {
    // Set the session
    req.session.email = email;
    req.session.password = password;
  }
}

function getUserInfo(req, callback) {
  const user = [];
  const posts = [];
  var query = client.query("SELECT USERS.*, POSTS.* FROM USERS FULL JOIN POSTS "
  + "ON USERS.EMAIL = POSTS.EMAIL WHERE USERS.EMAIL = $1", [req.session.email]);
  query.on("row", function (row, result) {
    user.push(row.name);
    user.push(row.photo);
    user.push(row.payment_tier);
    user.push(row.phone_number);
    posts.push(row.search);
    posts.push(row.description);
  });
  query.on("end", function (result) {
    callback(null, user, posts);
  });
}

function insertPhone(phone_number, email, callback) {
  client.query('UPDATE USERS SET PHONE_NUMBER = $1 WHERE EMAIL = $2',
    [phone_number, email]);
}

function getPhone(email, callback) {
  var phone_number = []
  var query = client.query("SELECT PHONE_NUMBER FROM USERS WHERE EMAIL = $1",
    [email]);
  query.on("row", function (row, result) {
    phone_number.push(row.phone_number);
  });
  query.on("end", function (result) {
    if (phone_number.length == 1) {
      callback(null, phone_number);
    } else {
      callback("Phone number not found", false);
    }
  });
}

module.exports = {
  hashPassword: hashPassword,
  insertUser: insertUser,
  authenticate: authenticate,
  storeSession: storeSession,
  getUserInfo: getUserInfo,
  insertPhone: insertPhone,
  getPhone: getPhone
};
