var geotopoApp = angular.module('geotopoApp', ['ui.slider', 'ui.bootstrap']);

geotopoApp.factory('gtSharedService', function($rootScope) {

	var sharedService = {};
	
	sharedService.tableName = '';
	
	sharedService.topology = {};
	
	sharedService.topojson = {
		minArea: {
			min: 0,
			max: 100
		},
		retainProportion: {
			min: 0,
			max: 100
		}
	};
	
	sharedService.ogr = {
		tolerance: {
			min: 0,
			max: 100
		}
	};
	
    sharedService.setTableName = function(tableName) {
        this.tableName = tableName;
        this.broadcastItem('tableSelected');
    };
	
	sharedService.setTopology = function(topology) {
        this.topology = topology;
        this.broadcastItem('topologySet');
    };
	
	sharedService.setMaMin = function(maRealMin) {
		this.topojson.minArea.min = parseFloat(maRealMin);
		this.broadcastItem('minAreaMinSet');
	};

	sharedService.setMaMax = function(maRealMax) {
		this.topojson.minArea.max = parseFloat(maRealMax);
		this.broadcastItem('minAreaMaxSet');
	};

	sharedService.setRtMin = function(rtRealMin) {
		this.topojson.retainProportion.min = parseFloat(rtRealMin);
		this.broadcastItem('retainPropMinSet');
	};

	sharedService.setRtMax = function(rtRealMax) {
		this.topojson.retainProportion.max = parseFloat(rtRealMax);
		this.broadcastItem('retainPropMaxSet');
	};
	
	sharedService.setTolMin = function(tolRealMin) {
		this.ogr.tolerance.min = parseFloat(tolRealMin);
		this.broadcastItem('toleranceMinSet');
	};

	sharedService.setTolMax = function(tolRealMax) {
		this.ogr.tolerance.max = parseFloat(tolRealMax);
		this.broadcastItem('toleranceMaxSet');
	};
	
	sharedService.broadcastItem = function(e) {
        $rootScope.$broadcast(e);
    };

    return sharedService;

}); 

geotopoApp.controller('TablesCtrl', function ($scope, $http, gtSharedService) {

	$http.get('./tables').success(function(res) {
		$scope.datasets = res.data;
	});
	
	$scope.onSelect = function(tableName) {
		gtSharedService.setTableName(tableName);
	}

});

geotopoApp.controller('MapCtrl', function ($scope, $http, gtSharedService) {

	$scope.canvasWidth = 1080;
	$scope.canvasHeight = 522;
	
	$scope.currentTransform = {
		translate: [0, 0],
		scale: 1
	};
	
	$scope.svg = d3.select("#map")
			.append('svg')
			.attr("width", $scope.canvasWidth)
			.attr("height", $scope.canvasHeight);
	
	$scope.draw = function (tj) {
	
		d3.select('#polygon').remove();
		
		$scope.g = $scope.svg.append("g").attr("id", "polygon");;
		
		var zoom = d3.behavior.zoom()
			.translate($scope.currentTransform.translate)
			.scale($scope.currentTransform.scale);
		
		zoom.on("zoom",function() {
			$scope.currentTransform.translate = d3.event.translate;
			$scope.currentTransform.scale = d3.event.scale;
			$scope.g.attr("transform","translate("+d3.event.translate.join(",")+")scale("+d3.event.scale+")")
		  });

		$scope.svg.call(zoom);
		
		var features;
		if(tj.objects.collection) {
			features = tj.objects.collection;
		} else {
			features = tj.objects.layer1;
		}
	
		$scope.g.selectAll("path")
			.data(topojson.feature(tj, features).features)
			.enter()
			.append("path")
			.attr("d", $scope.path);
			
		$scope.g.attr("transform","translate("+$scope.currentTransform.translate.join(",")+")scale("+$scope.currentTransform.scale+")")

	};
	
	$scope.loadData = function(tableName, attributes) {

		$scope.currentTransform.translate = [0, 0];
		$scope.currentTransform.scale = 1;
				
		$http.post('./loaddata', {tableName: tableName, attributes: attributes}).success(function(topology) {
						
			var bounds = topology.bbox;
			var centerX = bounds[0] + (bounds[2] - bounds[0]) / 2;
			var centerY = bounds[1] + (bounds[3] - bounds[1]) / 2;
			var width = bounds[2] - bounds[0];
			var height = bounds[3] - bounds[1];
			var scale;
			if(width < height) {
				scale = ($scope.canvasWidth / width) * (180 / (Math.PI * 2));
			} else {
				scale = ($scope.canvasHeight / height) * (180 / (Math.PI * 2));
			}
	
			var offset = [$scope.canvasWidth / 2, $scope.canvasHeight / 2];
			var projection = d3.geo.mercator().scale(scale).center([centerX, centerY])
			  .translate(offset);

			// create the path
			$scope.path = d3.geo.path().projection(projection);
			
			/*var geojson = topojson.feature(topology, topology.objects.collection);
			
			var x = d3.scale.linear()
				.range([0, $scope.canvasWidth]);
			 
			var y = d3.scale.linear()
				.range([0, $scope.canvasHeight]);
			 
			var projection = d3.geo.transform({
				point: function(px, py) { this.stream.point(x(px), y(py)); }
			});
			
			$scope.path = d3.geo.path().projection(projection);
			
			x.domain([bounds[0], bounds[2]]);
			y.domain([bounds[1], bounds[3]]);
				
			$scope.g = $scope.svg.append("g").attr("id", "polygon");;
			
			$scope.g.selectAll("path")
			.data(geojson.features)
			.enter()
			.append("path")
			.attr("d", $scope.path);*/
		
			$scope.draw(topology);
				
		});
			
			
	};
		
	$scope.$on('tableSelected', function() {
		$scope.loadData(gtSharedService.tableName, 'name');
	});
	
	$scope.$on('topologySet', function() {
		$scope.draw(gtSharedService.topology);
	});
	
});


