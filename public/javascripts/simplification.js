var msParams = new can.Map({
	algorithm: "mod2", // possible values mod2, dp, vis
	simplPct: 0, // possible values 0 to 100
	hiddenOptions: true,
	repair: true,
	autosnap: true,
	preventRemoval: false,
	coordPrecission: 0.0
});

var msTemplate = can.view.mustache( "<b>MapShaper</b><br>" +
			" Level of Detail (%): " +
			"<form action=''>" +
				"<input type='radio' can-value='algorithm' value='mod2' />Modified Visvalingam<br>" +
				"<input type='radio' can-value='algorithm' value='dp' />Visvalingam<br>" +
				"<input type='radio' can-value='algorithm' value='vis' />Douglas-Peucker<br>" +
			"</form>" + 
			"<form action=''>" +
				"<input type='checkbox' can-value='repair' />Repair intersections<br>" +
				"<input type='checkbox' can-value='autosnap' />Automatic snapping<br>" +
				"<input type='checkbox' can-value='preventRemoval' />Prevent shape removal<br>" +
				"<input type='text' can-value='coordPrecision' />" +
			"</form>" );

var tjParams = new can.Map({
	minArea: {
		currValue: 0,
		minTreshold: 0,
		maxTreshold: 100
	},
	retainPct: {
		currValue: 0,
		minTreshold: 0,
		maxTreshold: 100
	}
});

var ogrParams = new can.Map({
	simplDist: {
		currValue: 0,
		minTreshold: 0,
		maxTreshold: 100
	}
});

