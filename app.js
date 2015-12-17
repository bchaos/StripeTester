(function() {
  var checkForTestOrder, cleardb, flagOrder, fortressPool, path, setOrderToTest, stripe;

  path = require('path');

  fortressPool = require(path.join(__dirname, 'libs', 'fortressPool'));

  stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");

  stripe.events.list({
    limit: 20000
  }, function(err, charges) {
    var charge, createdTime1, createdTime2, _i, _len, _ref, _results;
    _ref = charges.data;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      charge = _ref[_i];
      if (charge.data.object.last4 === void 0 || charge.data.object.last4 === void 0) {
        console.log(charge);
        createdTime1 = charge.created;
        createdTime2 = charge.created + 20000;
        _results.push(checkForTestOrder([createdTime1, createdTime2], charge.id));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });

  cleardb = function() {
    var sql;
    if (err || typeof connection === "undefined") {
      log.error("could not connect");
      return callback(-1);
    } else {
      return sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? ';
    }
  };

  checkForTestOrder = function(query, stripeorder) {
    return fortressPool.getConnection(function(err, connection) {
      var sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? ';
        return connection.query(sql, query, function(err, results) {
          var result, _i, _len, _results;
          connection.release();
          if (err) {
            return log.error("err");
          } else if (results[0]) {
            _results = [];
            for (_i = 0, _len = results.length; _i < _len; _i++) {
              result = results[_i];
              _results.push(flagOrder({
                orderId: result.id,
                stripeId: stripeorder
              }));
            }
            return _results;
          }
        });
      }
    });
  };

  setOrderToTest = function(query) {
    return fortressPool.getConnection(function(err, connection) {
      var sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'Update orders Set status = 5 where id =?';
        query = connection.query(sql, query, function(err, results) {
          return console.log('status updated');
        });
        return console.log(query.sql);
      }
    });
  };

  flagOrder = function(query) {
    return fortressPool.getConnection(function(err, connection) {
      var sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'Insert into testOrderFlag set ? ';
        query = connection.query(sql, query, function(err, results) {
          return connection.release();
        });
        return console.log(query.sql);
      }
    });
  };

}).call(this);
