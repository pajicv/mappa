var fs = require("fs");
var topojson = require("topojson");
var states = JSON.parse(fs.readFileSync('states.json', 'utf8'));
var counties = JSON.parse(fs.readFileSync('us_border.json', 'utf8'));
var topology = topojson.topology({counties:counties}, {verbose: true});
fs.writeFileSync('topology.json', JSON.stringify(topology)); 



