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
			NoppaCRA.getRecommendations();
			NoppaCRA.getOwnCourses();
			NoppaCRA.initView();
			NoppaCRA.bindHashChange();
			
			$('.nav-tabs').tab();
			$('.nav-tabs a').on('show', NoppaCRA.show_tab);
		});

	},
	
	/* event handler for when a tab is shown*/
	show_tab: function(evt) {
		$('' + evt.currentTarget.hash).show();
		$('' + evt.relatedTarget.hash).hide();
		
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

		$.post("api/", { method: "getCourse", id: 1 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' with id ' + data.id + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getCourses", sort: 'name', limit: 10, offset: 0 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getUserCourses", active: 1 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' with active status ' + data.active + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getCourseRecommendations", sort: 'name', limit: 10, offset: 0 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getCourseReviews", id: 2 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' with id ' + data.id + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getUserCourseReview", id: 2 },
			function(data) {
				console.log('Testing HTTP API: method ' + data.method + ' with id ' + data.id + ' returns ' + data.value + '.');
			}, "json"
		);
		
		$.post("api/", { method: "getCourseRating", id: 2 },
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
						$('#recommendations').append(courseItem);
						// Unused details: this.id, this.laajuus, this.aktiivinen, this.arvio.
					});
				}
			}, "json"
		);

	},
	
	getOwnCourses : function(options) {
	
		$.post("api/", { method: "getUserCourses", active: 1 },
			function(data) {
				if (data.valid) {
					$.each(data.value, function() {
						var courseItem = $('.course-item.prototype').clone();
						courseItem.removeClass('prototype').find('.course-name').html(this.nimi);
						courseItem.find('.course-code').html(this.koodi);
						courseItem.find('.course-period').html(this.periodi);
						courseItem.find('.course-description').html(this.sisalto);
						//courseItem.find('.stars').children('input').rating('select', 1);
						$('#own_courses').append(courseItem);
						// Unused details: this.id, this.laajuus, this.aktiivinen, this.arvio.
					});
				}
			}, "json"
		);
	
	},
	
	initView : function() {
		
		var hash = $(window)[0].location.hash;
		if(hash === '#recommendations') {
			$('.nav-tabs a[href=#recommendations]').tab('show');
			$('.course-item').live('click touchstart', function() {
				$('.course-item').removeClass('selected');
				$(this).addClass('selected');
			});	
		} else if(hash === '#own_courses') {
			$( '.nav-tabs a[href=#own_courses]' ).tab('show');
			//the tab show does not fire an event for some reason
			$( '#own_courses' ).show();
			$( '#recommendations' ).hide();
		}

	},
	
	bindHashChange : function() {
		
		$(window).bind('hashchange', function(event) {

			if (location.hash == '#own_courses') {
				NoppaCRA.debug ? console.log('Own courses selected.') : '';
				$('.nav-tabs a[href=#own_courses]').tab('show');
			} else if (location.hash == '#recommendations') {
				NoppaCRA.debug ? console.log('Recommendations selected.') : '';
				$('.nav-tabs a[href=#recommendations]').tab('show');
			}

		});
	
	}

}

NoppaCRA.init();
