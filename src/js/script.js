/* Author:
Henrik Horstia
Rami Alatalo
Kristoffer Snabb
*/

var NoppaCRA = {

	/* Global variables for NoppaCRA namespace. */
	jQuery			: $,
	baseURL			: '',
	debug			: true,
	NoppaCRA		: this,

	/* Global functions of NoppaCRA. */

	error : function(message) {
		console.log(message);
	},

	init : function() {

		NoppaCRA = this,
		$ = jQuery;

		$(document).ready(function() {
			NoppaCRA.setBaseURL();
			if (NoppaCRA.debug) {
				console.log('NoppaCRA JS loaded.');
				NoppaCRA.testHttpAPI();
				NoppaCRA.testGlobal();
			}
		});

	},

	/* Set and get the base URL. */
	setBaseURL : function() {

		NoppaCRA.baseURL = '';

		var href = window.location.href;
		var hrefsplit = href.split('//')[1].split('/')[0];
		NoppaCRA.baseURL = 'http://' + hrefsplit + '/';
		
		return NoppaCRA.baseURL;

	},

	/* Test the HTTP API of the service. */
	testHttpAPI : function() {

		$.post("api/", { method: "getCourseRating", id: 0 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' with id ' + data.id + ' returns ' + data.value + '.');
			}, "json"
		);

	},

	/* Global test function of the service. */
	testGlobal : function() {

		$("input[name='star']").rating();

	}

}

NoppaCRA.init();
