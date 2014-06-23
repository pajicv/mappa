<!doctype html>
<html lang="en" ng-app='geoTopo'>
<head>
  <meta charset="utf-8">
  <title>GeoTopo</title>
  <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.css">
  <link rel="stylesheet" href="css/app.css">
  <script src="bower_components/angular/angular.js"></script>
</head>
<body ng-controller="TableCtrl">

  <ul>
    <li ng-repeat="ds in datasets">
      {{ds.name}}
    </li>
  </ul>

</body>
</html>