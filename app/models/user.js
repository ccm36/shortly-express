var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');


var User = db.Model.extend({
  // initialize: function() {
  //   this.on('creating', function(model, attr, options) {
  //     console.log('MODEL USERNAME: ',model.get('username'));
  //   })
  // },
  tableName: 'users',
  hasTimestamps: true

  // methods to include...
});

module.exports = User;
