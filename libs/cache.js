var Memcached = require('memcached'),
  path = require('path'),
  log = require('winston'),
  Q = require('q'),
  config = require(path.join(__dirname, '..', 'conf'));

Memcached.config.algorithm = 'sha1';
Memcached.config.timeout = 1000;
Memcached.config.retry = 10000;
Memcached.config.poolSize = 25;
Memcached.config.reconnect = 30000;

var cache = new Memcached(config.get("cache"));

cache.on('failure', function(details) {
    log.error( "Memcache server " + details.server + " went down due to: " + details.messages.join( '' ) );
});

cache.on('issue', function(details) {
    log.error( "Memcache server " + details.server + " has issue: " + details.messages.join( '' ) );
});

cache.on('reconnected', function(details) {
    log.info( "Memcache server " + details.server + " reconnected.");
});

getFromCache = function(objectId, objectType) {
  var deferred = new Q.defer();

  function response_handler(err, result) {
    if (err) {
      log.error("Unable to get " + objectType  + " from cache due to: " + err);
      deferred.resolve(false);
    } else {
      deferred.resolve(result);
    }
  }

  if (objectId) {
    cache.get(objectId, response_handler);
  } else {
    deferred.resolve(false);
  }
  return deferred.promise;
};

saveToCache = function(objectId, objectType, object, ttl) {
  var deferred = new Q.defer();
  log.debug("saveToCache: ",object);
  function response_handler(err, result) {
    if (err)
      log.error("Unable to get " + objectType  + " from cache due to: " + err);
    log.debug("Saved " + objectId + " to cache.");
    deferred.resolve(object);
  }

  if (objectId && object) {
    cache.set(objectId, object, ttl, response_handler);
   } else {
    deferred.resolve(false);
  }
  return deferred.promise;
};

removeFromCache = function(objectId, objectType) {
  var deferred = new Q.defer();

  function response_handler(err, result) {
    if (err) {
      log.error("Unable to remove " + objectType  + " from cache due to: " + err);
      deferred.resolve(false);
    } else {
      deferred.resolve(true);
    }
  }

  if (objectId)
    cache.del(objectId, response_handler);
  else
    deferred.resolve(false);
  return deferred.promise;
};

module.exports = cache;
module.exports.getFromCache = getFromCache;
module.exports.saveToCache = saveToCache;
module.exports.removeFromCache = removeFromCache;