geotopoApp.controller('MapShaperCtrl', function($scope, $http, $log, gtSharedService) {

	$scope.isCollapsed = true;
	
	$scope.algorithm = "mod2";
	$scope.simplPct = 0;
	$scope.hiddenOptions = true;
	$scope.repair = true;
	$scope.autosnap = true;
	$scope.preventRemoval = false;
	$scope.coordPrecision = 0;
	
	$scope.slider = {
		value: 90,
		oppositeValue: 10, 
		'options': {
			stop: function (event, ui) {
				$scope.slider.oppositeValue = 100 - $scope.slider.value;
				msOptions = {
					simplPct: $scope.slider.oppositeValue / 100,
					algorithm: $scope.algorithm,
					repair: $scope.repair,
					autosnap: $scope.autosnap,
					preventRemoval: $scope.preventRemoval,
					coordPrecision: parseFloat($scope.coordPrecision)
				};
				$http.post('./mssimplify', msOptions).success(function(res) {
					gtSharedService.setTopology(res);
				});
			}
		}
	};

});

geotopoApp.controller('AttributesCtrl', function ($scope, $http, gtSharedService) {

	$scope.selection = {
		attrs:{}
	}; 
	
	$scope.loadData = function(tableName) {
		$http.post('./attributes', {tableName: tableName}).success(function(res) {
			$scope.attributes = res.data;
		});
	};
	
	$scope.$on('tableSelected', function() {
		$scope.loadData(gtSharedService.tableName);
	});

});

