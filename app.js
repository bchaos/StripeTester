(function() {
  var buildAllCustomers, buildChargeList, checkForCharge, finalChages, findFakeOrder, flagOrder, fortressPool, getCustomers, path, setOrderToTest, stripe;

  path = require('path');

  fortressPool = require(path.join(__dirname, 'libs', 'fortressPool'));

  stripe = require("stripe")("sk_live_0c3kHXxlJulHK483M2exvX9y");

  getCustomers = function(item, callback) {
    return stripe.customers.list(item, function(err, charges) {
      var lastObject, lastindex;
      lastindex = charges.data.length - 1;
      lastObject = charges.data[lastindex].id;
      console.log(lastObject);
      return buildChargeList(charges.data, charges.data.length, 0, [], function(realcharges) {
        return callback(lastindex + 1, lastObject, realcharges);
      });
    });
  };

  buildChargeList = function(charge, length, index, realcharges, callback) {
    var createdTime1, createdTime2, last4;
    if (index === length) {
      return callback(realcharges);
    } else {
      last4 = charge[index].cards.data[0].last4;
      if (last4 !== 4242 || last4 !== 4111) {
        createdTime1 = charge[index].created;
        createdTime2 = charge[index].created + 30000;
        return checkForCharge([createdTime1, createdTime2], charge[index].id, function(result) {
          if (result.id !== 0 && result.id !== void 0) {
            realcharges.push(result.id);
          }
          return buildChargeList(charge, length, index + 1, realcharges, callback);
        });
      } else {
        return buildChargeList(charge, length, index + 1, realcharges, callback);
      }
    }
  };

  checkForCharge = function(query, stripeorder, callback) {
    return fortressPool.getConnection(function(err, connection) {
      var sql;
      if (err || typeof connection === "undefined") {
        console.log('could not connect');
        return callback(-1);
      } else {
        sql = 'SELECT * FROM orders where UNIX_TIMESTAMP(created_at) between  ? and ? ';
        return query = connection.query(sql, query, function(err, results) {
          connection.release();
          if (err) {
            return console.log('err');
          } else if (results[0]) {
            return callback(results[0]);
          } else {
            return callback(0);
          }
        });
      }
    });
  };

  findFakeOrder = function(resultList, callback) {
    var firsttime, result, whereIn, _i, _len;
    whereIn = '';
    firsttime = 1;
    for (_i = 0, _len = resultList.length; _i < _len; _i++) {
      result = resultList[_i];
      if (!firsttime) {
        whereIn += ',';
      }
      whereIn += result;
      firsttime = 0;
    }
    console.log(whereIn);
    return fortressPool.getConnection(function(err, connection) {
      var query, sql;
      if (err || typeof connection === "undefined") {
        log.error("could not connect");
        return callback(-1);
      } else {
        sql = 'SELECT * FROM orders where id not in (?) and UNIX_TIMESTAMP(created_at) >  UNIX_TIMESTAMP(NOW())-2592000';
        query = connection.query(sql, whereIn, function(err, results) {
          connection.release();
          if (err) {
            return log.error("err");
          } else if (results[0]) {
            return callback(results);
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
        connection.release();
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

  finalChages = [];

  buildAllCustomers = function(offset) {
    return getCustomers(offset, function(result, lastObject, charges) {
      finalChages = finalChages.concat(charges);
      if (result === 100) {
        return buildAllCustomers({
          limit: 100,
          starting_after: lastObject
        });
      } else {
        return findFakeOrder(finalChages, function(results) {
          var _i, _len, _results;
          console.log('total fakecharges found');
          console.log(results.length);
          _results = [];
          for (_i = 0, _len = results.length; _i < _len; _i++) {
            result = results[_i];
            _results.push(setOrderToTest(result.id));
          }
          return _results;
        });
      }
    });
  };

  buildAllCustomers({
    limit: 100
  });

}).call(this);
