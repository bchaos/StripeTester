var path = require('path'),
  Q = require('q'),
  log = require('winston'),
  util = require('util'),
  request = require('request'),
  cache = require(path.join(__dirname, 'cache')),
  config = require(path.join(__dirname, '..', 'conf'));

var CACHE_PREFIX = 'rates';
var CACHE_TTL = 7200;
var OBJ_TYPE = 'currency rates';
var ENDPOINT = 'http://openexchangerates.org/api/latest.json';

var currency_config = config.get("openexchangerates");
var app_id = currency_config.app_id;
var querystring = {
  "app_id": app_id
};

exports.getRates = function() {
  var saveToCache = false;

  return cache.getFromCache(CACHE_PREFIX, OBJ_TYPE)
    .then(function(fromCache) {
      if (fromCache) {
        log.debug("Rates cache hit");
        return fromCache;
      } else {
        log.debug("Rates cache miss");
        saveToCache = true;
        return ratesQuery();
      }
    })
    .then(function(rates) {
      if (rates && saveToCache) {
        log.debug("Saving rates to cache");
        return cache.saveToCache(CACHE_PREFIX, OBJ_TYPE, rates, CACHE_TTL);
      } else {
        return rates;
      }
    }, function (err) {
      throw new Error(err);
    });
};

var ratesQuery = function () {
  var deferred = Q.defer();

  request({
      method: 'GET',
      uri: ENDPOINT,
      timeout: 20000,
      qs: querystring,
      json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        if (body.rates) {
          deferred.resolve(body.rates);
        } else {
          var err = new Error("Rates missing from response from openexchangerate.org");
          deferred.reject(err);
        }
      } else {
        log.error("Unable to query: " + querystring.app_id + ", openexchangerate.org due to: " + error);
        deferred.reject(error);
      }
  });
  return deferred.promise;
};