geotopoApp.controller('TJSimplifyCtrl', function ($scope, $http, gtSharedService) {

	$scope.minArea = 0;
	$scope.retainProportion = 0;
	
	$scope.maSlider = {
		value: 0, 
		min: 0,
		max: 100,
		realMin: 0,
		realMax: 100,
		realValue: 0,
		'options': {
			stop: function (event, ui) { 
				$scope.maSlider.realValue = gtSharedService.topojson.minArea.min 
					+ ($scope.maSlider.value / 100) 
					* (gtSharedService.topojson.minArea.max  - gtSharedService.topojson.minArea.min );
				$http.post('./tjsimplify', {minArea: $scope.maSlider.realValue, 
					retainProportion: $scope.rtSlider.realValue})
					.success(function(res) {
						
						gtSharedService.setTopology(res);
					}
				);
			}
		}
	}
	
	$scope.rtSlider = {
		value: 0,
		min: 0,
		max: 100,
		realMin: 0,
		realMax: 100,
		realValue: 0,
		'options': {
			stop: function (event, ui) { 
				$scope.rtSlider.realValue = gtSharedService.topojson.retainProportion.min 
					+ ($scope.rtSlider.value / 100) 
					* (gtSharedService.topojson.retainProportion.max  - gtSharedService.topojson.retainProportion.min );
				$http.post('./tjsimplify', {minArea: $scope.maSlider.realValue, 
					retainProportion: $scope.rtSlider.realValue})
					.success(function(res) {
						gtSharedService.setTopology(res);
					}
				);
			}
		}
	}
	
	$scope.$on('minAreaMinSet', function() {
		$scope.maSlider.realValue = gtSharedService.topojson.minArea.min
			+ ($scope.maSlider.value / 100) 
			* (gtSharedService.topojson.minArea.max  - gtSharedService.topojson.minArea.min );
	});
	
	$scope.$on('minAreaMaxSet', function() {
		$scope.maSlider.realValue = gtSharedService.topojson.minArea.min
			+ ($scope.maSlider.value / 100) 
			* (gtSharedService.topojson.minArea.max  - gtSharedService.topojson.minArea.min );
	});
	
	$scope.$on('retainPropMinSet', function() {
		$scope.rtSlider.realValue = gtSharedService.topojson.retainProportion.min 
			+ ($scope.rtSlider.value / 100) 
			* (gtSharedService.topojson.retainProportion.max  - gtSharedService.topojson.retainProportion.min );
	});
	
	$scope.$on('retainPropMaxSet', function() {
		$scope.rtSlider.realValue = gtSharedService.topojson.retainProportion.min 
			+ ($scope.rtSlider.value / 100) 
			* (gtSharedService.topojson.retainProportion.max  - gtSharedService.topojson.retainProportion.min );
	});
});

geotopoApp.controller('OGRSimplifyCtrl', function ($scope, $http, gtSharedService) {

	$scope.tolerance = 0;
	$scope.tolSlider = {
		value: 0,
		min: 0,
		max: 100,
		realValue: 0,
		realMin: 0,
		realMax: 100,
		'options': {
			stop: function (event, ui) { 
				$scope.tolSlider.realValue = gtSharedService.ogr.tolerance.min 
					+ ($scope.tolSlider.value / 100) 
					* (gtSharedService.ogr.tolerance.max  - gtSharedService.ogr.tolerance.min );
				$http.post('./ogrsimplify', {tolerance: $scope.tolSlider.realValue})
					.success(function(res) {
						gtSharedService.setTopology(res);
					}
				);
			}
		}
	}
	
	$scope.$on('toleranceMinSet', function() {
		$scope.tolSlider.realValue = gtSharedService.ogr.tolerance.min 
			+ ($scope.tolSlider.value / 100) 
			* (gtSharedService.ogr.tolerance.max  - gtSharedService.ogr.tolerance.min );
	});
	
	$scope.$on('toleranceMaxSet', function() {
		$scope.tolSlider.realValue = gtSharedService.ogr.tolerance.min 
			+ ($scope.tolSlider.value / 100) 
			* (gtSharedService.ogr.tolerance.max  - gtSharedService.ogr.tolerance.min );
	});
	
});

geotopoApp.controller('TJMinMaxCtrl', function ($scope, $http, gtSharedService) {

	$scope.maSlider = {
		realMin: 0,
		realMax: 100
	};
	
	$scope.rtSlider = {
		realMin: 0,
		realMax: 100
	};
	
	$scope.tolSlider = {
		realMin: 0,
		realMax: 100
	};
	
	$scope.setMaMin = function() {
		gtSharedService.setMaMin($scope.maSlider.realMin);
	};

	$scope.setMaMax = function() {
		gtSharedService.setMaMax($scope.maSlider.realMax);
	};
	
	$scope.setRtMin = function() {
		gtSharedService.setRtMin($scope.rtSlider.realMin);
	};
	
	$scope.setRtMax = function() {
		gtSharedService.setRtMax($scope.rtSlider.realMax);
	};
	
	$scope.setTolMin = function() {
		gtSharedService.setTolMin($scope.tolSlider.realMin);
	};
	
	$scope.setTolMax = function() {
		gtSharedService.setTolMax($scope.tolSlider.realMax);
	};
});