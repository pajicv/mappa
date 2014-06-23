var MapShaper = require('mapshaper');
var ogr2ogr = require('ogr2ogr');
var topojson = require("topojson");

var fs = require('fs');

function GeoData() {

	this.tables = [];
	
	/*this.query = 'SELECT row_to_json(fc)::text FROM ( SELECT \'FeatureCollection\' As type, array_to_json(array_agg(f)) As features '
		+ 'FROM (SELECT \'Feature\' As type , ST_AsGeoJSON(c.geom)::json As geometry , row_to_json((SELECT a FROM (SELECT AAAAA) As a'
		+ ')) As properties FROM TTTTT As c   ) As f )  As fc;';*/
		
	this.query = 'SELECT json::text FROM geojson WHERE name = ?';
		
	//this.content = null;
	
	this.topojson = null;
	
	this.geojsonFile = null;
	
	this.filename = null;

}

GeoData.prototype.getTables = function(request, response) {
	var me = this;

	var knex = require('knex').knex;
	
	knex('information_schema.tables').where('table_schema', 'public')
									 .andWhere('table_type', 'BASE TABLE')
									 .select('table_name')
									 .then(function(rs) {
										var tables = [];
										for(var i = 0; i < rs.length; i++) {
											tables.push(rs[i].table_name);
										}
										response.send({data: tables, sucess: true, message: 'Tables are succesfully read'});
									 }, function(knexerr) {
										response.send(500, {data:[], success: false, message: 'Error reading tables'});
										console.log(knexerr);
									 });
	
}

GeoData.prototype.loadData = function(request, response) {
	var me = this;

	var knex = require('knex').knex;
	
	var tableName = request.param('tableName')
		, attributes = request.param('attributes');
	
	if(!tableName) {
		response.send(500, {success: false, message: 'Table name is not provided'});
	}
	
	me.filename = './public/topojson/' + tableName + '.json';
		
	me.geojsonFile = './public/geojson/' + tableName + '.json';
	
	if(!attributes) {
		response.send(500, {success: false, message: 'Attributes are not provided'});
	}	
	
	knex.raw(this.query, [tableName]).then(function(result) {
		
		var geojson = JSON.parse(result.rows[0].json);
		
		fs.writeFileSync(me.geojsonFile, JSON.stringify(geojson));
		
		me.topojson = topojson.topology({collection: geojson}, {verbose:true});
		
		fs.writeFile(me.filename, JSON.stringify(me.topojson), function(err) {
			if(err) {
				me.filename = null;
				me.topojson = null;
				response.send(500, 'Error in generating topojson');
			} else {
				response.send(me.topojson);
			}
		});
	
	});
	
	
}

GeoData.prototype.msSimplify = function(request, response) {
	var me = this;
	
	var simplPct = request.param('simplPct'),
		algorithm = request.param('algorithm'),
		repair = request.param('repair'),
		autosnap = request.param('autosnap'),
		preventRemoval = request.param('preventRemoval'),
		coordPrecision = request.param('coordPrecision');
		
	fs.readFile(me.geojsonFile, {encoding: 'utf8'}, function(err, data) {
		var options = {};
		
		if(autosnap) {
			options.snapping = autosnap;
		}
		
		if(coordPrecision) {
			options.precision = coordPrecision;
		}
	
		var importedContent = MapShaper.importContent(data, 'json', options);
		
		var simplified = MapShaper.simplifyPaths(importedContent.arcs, algorithm, false);
		
		if(simplPct) {
			importedContent.arcs.setRetainedPct(simplPct);
		}
		
		if(repair) {
			MapShaper.findAndRepairIntersections(importedContent.arcs);
		}
		
		if(preventRemoval) {
			MapShaper.protectShapes(importedContent.arcs, importedContent.layers);
		}
		
		var files = MapShaper.exportContent(importedContent.layers, importedContent.arcs, {output_format: 'geojson'});
	
		var topology = topojson.topology({collection: JSON.parse(files[0].content)}, {verbose:true}); 
		
		//fs.writeFile(me.geojsonFile, JSON.stringify(files[0].content), function(err) {
		//	if (err) {
		//		console.log('ERROR: GeoJSON is not created');
		//		response.send(500, {success: false, message: 'ERROR: GeoJSON is not created'});
		//	} else {
				fs.writeFile(me.filename, JSON.stringify(topology), function(err) {
					if (err) {
						console.log('ERROR: TopoJSON is not created');
						response.send(500, {success: false, message: 'ERROR: TopoJSON is not created'});
					} else {
						response.send(topology);
					}
				});
		//	}
		//});
		
	});
	
	
}

GeoData.prototype.tjSimplify = function(request, response) {
	var me = this;
	
	var minArea = request.param('minArea'),
		retainProportion = request.param('retainProportion');
	
	if(typeof minArea === 'undefined' ) {
		response.send(500, {success: false, message: 'Minimal area is not provided'});
		return;
	}
	
	fs.readFile(me.filename, {encoding: 'utf8'}, function(err, data) {
		
		var topology = JSON.parse(data);
		
		var result = topojson.simplify(topology, {
			"coordinate-system": "spherical",
			"minimum-area": minArea,
			"retain-proportion": retainProportion,
			verbose: true
		});
		
		response.send(result);
		
	});
	
	
}

GeoData.prototype.ogrSimplify = function(request, response) {
	var me = this;
	
	var tolerance = request.param('tolerance');
	
	if(typeof tolerance === 'undefined') {
		response.send(500, {success: false, message: 'Simplification tolerance is not provided'});
		return;
	}
		
	var ogr = ogr2ogr(me.geojsonFile)
				.format('GeoJSON')
				.options(['-simplify', tolerance])
				.skipfailures();
	
	ogr.exec(function(err, data) {
		if(err) {
			console.log(err);
			return;
		}
		
		fs.writeFileSync(me.geojsonFile, JSON.stringify(data));
		
		var topology = topojson.topology({collection: data}, {verbose:true});
		
		response.send(topology);
		
	});
	
}

GeoData.prototype.reset = function(request, response) {
		var me = this;

		this.loadData(request, response);
}

GeoData.prototype.getAttributes = function(request, response) {
	var me = this;

	var knex = require('knex').knex;
	
	knex('information_schema.columns').where('table_name', request.param('tableName'))
									 .select('column_name')
									 .then(function(rs) {
										var columns = [];
										for(var i = 0; i < rs.length; i++) {
											columns.push(rs[i].column_name);
										}
										response.send({data: columns, sucess: true, message: 'Attributes are succesfully read'});
									 }, function(knexerr) {
										response.send(500, {data:[], success: false, message: 'Error reading tables'});
										console.log(knexerr);
									 });
}

GeoData.prototype.download = function(request, response) {

	var tableName = request.param('tableName')
		, attribs = request.param('attributes');
	
	
	if(!tableName) {
		response.send(500, {success: false, message: 'Table name is not provided'});
	}
	
	if(!attribs) {
		response.send(500, {success: false, message: 'Attributes are not provided'});
	}
	
	var attributes = attribs.split(',');
	
	var result = topojson.topology(this.content, {
		"property-transform": function(feature) {
			var a, transformedFeature;
			for(var i = 0; i < attributes.length; i++) {
				a = attributes[i];
				transformedFeature[a] = feature[a];
			}
			return transformedFeature;
		}
	});
	
	var filename = './public/topojson/' + tableName + '.json';
	
	fs.writeFile(filename, JSON.stringify(result), function(err) {
		if (err) response.send(500, {success: false, message: 'Attributes are not provided'});
		response.send(200);
	});
}

module.exports = GeoData;