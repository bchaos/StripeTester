// Rules
// 1. Sort numeric sizes based on their numeric value
// 2. Sort string sizes based on a lookup table using lowercase size strings
// 3. Sort sizes based on numeric components within the string like '32W-30L' or '10 C' or '16.5 - 33'
// 4. Sort alphabetically


// A dictionary of sizes with a weight to control the order as the value
// it doesn't matter what the weight is, as long as it's in order
// relative to other similar sizes in the group
// NOTE: the weight values should all be unique
var size_order = {
  'x-petite p' : 10,
  'x-petite' : 11,
  'petite' : 20,
  'petite p' : 21,
  'petite/small p' : 30,
  'petite/small' : 31,
  'xxxs' : 40,
  'xx-small p' : 50,
  'xx-small' : 51,
  'xxs' : 52,
  'x-small p' : 60,
  'xs' : 61,
  'ex small' : 62,
  'x-small' : 63,
  'x-small/small' : 70,
  'xs/s' : 71,
  'x-small regular' : 80,
  'p/s' : 90,
  'small p' : 91,
  'small' : 92,
  'small m' : 93,
  'small r' : 94,
  'small regular' : 95,
  'small w' : 96,
  's' : 97,
  's/m' : 100,
  'small/medium' : 101,
  'medium p' : 110,
  'medium' : 111,
  'm' : 112,
  'medium m' : 113,
  'medium r' : 114,
  'medium w' : 115,
  'medium/large p' : 120,
  'medium/large' : 121,
  'm/l' : 122,
  'r' : 130,
  'regular' : 131,
  'large p' : 140,
  'l' : 141,
  'large' : 142,
  'large m' : 143,
  'large r' : 144,
  'large regular' : 145,
  'large w' : 146,
  'large tall' : 150,
  'tall' : 151,
  'l/xl' : 160,
  'large/x-large' : 161,
  'x large' : 170,
  'x-large p' : 171,
  'x-large x' : 172,
  'x-large m' : 173,
  'x-large r' : 174,
  'x-large w'  : 175,
  'xl' : 176,
  'x-large' : 177,
  'xxl' : 180,
  'xx-large' : 181,
  'xx large' : 182,
  'xx-large p' : 183,
  'xx-large x' : 184,
  'xx-large m' : 185,
  'xx-large r' : 186,
  'xx-large w' : 187,
  '2xl' : 188,
  'xxx-large' : 190,
  'xxxl' : 191,
  '3xl' : 192,
  '4xl' : 200,
  'plus' : 210,
  'plus 2' : 220
};

var filterInt = function (value) {
  if (/^\-?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
};

var filterFloat = function (value) {
  if (/^\-?([0-9]+(\.[0-9]+)?|Infinity)$/
    .test(value))
    return Number(value);
  return NaN;
};

// Return a numeric weight value for each size that can be used for sorting
function getWeight(size) {
  if (size) {
    if (typeof size === "number" && (floatval = parseFloat(size))) {    // Rule 1
      return floatval;
    } else if ((lowercase_size = size.toLowerCase()) && size_order.hasOwnProperty(lowercase_size)) {  // Rule 2
      return size_order[lowercase_size];
    } else if ((floatval = parseFloat(size)) !== 0) { // Rule 3
      return floatval;
    } else { // Rule 4
      return 0;
    }
  } else {
    return 0;
  }
}

// Returns an array of sizes that are sorted based on a set of rules
exports.compare = function(a, b) {

  var weight_a = getWeight(a.size);
  var weight_b = getWeight(b.size);

  if (weight_a > 0 && weight_b > 0) {
    return (weight_a < weight_b) ? -1 : 1;
  } else {
    if (a.size && b.size)
      return a.size.toLowerCase().localeCompare(b.size.toLowerCase());
    else
      return 0;
  }
};