// knexinit.js

var Knex  = require('knex');

module.exports = function() {
	Knex.knex = Knex.initialize({
	  client: 'pg',
	  connection: {
			host     : '127.0.0.1',
			user     : 'postgres',
			password : 'Elemirac1',
			database : 'us',
			charset  : 'UTF8_GENERAL_CI'
	  }
	});
	
};
