var net = require('net'),
  Q = require('q');

module.exports.status = function(cb) {
  var deferred = new Q.defer();
  var response = '';
  var status;
  var client = net.connect({port: 8126}, function() {
      client.write('stats\n');
  });

  client.on('data', function(data) {
    if (data)
      response += data.toString();
    if (response.indexOf('END'))
      client.end();
  });

  client.on('end', function() {
    response = response.split(/\n/);
    var result = {};
    for (var i = 0; i < response.length; i++) {
      var line = response[i].trim();
      if (line && line !== 'END') {
        var tokens = line.split(': ');
        result[tokens[0]] = tokens[1];
      }
    }
    if (result.uptime)
      return deferred.resolve(result);
    else
      return deferred.reject(new Error('No data returned'));
  });

  client.on('error', function(err) {
    return deferred.reject(err);
  });

  return deferred.promise;
};