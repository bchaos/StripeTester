var path = require('path'),
  crypto = require('crypto'),
  url = require("url"),
  Q = require('q'),
  log = require('winston'),
  pool = require(path.join(__dirname, 'pool')),
  cache = require(path.join(__dirname, 'cache'));

var CACHE_PREFIX = 'apipartner:';
var CACHE_TTL = 86400;

// validate api token per domain
// return the sub domain that matches the token
// for example if they registered combinecouture.com, but this function gets 'www.combinecouture.com' as $domain
// it will return 'combinecouture.com'
// it returns false if there is no match
exports.validateToken = function(token, domain) {
  
  if (!token || token.length < 16 || !domain) {
    console.log ('false here');
    return false;
  }
  
  parts = domain.split('.');
  // This tries combinations of a domain like www.x.y.z.com
  // 1. www.x.y.z.com
  // 2. x.y.z.com
  // ...
  // ending at z.com
  do {
    rs = token.substring(0, 16);
    sub_domain = parts.join('.');
    var hash = crypto.createHash('md5').update(rs + sub_domain).digest("hex");
    console.log (hash);
    var start = token.charCodeAt(15) - 65;
    hash = hash.substring(start, start + 16);
    console.log ('rshash:'+rs+hash);
    if (token === rs + hash) {
      return sub_domain;
    }
  } while (parts.shift() && parts.length >= 2);
  return false;
};

exports.validatePreview = function(frameId, userId, key, ts) {
  var deferred = new Q.defer();
  var now = Math.floor(Date.now() / 1000); // time in seconds

  if (!frameId || !userId || !key || !ts) {
    deferred.resolve(false);
  } else if (Math.abs(now - ts) > 15) {
    // Invalid if the timestamp is too old by 15 seconds in either direction
    log.warn('ts is too old. ts=' + ts + " now=" + now + " diff=" + Math.abs(now - ts));
    deferred.resolve(false);
  } else {

    // get last_login and partnerId for the user
    getUserInfoFromDB(userId)
    .then(function(userInfo) {
      if (userInfo && userInfo.partnerId && userInfo.lastLogin) {
        log.debug("User info found, lastLogin=" + userInfo.lastLogin + " partnerId=" + userInfo.partnerId);
        var hash = crypto.createHash('sha256').update(userInfo.lastLogin.toString() + userInfo.partnerId.toString() + ts.toString()).digest("hex");
        log.debug("Key check: hash=" + hash + " key=" + key);
        if (hash.toString() === key.toString()) {
          log.debug("Key check: access granted");
          deferred.resolve(userInfo.partnerId);
        } else {
          log.debug("Key check: access denied");
          deferred.resolve(false);
        }
      } else {
        deferred.resolve(false);
      }
    }, function (err) {
      throw new Error(err);
    })
    .done();
  }

  return deferred.promise;
};

exports.getPartnerId = function(token, domain) {
  log.debug("7.5 ************************** frame_auth calling getPartnerId");
  var saveToCache = false;

  return getPartnerFromCache(token, domain)
  .then(function(fromCache) {
    if (fromCache) {
      log.debug("7.9 ========================== cache hit");
      log.debug("Partner cache hit");
      return fromCache;
    } else {
      log.debug("Partner cache miss");
      saveToCache = true;
      return getPartnerFromDB(token, domain);
    }
  })
  .then(function(partnerId) {
    if (partnerId) {
      log.debug("7.99 ===================== got partnerid: " + partnerId);
      return partnerId;
    } else {
      log.debug("Partner not found in db");
      return false;
    }
  })
  .then(function(partnerId) {
    // log.debug("7.991 ================== save to cache? " + partnerId && saveToCache);
    if (partnerId && saveToCache) {
      log.debug("Saving partner to cache");
      return savePartnerToCache(token, domain, partnerId);
    } else {
      log.debug("7.991 =============== returning partnerId: " + partnerId);
      return partnerId;
    }
  }, function (err) {
    throw new Error(err);
  });

};

exports.domain = function(req) {
    
  var domain = false, referer;
  referer = req.get('Referer');
  if (referer) {
    var parsed_url = url.parse(referer);
    if (parsed_url.hostname)
      domain = parsed_url.hostname;
  }
  else{ 
    console.log(req.get('origin'));
    domain = req.get('origin');
  }
  return domain;
};

getPartnerFromCache = function(token, domain) {
  log.debug("7.6 ========================== token: " + token);
  log.debug("7.7  =========================== domain: " + domain);
  var deferred = new Q.defer();

  function response_handler(err, result) {
    if (err) {
      log.error("Unable to get the partner from cache due to: " + err);
      deferred.resolve(false);
    } else {
      deferred.resolve(result);
    }
  }

  if (token && domain) {
    log.debug (" 7.8 =========================== getting partner id from cache");
    var key = crypto.createHash('md5').update(token + domain).digest("hex");
    cache.get(CACHE_PREFIX + key, response_handler);
  } else {
    deferred.resolve(false);
  }

  return deferred.promise;
};

savePartnerToCache = function(token, domain, partnerId) {
  var deferred = new Q.defer();
 log.debug("7.991 ================== saving partner to cache. token: " + token + " domain: " + domain + " partnerId: " + partnerId);

  function response_handler(err, result) {
    if (err)
      log.error("Unable to save partner to cache due to: " + err);
    deferred.resolve(partnerId);
  }

  if (token && domain && partnerId) {
    var key = crypto.createHash('md5').update(token + domain).digest("hex");
    cache.set(CACHE_PREFIX + key, partnerId, CACHE_TTL, response_handler);
   } else {
    deferred.resolve(false);
  }
  return deferred.promise;
};

getUserInfoFromDB = function(userId) {
  var deferred = new Q.defer();
  var partnerId = null;

  function response_handler(err, rows, fields) {
    if (err) {
      log.error("Unable to get user info from DB due to: " + err);
      deferred.reject(err);
    } else {
      var i, userInfo;
      if (rows.length <= 0) {
        deferred.resolve(false);
      } else {
        if (rows.length > 0) {
          userInfo = {};
          userInfo.partnerId = rows[0].partner_id;
          userInfo.lastLogin = rows[0].last_login;
        }
        deferred.resolve(userInfo);
      }
    }
  }

  pool.getConnection(function(err, connection) {
    if (err || typeof connection === "undefined") {
      log.error("Unable to get a connection to the DB due to: " + err);
      deferred.reject(err);
      if (connection)
        connection.destroy();
    } else {
      var sql = 'SELECT last_login, partner_id FROM users WHERE id=? AND active=1';

      connection.query(sql, userId, response_handler);
      connection.release();
    }
  });

  return deferred.promise;
};

getPartnerFromDB = function(token, domain) {
  var deferred = new Q.defer();
  var partnerId = null;

  function response_handler(err, rows, fields) {
    if (err) {
      log.error("Unable to get a partner from DB due to: " + err);
      deferred.reject(err);
    } else {
      var i;
      if (rows.length <= 0) {
        deferred.resolve(false);
      } else {
        if (rows.length > 0) {
          partnerId = rows[0].partner_id;
        }
        deferred.resolve(partnerId);
      }
    }
  }

  pool.getConnection(function(err, connection) {
    if (err || typeof connection === "undefined") {
      log.error("Unable to get a connection to the DB due to: " + err);
      deferred.reject(err);
      if (connection)
        connection.destroy();
    } else {
      var sql = 'SELECT * FROM tokens JOIN partner ON tokens.partner_id = partner.pid WHERE token=? AND domain=? AND partner.status=1';
      connection.query(sql, [token, domain], response_handler);
      connection.release();
    }
  });

  return deferred.promise;
};
