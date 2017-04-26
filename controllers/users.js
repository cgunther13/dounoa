const path = require('path');

var usersModels = require('../models/users.js');
var postsControllers = require('../controllers/posts.js');
var twilio = require('../twilio/twilioClient.js');
var email = require("emailjs");
var server = email.server.connect({
   user:    "dounoa213@gmail.com",
   password:  "Basketball6",
   host:    "smtp.gmail.com",
   ssl:     true
});

function registerUser(req, res) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // Validate the inputs
  if (req.body.name == "" || req.body.name.length > 50) {
    res.render('register', { error: "First name must be between 1 and 50 characters" });
    return;
  } else if (req.body.email == "" || req.body.email.length > 50) {
    res.render('register', { error: "Email must be between 1 and 50 characters" });
    return;
  } else if (!re.test(req.body.email)) {
    res.render('register', { error: "Please enter a valid email" });
    return;
  } else if (req.body.password == "" || req.body.password.length > 50 ||
    req.body.confirm == "" || req.body.confirm.length > 50 ||
    req.body.password != req.body.confirm) {
      res.render('register', { error: "Passwords must be between 1 and 50 characters and match" });
      return;
  }

  // Hash the password
  hash = usersModels.hashPassword(req.body.password);

  // Insert the user into the USERS database
  usersModels.insertUser(req.body.name, req.body.email, hash);

  // Store the session
  req.session.email = req.body.email;
  req.session.password = req.body.password;

  // Insert post, if any
  if (req.body.search) {
    postsControllers.postInput(req, res);
  }

  res.redirect('/');
}

function loginUser(req, res) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // Validate the inputs
  if (req.body.email == "" || req.body.email.length > 50) {
    res.render('login', { error: "Email must be between 1 and 50 characters" });
    return;
  } else if (!re.test(req.body.email)) {
    res.render('login', { error: "Please enter a valid email" });
    return;
  } else if (req.body.password == "" || req.body.password.length > 50) {
    res.render('login', { error: "Password must be between 1 and 50 characters" });
    return;
  }

  // Check if user entered a valid email and the correct password
  usersModels.authenticate(req.body.email, req.body.password,
    function(err, success) {
    if (success) {
      // Get user info from the USERS database and store the session
      usersModels.storeSession(req, req.body.email, req.body.password);
      res.redirect('/');
    } else {
      // Password is incorrect
      res.render('login', { error: "Username or password is incorrect"});
    }
  });
}

function logoutUser(req, res) {
  var callback = function(err) {
    if (err) {
      return res.sendStatus(500);
    } else {
      res.redirect('/login');
    }
  }
  req.session.destroy(callback);
}

function isLoggedIn(req, callback) {
  return (req.session.email != null & req.session.password != null);
}

function showMyProfile(req, res) {
  // Retrieve user/post info
  usersModels.getUserInfo(req, function(err, user, posts) {
    res.render('my-profile', { name: user[0], email: req.session.email,
      photo: user[1], payment_tier: user[2], phone_number: user[3],
      posts: posts })
  });
}

function addPhone(req, res) {
  // Insert phone number into USERS database
  var phone_number = req.body.phone_number.replace(/\D/g,'');
  usersModels.insertPhone(phone_number, req.session.email);
  res.redirect('/my-profile');
}

function textSearcher(req, res) {
  var callback = function(err, phone_number) {
    if (phone_number[0]) {
      twilio.sendSMS("+1" + phone_number[0], "You have a new reply for your "
      + req.body.search + " search from " + req.body.name + ". View it at"
      + " dounoa213.com/view-my-post?search=" + encodeURI(req.body.search));
    }
  }
  usersModels.getPhone(req.query.email, callback);
}

function emailReferred(req, res) {
  var message	= {
   text:	"You have been referred by " + req.session.email + " on Do You Know A. "
     + "See the post and get in touch at dounoa213.com/view-post?search=" +
     encodeURI(req.body.search),
   from:	"Do You Know A",
   to:		req.body.email,
   cc:		"",
   subject:	"Do You Know A... Referral",
  };
  server.send(message, function(err, message) { console.log(err || message); });
}

module.exports = {
  registerUser: registerUser,
  loginUser: loginUser,
  logoutUser: logoutUser,
  isLoggedIn: isLoggedIn,
  showMyProfile: showMyProfile,
  addPhone: addPhone,
  textSearcher: textSearcher,
  emailReferred: emailReferred
}
