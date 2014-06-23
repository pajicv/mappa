var dbinit = require("./knexinit.js");
var GeoData=require("./geodata.js");

dbinit();
var gd = new GeoData();

gd.getTables();
