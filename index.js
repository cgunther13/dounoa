'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const usersControllers = require('./controllers/users.js');
const postsControllers = require('./controllers/posts.js');
const facebookControllers = require('./controllers/facebook.js');

const app = express();
const host = process.env.IP || '0.0.0.0';
const port = process.env.PORT || 4000;

const connString = process.env.DATABASE_URL || 'postgres://localhost/dounoa';

// Store session
app.use(session({
  store: new pgSession({
    pg : pg,
    conString : connString,
  }),
  secret: process.env.FOO_COOKIE_SECRET || 'solitary-leaf',
  resave: false,
  saveUninitialized : false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

// Display HTML and CSS
app.use(express.static(__dirname + '/views/html5up-hyperspace/'));
app.set('views', 'views/html5up-hyperspace');
app.set('view engine', 'ejs');

// Parse req.body
app.use(bodyParser.urlencoded({
   extended: false
}));
app.use(bodyParser.json());

/*
/ Router
*/

// Landing Page
app.get('/landing', (req, res) => {
  res.render('landing');
});

// Register, Log In, and Log Out
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});
app.post('/register', usersControllers.registerUser)

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});
app.post('/login', usersControllers.loginUser)

app.get('/logout', usersControllers.logoutUser)


// User Pages
app.get('/', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    postsControllers.showAllPosts(req, res);
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})

app.get('/post', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    res.render('post', { error: null });
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})
app.post('/post', (req, res) => {
  // postsControllers.pay(req, res)
  postsControllers.postInput(req, res);
});

app.get('/view-post', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    postsControllers.showPost(req, res, 'view-post');
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
});

app.get('/view-my-post', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    postsControllers.showPost(req, res, 'view-my-post');
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
});

app.get('/my-searches', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    postsControllers.showMyPosts(req, res);
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})

app.get('/my-profile', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    usersControllers.showMyProfile(req, res);
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})

app.get('/reply', (req, res) => {
  if (usersControllers.isLoggedIn(req, res)){
    res.render('reply', { email: req.query.email, search: req.query.search });
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})
app.post('/reply', (req, res) => {
  usersControllers.textSearcher(req, res);
  usersControllers.emailReferred(req, res);
  postsControllers.postReply(req, res);
})

app.post('/phone', usersControllers.addPhone);

app.get('/edit-my-post', (req, res, search) => {
  if (usersControllers.isLoggedIn(req, res)){
    res.render('edit-my-post', { search: search });
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})
app.post('/edit-my-post', (req, res) => {
  postsControllers.editPost(req, res);
});

app.get('/remove', postsControllers.removePost);

// app.get('/facebook', facebookControllers.checkLoginState);

app.get('/pay', (req, res, search) => {
  if (usersControllers.isLoggedIn(req, res)){
    res.render('pay', { search: req.query.search });
  } else {
    res.render('login', { error: "You must log in to view that page" });
  }
})
app.post('/pay', function(req, res) {
  postsControllers.createCustomer(req, res);
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
