var path = require('path'),
  log = require('winston'),
  Q = require('q'),
  config = require(path.join(__dirname, '..', 'conf'));

var solr_config = config.get("solr");

var endpoints = solr_config.endpoints;

// Index of a random endpoint
var random_idx = Math.floor(Math.random() * endpoints.length);

var endpoint,
  max_attempts = endpoints.length;

var makeRequest = function(attempt, uri, queryFunction) {
  var deferred = Q.defer();

  if (attempt > max_attempts) {
    log.error("No more servers available for request");
    return false;
  } else {

    endpoint = endpoints[random_idx];
    var url = endpoint + uri;
    // console.log("============== solr url: " + url);
    log.debug("Attempt " + attempt + " index " + random_idx + " url " + url);

    queryFunction(url)
    .then(function (results) {
      // console.log("================= got result: " + results.products.length);
        deferred.resolve(results);
    }, function (error) {
        deferred.reject(error);
        random_idx++;
        if (random_idx >= endpoints.length)
          random_idx = 0;
        attempt++;
        // Try another endpoint
        makeRequest(attempt, uri, queryFunction);
    });
  }
  return deferred.promise;
};

module.exports.makeRequest = makeRequest;
