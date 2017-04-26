const path = require('path');

var postsModels = require('../models/posts.js');

var stripeApiKey = "sk_live_jrU9P3v2WvS0hPPWdFudkNPL";
var stripeApiKeyTesting = "sk_test_OIBaFhgd1DAEGvdD2vW62oHY";
var stripe = require("stripe")(
  stripeApiKey
);

function postInput(req, res) {
  var callback = function(err) {
    if (err) {
      res.render('post', { error: err });
      // return res.sendStatus(500);
    } else {
      showPost(req, res, 'view-my-post');
    }
  }
  // Insert post information into the POSTS database
  postsModels.insertPost(req.session.email, req.body.search,
    req.body.description, req.body.category, callback);
}

function postReply(req, res) {
  var callback = function(err) {
    if (err) {
      return res.sendStatus(500);
    }
    else {
      res.redirect('/');
    }
  }
  // Insert reply information into the REPLIES database
  postsModels.insertReply(req.body.search, req.body.name,
    req.body.email, req.body.qualifications, req.session.email, callback);
}

function showAllPosts(req, res) {
  var callback = function(posts, err) {
    if (err) {
      return res.sendStatus(500);
    } else {
      res.render('home', { posts: posts, category: req.query.category || "all" });
    }
  }
  // Retrieve all posts from the POSTS database
  postsModels.findAllPosts(req, callback);
}

function showPost(req, res, page) {
  var callback = function(post, reply_info, page, err) {
    if (err) {
      return res.sendStatus(500);
    } else {
      res.render(post[5], { search: post[0], description: post[1], email:
        post[2], name: post[3], paid: post[4], reply_info: reply_info });
    }
  }
  // Retrieve one post from the POSTS database
  postsModels.findPost(req, req.query.search || req.body.search, page, callback);
}

// function showMyPost(req, res) {
//   var callback = function(post, reply_info, err) {
//     if (err) {
//       return res.sendStatus(500);
//     } else {
//       res.render('view-my-post', { search: post[0], description: post[1],
//         email: post[2], name: post[3], reply_info: reply_info });
//     }
//   }
//   // Retrieve current user's posts from the POSTS database
//   postsModels.findMyPost(req, req.query.search || req.body.search, callback);
// }

function editPost(req, res) {
  var callback = function(err) {
    if (err) {
      return res.sendStatus(500);
    } else {
      res.redirect('/my-profile');
    }
  }
  // Edit information into the POSTS database
  postsModels.changePost(req, callback);
}

function removePost(req, res) {
  var callback = function(err) {
    if (err) {
      return res.sendStatus(500);
    } else {
      res.redirect('/my-profile');
    }
  }
  // Insert post information into the POSTS database
  postsModels.deletePost(req.session.email, req.query.search, callback);
}

function createCustomer(req, res) {
  stripe.customers.create({
    description: 'Customer for ' + req.session.email,
    source: {
      object: "card",
      exp_month: req.body.month,
      exp_year: req.body.year,
      number: req.body.number,
      cvc: req.body.cvc,
    },
  }, function (err, customer) {
    if (err) {
      var msg = err || "unknown";
      res.send("Error while processing your payment: " + msg);
    }
    else {
      console.log(stripe.customers.sources)
      console.log('Success! Customer with Stripe ID ' + customer.id + ' just signed up!');
      chargeCustomer(req, res)
    }
  });
}

function chargeCustomer(req, res) {
  stripe.charges.create({
    amount: 100,
    currency: "usd",
    source: {
      object: "card",
      exp_month: req.body.month,
      exp_year: req.body.year,
      number: req.body.number,
      cvc: req.body.cvc,
    },
    description: "Charge for " + req.session.email
  }, function(err, charge) {
    if (err) {
      var msg = err || "unknown";
      res.send("Error while processing your payment: " + msg);
    }
    else {
      console.log('Success! Customer just paid!');
      postsModels.updatePaid(req.session.email, req.query.search);
      showPost(req, res, 'view-my-post');
    }
  });
}

module.exports = {
  postInput: postInput,
  showAllPosts: showAllPosts,
  showPost: showPost,
  // showMyPost: showMyPost,
  postReply: postReply,
  removePost: removePost,
  editPost: editPost,
  createCustomer: createCustomer,
  chargeCustomer: chargeCustomer
}
