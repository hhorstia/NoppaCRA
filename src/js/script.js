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

	},
	
	getRecommendations : function(options) {

		$.post("api/", { method: "getCourseRecommendations", sort: 'name', limit: 10, offset: 0 },
			function(data) {
				if (data.valid) {
					$.each(data.value, function() {
						var courseItem = $('.course-item.prototype').clone();
						courseItem.removeClass('prototype').find('.course-name').html(this.nimi);
						courseItem.find('.course-code').html(this.koodi);
						courseItem.find('.course-period').html(this.periodi);
						courseItem.find('.course-description').html(this.sisalto);
						//courseItem.find('.stars').children('input').rating('select', 1);
						$('.course-item.prototype').after(courseItem);
						// Unused details: this.id, this.laajuus, this.aktiivinen, this.arvio.
					});
				}
			}, "json"
		);

	},
	
	initRecommendationView : function() {

		$('.course-item').live('click touchstart', function() {
			$('.course-item').removeClass('selected');
			$(this).addClass('selected');
		});

	}

}

NoppaCRA.init();
