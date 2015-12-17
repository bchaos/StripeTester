(function() {
  var buildChargeList, checkForTestOrder, findFakeOrder, flagOrder, fortressPool, path, setOrderToTest, stripe;

  path = require('path');

  fortressPool = require(path.join(__dirname, 'libs', 'fortressPool'));

  stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");

  stripe.charges.list({
    limit: 20000
  }, function(err, charges) {
    return buildChargeList(charges.data, charges.data.length, 0, [], function(realcharges) {
      return findFakeOrder(realcharges);
    });
  });

  buildChargeList = function(charge, length, index, realcharges, callback) {
    var createdTime1, createdTime2;
    if (index === length) {
      return callback(realcharges);
    } else {
      createdTime1 = charge[index].created - 60000;
      createdTime2 = charge[index].created + 60000;
      return checkForTestOrder([createdTime1, createdTime2], charge[index].id, function(result) {
        console.log(id);
        realcharges.push(result.id);
        return buildChargeList(charge, length, index + 1, realcharges, callback);
      });
    }
  };

  checkForTestOrder = function(query, stripeorder, callback) {
    return fortressPool.getConnection(function(err, connection) {
      var sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? ';
        return connection.query(sql, query, function(err, results) {
          connection.release();
          if (err) {
            return log.error("err");
          } else if (results[0]) {
            return callback(results[0]);
          }
        });
      }
    });
  };

  findFakeOrder = function(resultList) {
    return fortressPool.getConnection(function(err, connection) {
      var query, sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'SELECT * FROM orders where id not in (?)';
        query = connection.query(sql, resultList, function(err, results) {
          connection.release();
          if (err) {
            return log.error("err");
          } else if (results[0]) {
            return console.log(results[0]);
          }
        });
        return console.log(query.sql);
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
