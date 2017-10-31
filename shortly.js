var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');

var app = express();
app.use(session({secret: 'get-out-of-here', cookie: {maxAge: 6000000}}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
  console.log('serving ', req.method, ' at ', req.url)
  next()
})


app.get('/', util.isLoggedIn, function(req, res) {
  res.render('index');
});

app.get('/login', util.isAlreadyLoggedIn, function(req, res) {
  res.render('login')
})

app.get('/signup', util.isAlreadyLoggedIn, function(req, res) {
  res.render('signup')
})

app.get('/create', util.isLoggedIn, function(req, res) {
  res.render('index');
});

app.get('/logOut', util.isLoggedIn, function(req, res) {
  req.session.userId = null;
  res.redirect('/login');
});

app.get('/links', util.isLoggedIn, function(req, res) {
  Links.reset().fetch().then(function(links) {
    var linkList = links.filter( function ( link ) {
      return link.attributes.userId === req.session.userId;
    })
    console.log('LINK List: ', linkList);
    res.status(200).send(linkList);
  });
});

app.post('/links', /*MIDDLEWARE AUTH*/function(req, res) {
  var uri = req.body.url;
  var userId = req.session.userId;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          return res.sendStatus(404);
        }
        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin,
          userId: req.session.userId
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

app.post('/login', /*MIDDLEWARE AUTH*/function(req, res) {
  // req.body

  var user = req.body.username;
  var password = req.body.password



  new User({username: user}).fetch().then(function(found) {
    if ( found ) {
      bcrypt.compare(password, found.attributes.password, function(err, isPassword) {
        if (err) { throw err; }
        if (isPassword) {
          req.session.username = user;
          req.session.userId = found.attributes.id;
          res.status(201);
          res.redirect('/');
        } else {
          res.status(401);
          res.redirect('/login')
        }
      });
    } else {
        res.status(400);
        res.redirect('/login');
    }
  });
});

app.post('/signup', function(req, res) {
  var user = req.body.username;
  var password = req.body.password;
  var salter = 10;
  var privPassword;
  console.log('INSDE BCRPYT');
  bcrypt.hash(password, null, null, function(err, hash) {
    if (err) { throw err; }
    privPassword = hash;
  });


  new User({username: user}).fetch().then(function(found) {
    if ( found ) {
      res.status(401);
      res.redirect('/login')
    } else {
      req.session.userId = user;
      Users.create({
        username: user,
        password: privPassword
      })
      .then(function(newUser) {
        res.status(200);
        res.redirect('/');
      });
    }
  });
});
/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
