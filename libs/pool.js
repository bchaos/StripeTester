var mysql = require('mysql'),
  path = require('path'),
  log = require('winston'),
  config = require(path.join(__dirname, '..', 'conf'));

function handleDisconnect(connection) {
  connection.on('error', function(err) {
    if (!err.fatal) {
      return;
    }

    if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
      throw err;
    }

    log.warn('Re-connecting lost connection: ' + err.message);
    connection = mysql.createConnection(connection.config);
    handleDisconnect(connection);
    connection.connect(function(err) {
      if (err)
        log.error('Database reconnection error: ' + err.message);
    });
  });
}

var db_config = config.get("database");

db_config.createConnection = function createConnection(config) {
  
  connection = mysql.createConnection(config);
  handleDisconnect(connection);
  return connection;
};

module.exports = mysql.createPool(db_config);
