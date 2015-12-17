var util = require('util'),
  winston = require('winston'),
  node_syslog = require('node-syslog');

var levels = {
  debug: node_syslog.LOG_DEBUG,
  info: node_syslog.LOG_INFO,
  warn: node_syslog.LOG_WARNING,
  error: node_syslog.LOG_ERR
};


var Syslog = winston.transports.Syslog = function(options) {
  //
  // Name this logger
  //
  this.name = options.app_name || process.title;

  node_syslog.init(this.name, node_syslog.LOG_PID | node_syslog.LOG_ODELAY, node_syslog.LOG_LOCAL0);

  //
  // Set the level from your options
  //
  this.level = options.level || 'info';

  //
  // Configure your storage backing as you see fit
  //
};

//
// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(Syslog, winston.Transport);

Syslog.prototype.log = function (level, msg, meta, callback) {
  if (!levels[level]) {
    return callback(new Error('Cannot log unknown syslog level: ' + level));
  }

  if (typeof msg !== 'string') {
    msg = util.inspect(msg);
  }

  var syslog_level = levels[level];

  node_syslog.log(syslog_level, level.toUpperCase() + ': ' + msg);
  callback(null, true);
};

process.on('exit', function() {
  node_syslog.close();
});
