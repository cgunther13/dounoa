const pg = require('pg');
const connString = process.env.DATABASE_URL || 'postgres://localhost/dounoa';

// Connect to the postgres database
const client = new pg.Client(connString);
client.connect((err) => {
  if (err) {
    return;
  }
});

function insertPost(email, search, description, category, callback){
  var query = client.query("SELECT * FROM POSTS WHERE SEARCH = $1", [search])
  query.on("row", function (row, result) {
    result.addRow(row)
  });
  query.on("end", function (result) {
    if (result.rows.length > 0) {
      callback("That search already exists. Please be more specific");
    } else {
      client.query("INSERT INTO POSTS(EMAIL, SEARCH, DESCRIPTION, CATEGORY)" +
        " VALUES($1, $2, $3, $4)", [email, search, description, category],
        (callback));
    }
  });
}

function insertReply(search, name, email, qualifications, referrer, callback) {
  client.query("INSERT INTO REPLIES(SEARCH, REPLY_NAME, REPLY_EMAIL,"
    + " QUALIFICATIONS, REFERRER) VALUES($1, $2, $3, $4, $5)", [search, name,
    email, qualifications, referrer], (callback));
}

function findAllPosts(req, callback){
  var posts = []
  if(req.query.category == "all" || req.query.category == undefined) {
    var query = client.query('SELECT SEARCH FROM POSTS');
    query.on("row", function (row, result) {
      posts.push(row.search)
    });
    query.on("end", function (result) {
      // Return all listed posts and redirect to /home
      callback(posts);
    });
  } else {
    var query = client.query('SELECT SEARCH FROM POSTS WHERE CATEGORY = $1',
      [req.query.category]);
    query.on("row", function (row, result) {
      posts.push(row.search)
    });
    query.on("end", function (result) {
      // Return all listed posts and redirect to /home
      callback(posts);
    });
  }
}

function findPost(req, search, page, callback){
  var post = [];
  var reply_info = [];
  var query = client.query("SELECT POSTS.*, USERS.*, REPLIES.* FROM POSTS FULL"
    + " JOIN USERS ON POSTS.EMAIL = USERS.EMAIL FULL JOIN REPLIES ON"
    + " POSTS.SEARCH = REPLIES.SEARCH WHERE POSTS.SEARCH = $1", [search]);
  query.on("row", function (row, result) {
    post.push(search, row.description, row.email, row.name, row.paid, page);
    reply_info.push(row.reply_email, row.reply_name, row.referrer,
      row.qualifications);
  });
  query.on("end", function (result) {
    callback(post, reply_info);
  });
}

// function findMyPost(req, search, callback){
//   var post = [];
//   var reply_info = [];
//   var query = client.query("SELECT POSTS.*, USERS.*, REPLIES.* FROM POSTS FULL"
//     + " JOIN USERS ON POSTS.EMAIL = USERS.EMAIL FULL JOIN REPLIES ON"
//     + " POSTS.SEARCH = REPLIES.SEARCH WHERE POSTS.SEARCH = $1 AND POSTS.EMAIL ="
//     + " $2", [search, req.session.email]);
//   query.on("row", function (row, result) {
//     post.push(search, row.description, row.email, row.name);
//     reply_info.push(row.reply_email, row.reply_name, row.referrer,
//       row.qualifications);
//   });
//   query.on("end", function (result) {
//     // Return user's posts and redirect to /my-searches
//     callback(post, reply_info);
//   });
// }

function changePost(req, callback) {
  client.query("UPDATE POSTS SET SEARCH = $1, DESCRIPTION = $2, CATEGORY = $3"
  + " WHERE EMAIL = $4 AND SEARCH = $5", [req.body.new, req.body.description,
    req.body.category, req.session.email, req.body.old], (callback));
}

function deletePost(email, search, callback) {
  client.query("DELETE FROM POSTS * WHERE EMAIL = $1 AND SEARCH = $2",
    [email, search], (callback));
}

function updatePaid(email, search) {
  client.query("UPDATE POSTS SET PAID = TRUE WHERE EMAIL = $1 AND SEARCH = $2",
    [email, search]);
}

module.exports = {
  insertPost: insertPost,
  // findMyPost: findMyPost,
  findAllPosts: findAllPosts,
  findPost: findPost,
  insertReply: insertReply,
  deletePost: deletePost,
  changePost: changePost,
  updatePaid: updatePaid
};
