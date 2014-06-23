var geotopoApp = angular.module('geotopoApp', []);

geotopoApp.controller('MapCtrl', function ($scope, $http) {

	$scope.draw = function (tj) {
	
		d3.select('#polygon').remove();
		
		$scope.svg.append("path")
		  .datum(topojson.feature(tj, tj.objects.layer1))
		  .attr("d", me.path)
		  .attr("id", "polygon");
	
	},
	
	$scope.loadData = function() {

		$http.post('./topojson').success(function(res) {
			
			$scope.canvasWidth = 1080;
			$scope.canvasHeight = 522;
			
			var projection = d3.geo.mercator()
				.scale((canvasHeight + 1) / 2 / Math.PI)
				.translate([canvasWidth / 2, canvasHeight / 2]);

			$scope.path = d3.geo.path()
				.projection(projection);
				
			$scope.svg = d3.select("map")
				.append('svg')
				.attr("width", canvasWidth)
				.attr("height", canvasHeight);
				
			console.log(res);
				
			$scope.draw(res);
				
		});
			
			
	}
		
		

});

	