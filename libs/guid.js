var uuid = require('node-uuid');

module.exports = function() {
  return uuid.v4({rng: uuid.nodeRNG});
};