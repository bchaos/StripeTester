(function() {
  var config, path;

  config = require('nconf');

  path = require('path');

  config.use('user', {
    type: 'file',
    file: path.join(__dirname, 'config', 'config.json')
  });

  config.use('global', {
    type: 'file',
    file: path.join(__dirname, 'config', 'config.json')
  });

  module.exports = config;

}).call(this);
