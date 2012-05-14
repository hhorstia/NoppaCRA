/* General JS String extensions. */

String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function(suffix) {
	return this.match(suffix+"$") == suffix;
}


/* The NoppaCRA namespace which wraps everything. */

var NoppaCRA = {

	debug : false,			// Mainly enables console logging.

	fresh	: true,			// Used to change the hash to #home on fresh
							// page reload, detects also inconsistent hash.
							// -- In that case reloads the site.
	
	
	ready	: false,		// Is the NoppaCRA.init() function executed.
	loading : false,		// Whether a hash (view) change is taking place.
	
	
	courseTimer : null,		// Course tab timer for the blur
							// of previously visited course.
	
	courseTimerPure : null,	// Search tab timer for the blur
							// of previously visited course.
	
	
	searchRefresh : true,	// Course tab view is refreshed when visited.
	filterRefresh : true,	// Filter and sort tab is refreshed when visited.
	
	searchLastScrollTop : 0, // The previous scroll locations of courses and
	searchLastScrollTopPure : 0, // search tabs respectively.
	
	
	loginButton : false,	// Authentication form was sent with login button.
	registerButton : false,	// -- with register button.
	
	authenticated : false,	// Soft check whether the user is logged in.
	
	fromPure : true,		// Did the user access the course details from
							// the search view (rather than courses view).
	pureXHR : null,			// Search view ajax call XHR store.
	
	
	/* The init function which is called from the document ready function. */
	
	init : function() {
	
		/* Reset the hash of the page. */
		window.location.hash = '';
		
		
		/* Bind the navigation buttons (view changers). */
		
		$('#header a, #navbar a').live('click', function(event) {
		
			/* Set the active class for the button. */
			$(this).addClass('ui-btn-active');
			
			/* React only if the hash is really changing. */
			if (window.location.hash != this.hash) {
			
				/* Set the loading state boolean, show the loading icon. */
				NoppaCRA.loading = true;
				$('.ui-loader').show();
				
				/* Hash holder, this variable changes in each function. */
				var hash = this.hash;
				
				/* Go through the navigation buttons and remove the active
				   classes if necessary. This is quite futile, but needed
				   to avoid some jQuery Mobile bugs. */
				$('#header a, #navbar a').each(function() {
					if (hash != $(this).attr('href')) {
						$(this).removeClass('ui-btn-active');
					}
				});
				
				/* Set the new hash when a link with new hash is clicked. */
				window.location.hash = this.hash;
			}
			/* Make sure the active class is set. */
			$(this).addClass('ui-btn-active');
		});
		
		
		/* Get the sorting method if stored into the local storage. */
		var previous = localStorage.getItem('sort');
		
		/* Detect a null value (sort method not set). */
		if (!previous || previous == 'null' || typeof(previous) == 'null') {
			previous = '';
		}
		
		/* Set the sort method to the appropriate user interface element. */
		if (previous != '') {
			$('#sort').val(previous);
		}
		
		
		/* Important hash change binding. Reacts to the view change requests. */
		
		$(window).bind('hashchange', function(event) {
		
			/* Store the new hash. */
			var hash = window.location.hash;
			
			/* Print the called view name. */
			NoppaCRA.debug ? console.log(hash + ' view called') : '';
			
			/* Some internal variables for the hash change function. */
			var searchRefresh = false;
			var filterRefresh = false;
			var coursePage = false;
			var reviewPage = false;
			
			/* Hide all the views (content divs with page class). */
			$('.page').hide();
			
			/* Following lines reset manually the appearance of home button
			   which is transformed into back button on course detail view.
			   -- TODO: detect if the button is transformed back button. */
			
			$('#header .home').data('icon', 'home')
							  .data('iconpos', 'notext').data('mini', '');
			$('#header .home').removeClass('ui-mini')
							  .addClass('ui-btn-icon-notext')
							  .removeClass('ui-btn-icon-left');
			
			$('#header .home').children('span').children('.ui-btn-text')
							  .html('Home');
			$('#header .home').children('span').children('.ui-icon')
							  .addClass('ui-icon-home')
							  .removeClass('ui-icon-arrow-l');
			
			$('#header .home').attr('href', '#home');
			$('#header .home').trigger('create');
			
			/* Pre-handle the new hash and take actions accordingly. */
			if (hash.startsWith('#course')) {
			
				/* Hash contains the course information, so load the course. */
				coursePage = true;
				NoppaCRA.loadCourse();
				$('#course').show();
			
			} else if (hash == '#reviews') {
			
				/* Reviews view needs not to match the else option here. */
			
			} else if (hash != '') {
			
				/* Normally show the content div matching the hash. */
				$(hash).show();
			
			} else {
			
				/* React to hash inconsistency by reloading the site. */
				if (!NoppaCRA.fresh) {
					location.reload(true);
				} else {
					/* On initial page load set the hash to #home. */
					NoppaCRA.fresh = false;
					window.location.hash = '#home';
				}
			}
			
			/* Yet some neurotic active class removal from navigation links. */
			$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
				if (hash != $(this).attr('href')) {
					$(this).removeClass('ui-btn-active');
				}
			});
			
			/* The backbone of the hash change function. */
			
			switch(hash) {
			
				/* Home view called. */
				
				case '#home':
					$('.home').addClass('ui-btn-active');
					break;
				
				/* Login view called. */
				
				case '#login':
					$('.login').addClass('ui-btn-active');
					
					$('#logged-in-user').html('');
					$('.login').attr('href', '#login');
					$('.login').children('span').children('.ui-btn-text')
							   .text('Login');
					break;
				
				/* Courses view called. */
				
				case '#search':
					$('.search').addClass('ui-btn-active');
					
					/* Set the timeout for previously selected course blur. */
					NoppaCRA.courseTimer = setTimeout(function() {
						$('#search ul li').removeClass('ui-btn-active');
					}, 1000);
					
					/* Call the refresh function for the courses view. */
					if (NoppaCRA.searchRefresh) {
						NoppaCRA.refreshSearch(NoppaCRA.filterRefresh);
						NoppaCRA.searchRefresh = false;
						searchRefresh = true;
					} else { /* Otherwise set the previous scroll position. */
						$('body').scrollTop(NoppaCRA.searchLastScrollTop);
					}
					
					/* Call the refresh function for the filter and sort view. */
					if (NoppaCRA.filterRefresh) {
						NoppaCRA.refreshFilters(true);
						NoppaCRA.filterRefresh = false;
						searchRefresh = true;
					}
					
					/* Set the blacklisted courses (hide their CSS classes). */
					NoppaCRA.blacklist();
					break;
				
				/* Search view called. */
				
				case '#pure-search':
					$('.pure-search').addClass('ui-btn-active');
					
					/* Set the timeout for previously selected course blur. */
					NoppaCRA.courseTimerPure = setTimeout(function() {
						$('#pure-search ul li').removeClass('ui-btn-active');
					}, 1000);
					
					/* Set the previous scroll position. */
					$('body').scrollTop(NoppaCRA.searchLastScrollTopPure);
					
					/* Set the blacklisted courses (hide their CSS classes). */
					NoppaCRA.blacklist();
					break;
				
				/* Filter and sort view called. */
				case '#filter':
					$('.filter').addClass('ui-btn-active');
					
					/* Delayed variable affects the loading icon hiding time. */
					var delayedBlacklist = false;
					if (NoppaCRA.filterRefresh) {
						filterRefresh = true;
						NoppaCRA.refreshFilters(); // Refresh the content.
						NoppaCRA.filterRefresh = false;
						delayedBlacklist = true;
					}
					
					/* Refresh the content of the actual blacklist in the UI. */
					NoppaCRA.refreshBlacklist(delayedBlacklist);
					break;
				
				/* Reviews view called. */
				case '#reviews':
					$('.login').addClass('ui-btn-active');
					
					reviewPage = true;
					NoppaCRA.refreshReviews(); // Get the reviews page content.
					break;
				
				/* Otherwise set just the fresh boolean to false. */
				default:
					NoppaCRA.fresh = false;
					break;
			}
			
			/* If no acute loading required, hide the loading icon. */
			if (!searchRefresh && !coursePage && !filterRefresh && !reviewPage) {
				$('.ui-loader').hide();
			}
			NoppaCRA.loading = false;
		
		});
		
		/* Bind rest of the events. */
		NoppaCRA.initEvents();
		NoppaCRA.ready = true;
	
	},
	
	
	/* The function used to refresh the concrete blacklisting in the bottom of
	   filter and sort view, where the user can remove courses from the list. */
	
	refreshBlacklist : function(delayedBlacklist) {
	
		/* Clear the blacklist in the view. */
		$('#blacklist').html('');
		$('#blacklist').trigger('create').listview('refresh');
		
		/* Get the previously blacklisted courses from the local storage. */
		var blacklist = localStorage.getItem('blacklist');
		if (!blacklist || blacklist == 'null' || typeof(blacklist) == 'null') {
			blacklist = '';
		}
		blacklist = blacklist.split(',');
		
		if (delayedBlacklist) {
			$('#blacklist').hide();
		}
		
		/* Create the list markup and append it to the view. */
		$.each(blacklist, function() {
			var code = this;
			if (code != '') {
				$('#blacklist').append(
						'<div data-role="collapsible" class="blacklist-item">' +
							'<h3 class="blacklist-item-title"><span class="course"><strong>Course code: </strong>' + code + '</span></h3>' +
							'<p class="blacklist-item-value">' + '<button class="show-button" type="submit" name="submit" data-theme="f" data-code="' + code + '">Unblacklist</button>' + '</p>' +
						'</div>');
			}
		});
		$('#blacklist').trigger('create').listview('refresh');
		
		/* Determine whether the blacklist needs to be shown. */
		if (blacklist.length > 1 && !delayedBlacklist) {
			$('#blacklist-heading').show();
		} else {
			$('#blacklist-heading').hide();
		}
	
	},
	
	
	/* The function used to refresh the list of user made reviews in the
	   reviews view. Only effective when the user is logged in. */
	
	refreshReviews : function() {
	
		$('#reviews').hide();
		
		/* Check whether the user is authenticated. */
		$.post('auth/', { method: 'authenticated' },
			function(data) {
				if (data.value) {
					$('#logged-in-user').html($('#username').val());
					$('.login').attr('href', '#reviews')
					$('.login').children('span').children('.ui-btn-text').text('Reviews');
					$('#reviews p, #reviews form').show();
				}
				$('#reviews').show();
				$('.ui-loader').hide();
			}, "json"
		);
		
		/* Get the reviews made by the user, append to the view. */
		$.post('auth/', { method: 'reviews' },
			function(data) {
				NoppaCRA.debug ? console.log(data) : '';
				if (data.value != 'ERROR') {
					var i = 1;
					$.each($.parseJSON(data.value), function() {
						if (i > 0) {
							$('#reviews-holder').html('');
							i--;
						}
						/* Without the delete button. */
						//$('#reviews-holder').append('<li><span class="course"><strong>Course code: </strong>' + this.fields.course + '</span><br /><span class="grade"><strong>Grade: </strong>' + this.fields.grade + '</span><br /><span><strong>Comment: </strong>' + this.fields.comment + '</span></li>');
						
						/* With the delete button. */
						$('#reviews-holder').append(
							'<div data-role="collapsible" class="course-detail">' +
								'<h3 class="course-detail-title"><span class="course"><strong>Course code: </strong>' + this.fields.course + '</span><br /><span class="grade"><strong>Grade: </strong>' + this.fields.grade + '</span><br /><span><strong>Comment: </strong>' + this.fields.comment + '</span></h3>' +
								'<p class="course-detail-value">' + '<button class="remove-button" type="submit" name="submit" data-theme="f" data-code="' + this.fields.course + '">Delete</button>' + '</p>' +
							'</div>');
					});
					$('#reviews-holder').trigger('create').listview('refresh');
				}
				$('.ui-loader').hide();
			}, "json"
		);
	
	},
	
	
	/* The function used to refresh faculties listing in the filter and
	   sort view. Hierarchical ajax calls are made. */
	
	refreshFilters : function(callback) {
	
		$('#filter .faculties').hide();
		
		/* Get the schools from the backend. */
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/'
		}).done(function(data) {
			NoppaCRA.debug ? console.log(data) : '';
			
			var counter = 0;
			var done = 0;
			
			/* Get the departmens from the backend. */
			$.each(data, function() {
				$('#filter .faculties').append(
					'<div class="' + this.code + '" data-role="fieldcontain">' +
						'<h4 class="name">' + this.name + '</h4>' +
						'<fieldset class="group" data-role="controlgroup"></fieldset>' +
					'</div>');
					
				var scode = this.code;
				
				/* Get the faculties from the backend. */
				jQuery.ajax({
					type: 'GET',
					url: 'noppa/' + this.code + '/?sort_by=name'
				}).done(function(data) {
					NoppaCRA.debug ? console.log(data) : '';
					NoppaCRA.debug ? console.log(scode) : '';
					
					/* Append the faculties, check from the local storage,
					   whether should be checked as selected. */
					$.each(data, function() {
						var identifier = this.code.replace(',', '-').replace('.', '-');
						var faculties = localStorage.getItem('faculties')
						if (faculties && faculties != 'null' && typeof(faculties) != 'null') {
							faculties = faculties.split(',');
							var checked = '';
							for (var i = 0; i < faculties.length; i++) {
								if (this.code == faculties[i]) {
									checked = 'checked="checked" ';
									if (!callback) {
										NoppaCRA.searchRefresh = true;
									}
								}
							}
						}
						$('#filter .faculties .' + scode + ' .group').append(
							'<input type="checkbox" ' + checked + 'name="checkbox-' + identifier + '" id="checkbox-' + identifier + '" class="custom" data-mini="true" data-theme="c" data-school-code="' + scode + '" data-faculty-code="' + this.code + '" />' +
							'<label for="checkbox-' + identifier + '">' + this.name + '</label>');
					});
					
					/* Refresh the sub-lists. */
					$('#filter .faculties .' + scode).trigger('create');
					
					$('#filter .faculties').show();
					if (!callback) {
						$('.ui-loader').hide();
					}
					$('#blacklist-heading, #blacklist').show();
					
					done++;
					
					if (callback && done == counter) {
						NoppaCRA.refreshSearch();
					}
					
				});
				
				counter++;
				
			});
			
		});
	
	},
	
	
	/* The function used to refresh the course list of courses view. The 
	   courses of each faculty are fetched once and for all. The faculties
	   are selected based on the input values in the filter and sort view. */
	
	refreshSearch : function(callback) {
	
		$('.ui-loader').show();
		$('#search ul').html('').listview('refresh');
		$('#search input').val('');
		
		/* Get the checked faculties and load courses for each. */
		$('#filter input:checked').each(function() {
			
			var thisHolder = $(this);
			
			jQuery.ajax({
				type: 'GET',
				url: 'noppa/' + $(this).data('school-code') + '/' + $(this).data('faculty-code') + '/' + '?sort_by=' + $('#sort').val()
			}).done(function(data) {
				NoppaCRA.addResults(data, /*thisHolder.data('school-code')*/'faculty', /*thisHolder.data('faculty-code')*/'department', thisHolder.parent().children('label').children('span').children('.ui-btn-text').html());
				NoppaCRA.blacklist();
				$('.ui-loader').hide();
			});
			
		});
		
		/* No faculties checked, append the info text. */
		if ($('#filter input:checked').length == 0 && !callback) {
			$('#search ul').html('<p class="search-info">Select interesting faculties from the settings page.</p>').listview('refresh');
			$('.ui-loader').hide();
		}
		
	},
	
	
	/* Function for adding a single result for courses view.
	
	   code		-- course code
	   name		-- course name
	   grade	-- grade of the course
	   
	   scode	-- department code
	   fcode	-- faculty code
	   fname	-- faculty name
	   
	*/
	
	addResult : function(code, name, grade, scode, fcode, fname) {
		var identifier = code.replace('.', '-').replace(',', '-');
		$('#search ul').append('<li>' 
								+ '<a href="#course+' + scode + '+' + fcode + '+' + code + '" data-school-code="' + scode + '" data-faculty-code="' + fcode + '" data-faculty-name="' + fname + '">'
									+ '<div class="name">' + name + '</div>' 
									+ '<div class="code">' + code + '</div>'
									+ '<div id="' + identifier + '" class="stars"></div>'
								+ '</a>' +
								'</li>').trigger('create');
		if (grade) {
			$('#' + identifier).raty({
				half: true,
				readOnly: true,
				score: parseInt(grade) * 0.5
			});
		}
		
		$('#search ul').listview('refresh');
	},
	
	
	/* Function for adding multiple results for courses view.
	
	   data		-- JSON containing the course details (name, code and grade)
	   scode	-- department code
	   fcode	-- faculty code
	   fname	-- faculty name (appears in the user interface)
	
	*/
	
	addResults : function(data, scode, fcode, fname) {
		var markup = '';
		var identifiers = new Array();
		var grades = new Array();
		$.each(data, function() {
			var identifier = this.code.replace('.', '-').replace(',', '-');
			var item = '<li class="' + identifier + '">' 
						+ '<a href="#course+' + scode + '+' + fcode + '+' + this.code + '" data-faculty-code="' + fcode + '" data-faculty-name="' + fname + '" data-grade="' + this.grade + '">'
							+ '<div class="name">' + this.name + '</div>'
							+ '<div class="code">' + this.code + '</div>'
							+ '<div id="' + identifier + '" class="stars"></div>'
						+ '</a>' +
						'</li>';
			markup = markup + item;
			if (identifier != '') {
				identifiers.push('#' + identifier);
			}
			grades.push(parseInt(this.grade) * 0.5);
		});
		
		/* Include the faculty name. */
		markup = '<li data-role="list-divider">' + fname + '</li>' + markup;
		$('#search ul').append(markup).trigger('create');
		
		/* Set the star rating for each course applicable. */
		$.each(identifiers, function(index, value) {
			if (grades[index]) {
				$(value).raty({
					half: true,
					readOnly: true,
					score: grades[index]
				});
			}
		});
		
		$('#search ul').listview('refresh');
	},
	
	
	/* Function for adding multiple results for search view.
	
	   data		-- JSON containing the course details (name, code and grade)
	   scode	-- department code
	   fcode	-- faculty code
	   fname	-- faculty name (appears in the user interface)
	
	*/
	
	addResultsPure : function(data, scode, fcode, fname) {
		var markup = '';
		var identifiers = new Array();
		var grades = new Array();
		$.each(data, function() {
			var identifier = this.code.replace('.', '-').replace(',', '-');
			var item = '<li class="' + identifier + '">' 
						+ '<a href="#course+' + scode + '+' + fcode + '+' + this.code + '" data-faculty-code="' + fcode + '" data-faculty-name="' + fname + '" data-grade="' + this.grade + '">'
							+ '<div class="name">' + this.name + '</div>'
							+ '<div class="code">' + this.code + '</div>'
							+ '<div id="' + identifier + '-2" class="stars"></div>'
						+ '</a>' +
						'</li>';
			markup = markup + item;
			if (identifier != '') {
				identifiers.push('#' + identifier + '-2');
			}
			grades.push(parseInt(this.grade) * 0.5);
		});
		$('#pure-search ul').append(markup).trigger('create');
		
		/* Set the star rating for each course applicable. */
		$.each(identifiers, function(index, value) {
			if (grades[index]) {
				$(value).raty({
					half: true,
					readOnly: true,
					score: grades[index]
				});
			}
		});
		
		$('#pure-search ul').listview('refresh');
	},
	
	
	/* Function for loading course details into a course view. */
	
	loadCourse : function() {
	
		$('.ui-loader').show();
		
		/* Manually change the appearance of the home button to back button. */
		$('#header .home').data('icon', 'arrow-l').data('iconpos', '').data('mini', 'true');
		$('#header .home').addClass('ui-mini').removeClass('ui-btn-icon-notext').addClass('ui-btn-icon-left');
		
		$('#header .home').children('span').children('.ui-btn-text').html('Back');
		$('#header .home').children('span').children('.ui-icon').removeClass('ui-icon-home').addClass('ui-icon-arrow-l');
		
		/* Set the back button view respectively to either search or courses view. */
		if (NoppaCRA.fromPure) {
			$('#header .home').attr('href', '#pure-search');
		} else {
			$('#header .home').attr('href', '#search');
		}
		$('#header .home').trigger('create');
		
		/* Some resetting of the view before loading the new content. */
		$('#course .course-review, #course .course-reviews, #course .hide-course').hide();
		$('#course .course-reviews-content').html('<span>No reviews.</span>');
		var info = window.location.hash.split('+');
		
		$('#course .stars-header, #course .stars').hide();
		$('#course .stars').html('');
		
		/* Load and append the course details. */
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/' + info[1] + '/' + info[2] + '/' + info[3] + '/'
		}).done(function(data) {
			NoppaCRA.debug ? console.log(data) : '';
			
			$.each(data, function() {
			
				var credits = null;
				var period = null;
				
				/* Get the course credits. */
				if (typeof(this.Any) != 'undefined') {
					$('#course-credits').html(this.Any.text);
					credits = this.Any;
				}
				
				/* Get the course period. */
				if (typeof(this.Any_2) != 'undefined') {
					$('#course-period').html(this.Any_2.text);
					period = this.Any_2;
					$('#course-credits').width($('#course-code').width());
				}
				
				/* Go through the other details. */
				$.each(this, function() {
					if (this != credits && this != period && this.heading != '' && typeof(this.heading) != 'undefined' && this.text != '' && typeof(this.text) != 'undefined') {
						$('#course .course-details').append(
							'<div data-role="collapsible" class="course-detail">' +
								'<h3 class="course-detail-title">' + $.trim(this.heading) + '</h3>' +
								'<p class="course-detail-value">' + $.trim(this.text) + '</p>' +
							'</div>');
					}
				});
				$('#course .course-details').trigger('create');
			});
			
			/* Set the defaults for the new rating. */
			$('#rating').val(parseInt('5'));
			$('#rating').selectmenu("refresh");
			$('#comment').val('');
			
			/* Check whether the user is authenticated, show the review form.
			   Pre-populate the form with old values if previously reviewed (the same course). */
			if (NoppaCRA.authenticated) {
			
				$.post('auth/', { method: 'review', faculty: info[1], department: info[2], course: info[3] },
					function(data) {
						NoppaCRA.debug ? console.log(data.value) : '';
						if (data.value != 'ERROR') {
							$.each($.parseJSON(data.value), function() {
								$('#rating').val(parseInt(this.fields.grade));
								$('#rating').selectmenu("refresh");
								$('#comment').val(this.fields.comment);
							});
						}
						$('#course .course-review').show();
					}, "json"
				);
			
			}
			
			/* Get all the course reviews regarding this course. */
			$.post('auth/', { method: 'course', faculty: info[1], department: info[2], course: info[3] },
				function(data) {
					NoppaCRA.debug ? console.log(data.value) : '';
					if (data.value != 'ERROR') {
						var i = 1;
						$.each($.parseJSON(data.value), function() {
							if (i > 0) {
								$('#course .course-reviews-content').html('');
								i--;
							}
							$('#course .course-reviews-content').append('<span class="grade"><strong>Grade: </strong>' + this.fields.grade + '</span><br /><span><strong>Comment: </strong>' + this.fields.comment + '</span><br /><br />');
						});
					}
					$('#course .course-reviews').show();
					$('.ui-loader').hide();
				}, "json"
			);
			
			/* Set the overall grade (stars) of the course. */
			if (parseInt($('#course .stars').data('grade')) != -1) {
				$('#course .stars-header, #course .stars').show();
				$('#course .stars').raty({
					half: true,
					readOnly: true,
					score: parseInt($('#course .stars').data('grade')) / 2
				});
			}
			
			$('#course .hide-course').show();
			
		});
	
	},
	
	
	/* Function for loading reviews for a course view. */
	
	updateReviews : function() {
	
		var info = window.location.hash.split('+');
	
		$.post('auth/', { method: 'course', faculty: info[1], department: info[2], course: info[3] },
			function(data) {
				NoppaCRA.debug ? console.log(data.value) : '';
				if (data.value != 'ERROR') {
					var i = 1;
					$.each($.parseJSON(data.value), function() {
						if (i > 0) {
							$('#course .course-reviews-content').html('');
							i--;
						}
						$('#course .course-reviews-content').append('<span class="grade"><strong>Grade: </strong>' + this.fields.grade + '</span><br /><span><strong>Comment: </strong>' + this.fields.comment + '</span><br /><br />');
					});
				}
				$('#course .course-reviews').show();
				$('.ui-loader').hide();
			}, "json"
		);
	
	},
	
	
	/* Function for hiding the blacklisted courses with CSS. */
	
	blacklist : function() {
	
		var previous = localStorage.getItem('blacklist');
		if (!previous || previous == 'null' || typeof(previous) == 'null') {
			previous = '';
		}
		previous = previous.split(',');
		$.each(previous, function() {
			if (this != '') {
				$('.' + this.replace('.', '-').replace(',', '-')).css('display', 'none');
			}
		});
	
	},
	
	
	/* Function used to bind the additional bindings during the
	   initial page load. */
	
	initEvents : function() {
	
		/* Bind courses view course link actions. */
		
		$('#search ul li a').live('click', function() {
			NoppaCRA.fromPure = false;
			NoppaCRA.searchLastScrollTop = $('body').scrollTop();
			NoppaCRA.debug ? console.log(NoppaCRA.searchLastScrollTop) : '';
			
			/* Set the data from this view to the course details view. */
			$('#course-code').html($(this).children('.code').html());
			$('#course-name').html($(this).children('.name').html());
			$('#course-credits, #course-period').html('');
			$('#course .course-details').html('');
			if ($(this).data('grade') != null) {
				$('#course .stars').data('grade', $(this).data('grade'));
			} else {
				$('#course .stars').data('grade', -1);
			}
			
			/* Set the hash. */
			window.location.hash = $(this).attr('href');
			
			$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
				$(this).removeClass('ui-btn-active');
			});
			$('#search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimer);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
		/* Bind courses view course link CSS actions. */
		
		$('#search ul li a').live('mousedown', function() {
			$('#search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimer);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
		/* Bind search view course link actions. */
		
		$('#pure-search ul li a').live('click', function() {
			NoppaCRA.fromPure = true;
			NoppaCRA.searchLastScrollTopPure = $('body').scrollTop();
			NoppaCRA.debug ? console.log(NoppaCRA.searchLastScrollTopPure) : '';
			
			/* Set the data from this view to the course details view. */
			$('#course-code').html($(this).children('.code').html());
			$('#course-name').html($(this).children('.name').html());
			$('#course-credits, #course-period').html('');
			$('#course .course-details').html('');
			if ($(this).data('grade') != null) {
				$('#course .stars').data('grade', $(this).data('grade'));
			} else {
				$('#course .stars').data('grade', -1);
			}
			
			/* Set the hash. */
			window.location.hash = $(this).attr('href');
			
			$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
				$(this).removeClass('ui-btn-active');
			});
			$('#pure-search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimerPure);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
		/* Bind search view course link CSS actions. */
		
		$('#pure-search ul li a').live('mousedown', function() {
			$('#pure-search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimerPure);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
		/* Bind faculty selection change actions.
		   (User changes selected faculties in filter and sort view.) */
		
		$('#filter input').live('change', function() {
			var previous = localStorage.getItem('faculties');
			if (!previous || previous == 'null' || typeof(previous) == 'null') {
				previous = '';
			}
			NoppaCRA.debug ? console.log(previous) : '';
			if ($(this).is(':checked')) {
				previous = previous + $(this).data('faculty-code') + ',';
			} else {
				previous = previous.replace($(this).data('faculty-code') + ',', '');
			}
			NoppaCRA.debug ? console.log(previous) : '';
			localStorage.setItem('faculties', previous);
			NoppaCRA.searchRefresh = true;
		});
		
		/* Bind username blur actions.
		   (Check from the backend if username is reserved.) */
		
		$('#username').blur(function() {
		
			var usernameString = $('#username').val();
			if (usernameString != '') {
				
				/* If username is reserved, enable just the login button,
				   otherwise enable just the register button. */
				$.post('auth/', { method: 'reserved', username: usernameString },
					function(data) {
						NoppaCRA.debug ? console.log('Check for: ' + usernameString + ' ' + data.method + ' returns ' + data.value + '.') : '';
						if (data.value == 'OK') {
							$('#register-button').button('enable');
							$('#login-button').button('disable');
						} else {
							$('#register-button').button('disable');
							$('#login-button').button('enable');
						}
						$('.ui-loader').hide();
					}, "json"
				);
			
			} else {
				$('#register-button').button('disable');
				$('#login-button').button('enable');
			}
			return false;
		
		});
		
		/* Set the login and registration form submit actions. */
		
		$('#authenticate').submit(function(event) {
		
			$('#login .login-error, #login .registration-error').hide();
			
			var usernameString = $('#username').val();
			var passwordString = $('#password').val();
			
			var passwordHashObject;
			var passwordHash;
			
			/* Hash the entered password with SHA-256. */
			passwordHashObject = new jsSHA(passwordString);
			passwordHash = passwordHashObject.getHash('SHA-256', 'HEX');
			
			if (usernameString != '' && passwordString != '') {
				
				/* Login button pressed, so login. */
				if (NoppaCRA.loginButton) {
				
					$('.ui-loader').show();
					NoppaCRA.loginButton = false;
					
					$.post('auth/', { method: 'login', username: usernameString, password: passwordHash },
						function(data) {
							NoppaCRA.debug ? console.log('Login: ' + usernameString + ', ' + passwordString + ': ' + data.method + ' returns ' + data.value + '.') : '';
							if (data.value) {
								window.location.hash = '#reviews';
								NoppaCRA.authenticated = true;
							} else {
								$('#login .login-error').show();
							}
							$('.ui-loader').hide();
						}, "json"
					);
					
				/* Register button pressed, so register. */
				} else if (NoppaCRA.registerButton) {
				
					$('.ui-loader').show();
					NoppaCRA.registerButton = false;
					
					$.post('auth/', { method: 'register', username: usernameString, password: passwordHash },
						function(data) {
							NoppaCRA.debug ? console.log('Register: ' + usernameString + ', ' + passwordString + ': ' + data.method + ' returns ' + data.value + '.') : '';
							if (data.value == 'OK') {
								window.location.hash = '#reviews';
								NoppaCRA.authenticated = true;
							} else {
								$('#login .register-error').show();
							}
							$('.ui-loader').hide();
						}, "json"
					);
				
				}
			
			}
			return false;
		});
		
		/* Login button clicked. */
		
		$('#login-button').bind('click', function() {
			NoppaCRA.loginButton = true;
		});
		
		/* Register button clicked. */
		
		$('#register-button').bind('click', function() {
			NoppaCRA.registerButton = true;
		});
		
		/* Set the logout form submit actions. */
		
		$('#logout').submit(function(event) {
		
			$('#login .login-error, #login .registration-error').hide();
			$('#username').val('');
			$('#password').val('');
			
			$('.ui-loader').show();
			
			/* Take the logout actions only if logout successful. */
			$.post('auth/', { method: 'logout' },
				function(data) {
					NoppaCRA.debug ? console.log('Logout: ' + data.method + ' returns ' + data.value + '.') : '';
					if (data.value == 'OK') {
						window.location.hash = '#login';
						$('#logged-in-user, #reviews-holder').html('');
						$('.login').attr('href', '#login');
						$('.login').children('span').children('.ui-btn-text').text('Login');
						$('#reviews p, #reviews form').hide();
						NoppaCRA.authenticated = false;
					}
					$('.ui-loader').hide();
				}, "json"
			);
			
			return false;
		});
		
		/* Set the review form submit actions.
		   (User submits a review from a course details view.) */
		
		$('#review').submit(function() {
		
			$('.ui-loader').show();
			
			var info = window.location.hash.split('+');
			
			var comment = $('#comment').val();
			var grade = $('#rating').val();
			
			$.post('noppa/' + info[1] + '/' + info[2] + '/' + info[3] + '/', { comment: comment, grade: grade },
				function(data) {
					NoppaCRA.debug ? console.log(data) : '';
					if (data == 'evaluation done') {
						NoppaCRA.updateReviews();
						$('#review-collapsible').trigger('collapse');
						$('#reviews-collapsible').trigger('expand');
						$('.ui-loader').hide();
						$('#pure-search input').keyup();
					} else {
						$('.ui-loader').hide();
					}
				}
			);
			
			return false;
		
		});
		
		/* Binds the actions for removing a review from the reviews view. */
		
		$('#reviews-holder .remove-button').live('click', function() {
		
			var thisHolder = $(this);
			$('.ui-loader').show();
			
			$.post('auth/', { method: 'drop', course: $(this).data('code').toString() },
				function(data) {
					NoppaCRA.debug ? console.log(data.value) : '';
					if (data.value == 'OK') {
						thisHolder.parent().parent().parent().parent().remove();
						$('#pure-search input').keyup();
						$('.ui-loader').hide();
					} else {
						$.post('auth/', { method: 'drop', course: '0' + thisHolder.data('code').toString() },
							function(data) {
								NoppaCRA.debug ? console.log(data.value) : '';
								if (data.value == 'OK') {
									thisHolder.parent().parent().parent().parent().remove();
									$('#pure-search input').keyup();
									$('.ui-loader').hide();
								} else {
									$('.ui-loader').hide();
								}
							}
						);
					}
				}
			);
			return false;
		});
		
		/* Binds the blacklisting actions for hiding a course from the course
		   details view. */
		
		$('#course .hide-button').live('click', function() {
			
			var previous = localStorage.getItem('blacklist');
			if (!previous || previous == 'null' || typeof(previous) == 'null') {
				previous = '';
			}
			NoppaCRA.debug ? console.log(previous) : '';
			previous = previous + $('#course-code').html() + ',';
			$('.' + $('#course-code').html().replace('.', '-').replace(',', '-')).css('display', 'none');
			NoppaCRA.debug ? console.log(previous) : '';
			
			/* Update the local storage. */
			localStorage.setItem('blacklist', previous);
			
			if (NoppaCRA.fromPure) {
				window.location.hash = '#pure-search';
			} else {
				window.location.hash = '#search';
			}
		});
		
		/* Binds the de-blacklisting actions for showing blacklisted courses
		   from the filter and sort view. */
		
		$('#blacklist .show-button').live('click', function() {
		
			var previous = localStorage.getItem('blacklist');
			if (!previous || previous == 'null' || typeof(previous) == 'null') {
				previous = '';
			}
			NoppaCRA.debug ? console.log(previous) : '';
			previous = previous.replace($(this).data('code') + ',', '');
			if ($(this).data('code')) {
				var temp = $(this).data('code').toString();
				if (temp.indexOf('.') > -1) {
					temp = $(this).data('code').replace('.', '-');
				}
				if (temp.indexOf(',') > -1) {
					temp = temp.replace(',', '-');
				}
				$('.' + temp).show();
			}
			NoppaCRA.debug ? console.log(previous) : '';
			
			/* Update the local storage. */
			localStorage.setItem('blacklist', previous);
			
			$(this).parent().parent().parent().parent().remove();
		});
		
		/* Bind the live search for the search view. */
		
		$('#pure-search input').live('keyup', function() {
		
			var thisHolder = $(this);
			
			if ($(this).val() != '' && $(this).val().length > 2) {
				$('.ui-loader').show();
				$('#pure-search ul').html('').listview('refresh');
				if (NoppaCRA.pureXHR) {
					NoppaCRA.pureXHR.abort();
				}
				
				/* Save the XHR for cancellation if a newer search is done. */
				NoppaCRA.pureXHR = jQuery.ajax({
					type: 'GET',
					url: 'search/' + $(this).val().replace(' ', '_') + '?sort_by=' + $('#sort').val()
				}).done(function(data) {
					NoppaCRA.addResultsPure(data, 'faculty', 'department', thisHolder.parent().children('label').children('span').children('.ui-btn-text').html());
					NoppaCRA.blacklist();
					$('.ui-loader').hide();
				});
			} else {
				$('#pure-search ul').html('').listview('refresh');
			}
		});
		
		/* Bind the sort method change actions for the filter and sort view. */
		
		$('#sort').bind('change', function() {
			localStorage.setItem('sort', $('#sort').val());
			$('#pure-search input').keyup();
			NoppaCRA.searchRefresh = true;
		});
		
		/* Bind the additional search field clear actions for the search view. */
		
		$('#pure-search .ui-input-clear').live('click', function() {
			$('#pure-search ul').html('');
		});
		
	}

}


/* The starting point for the JavaScript execution. */

$(document).ready(function() {
	NoppaCRA.init();
});
