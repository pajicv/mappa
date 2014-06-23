var geotopoApp = angular.module('geotopoApp', ['ui.slider', 'ui.bootstrap']);

geotopoApp.factory('gtSharedService', function($rootScope) {

	var sharedService = {};
	
	sharedService.tableName = '';
	
	sharedService.sliderVal = 0;
	
	sharedService.minArea = 0;
	
	sharedService.retainProportion = 0;
	
	sharedService.tolerance = 0;

    sharedService.setTableName = function(tableName) {
        this.tableName = tableName;
        this.broadcastItem('tableSelected');
    };
	
	sharedService.setSliderVal = function(val) {
        this.sliderVal = val;
        this.broadcastItem('sliderValueChanged');
    };
	
	sharedService.tjSimplify = function(minArea, retainProportion) {
		this.minArea = minArea;
		this.retainProportion = retainProportion;
		this.broadcastItem('tjSimplified');
	};
	
	sharedService.ogrSimplify = function(tolerance) {
		this.tolerance = tolerance;
		this.broadcastItem('ogrSimplified');
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
				
		$http.post('./topojson', {tableName: tableName, attributes: attributes}).success(function(topology) {
						
			var bounds = topology.bbox;
			/*var centerX = bounds[0] + (bounds[2] - bounds[0]) / 2;
			var centerY = bounds[1] + (bounds[3] - bounds[1]) / 2;
			var width = bounds[2] - bounds[0];
			var height = bounds[3] - bounds[1];
			var scale;
			if(width < height) {
				scale = ($scope.canvasWidth / width) * (180 / (Math.PI * 2));
			} else {
				scale = ($scope.canvasHeight / height) * (180 / (Math.PI * 2));
			}
	
			var offset = [$scope.canvasWidth / 2, $scope.canvasHeight / 2];*/
			/*var projection = d3.geo.mercator().scale(scale).center([centerX, centerY])
			  .translate(offset);*/

			// create the path
			//$scope.path = d3.geo.path().projection(projection);
			
			var geojson = topojson.feature(topology, topology.objects.collection);
			
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
			.attr("d", $scope.path);
		
			//$scope.draw(topology);
				
		});
			
			
	};
	
	$scope.simplify = function(simplPct) {
	
		$http.post('./mssimplify', {simplPct: simplPct}).success(function(res) {
			$scope.draw(res);
		});
		
	};
	
	$scope.$on('tableSelected', function() {
		$scope.loadData(gtSharedService.tableName, 'name');
	});
	
	$scope.$on('sliderValueChanged', function() {
		$scope.simplify((100 - gtSharedService.sliderVal) / 100);
	});
	
	$scope.$on('tjSimplified', function() {
		
		$http.post('./tjsimplify', {minArea: gtSharedService.minArea, retainProportion: gtSharedService.retainProportion})
			.success(function(res) {
				$scope.draw(res);
			}
		);
	});
	
	$scope.$on('ogrSimplified', function() {
		
		$http.post('./ogrsimplify', {tolerance: gtSharedService.tolerance})
			.success(function(res) {
				$scope.draw(res);
			}
		);
	});
	
});


geotopoApp.controller('MapShaperCtrl', function($scope, $log, gtSharedService) {

	$scope.isCollapsed = true;
	
	$scope.algorithm = "mod2";
	$scope.simplPct = 0;
	$scope.hiddenOptions = true;
	$scope.repair = true;
	$scope.autosnap = true;
	$scope.preventRemoval = false;
	$scope.coordPrecission = 0.0;
	
	$scope.slider = {
		value: 90,
		los: 10, 
		'options': {
			start: function (event, ui) {  
			},
			stop: function (event, ui) { 
				$log.info($scope.slider.value); 
				$scope.slider.los = 100 - $scope.slider.value;
				gtSharedService.setSliderVal($scope.slider.value);
			}
		}
	}


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

geotopoApp.controller('DownloadCtrl', function ($scope, $http, gtSharedService) {

	$scope.onClick = function(tableName) {
		$http.post('./download', {tableName: gtSharedService.tableName, attributes: 'name, countries'}).success(function(res) {
			window.location.href = './topojson/' + gtSharedService.tableName + '.json'
		});
	}

});

geotopoApp.controller('TJSimplifyCtrl', function ($scope, $http, gtSharedService) {

	$scope.minArea = 0;
	$scope.retainProportion = 0;
	$scope.onClick = function() {
		gtSharedService.tjSimplify($scope.minArea, $scope.retainProportion);
	};

});

geotopoApp.controller('OGRSimplifyCtrl', function ($scope, $http, gtSharedService) {

	$scope.tolerance = 0;
	$scope.onClick = function() {
		gtSharedService.ogrSimplify($scope.tolerance);
	};

});

geotopoApp.controller('AccordionCtrl', function ($scope, $http, gtSharedService) {
	
	$scope.oneAtATime = true;
	
  $scope.status = {
    isFirstOpen: true,
    isFirstDisabled: false
  };

});
