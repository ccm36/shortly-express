var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');


var User = db.Model.extend({
  initialize() {
    //encryption
  },
  tableName: 'users',
  hasTimestamps: true

  // methods to include...
});

module.exports = User;
