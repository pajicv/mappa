var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.sendfile('index.html');
});

router.get('/tables', function(req, res) {
	var gd = req.gd;
	gd.getTables(req, res);
});

router.get('/reset', function(req, res) {
	var gd = req.gd;
	gd.reset(req, res);
});

router.post('/loaddata', function(req, res) {
	var gd = req.gd;
	gd.loadData(req, res);
});

router.post('/mssimplify', function(req, res) {
	var gd = req.gd;
	gd.msSimplify(req, res);
});

router.post('/tjsimplify', function(req, res) {
	var gd = req.gd;
	gd.tjSimplify(req, res);
});

router.post('/ogrsimplify', function(req, res) {
	var gd = req.gd;
	gd.ogrSimplify(req, res);
});

router.post('/attributes', function(req, res) {
	var gd = req.gd;
	gd.getAttributes(req, res);
});

router.post('/download', function(req, res) {
	var gd = req.gd;
	gd.download(req, res);
});

module.exports = router;
