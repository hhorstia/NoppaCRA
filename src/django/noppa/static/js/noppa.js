String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function(suffix) {
	return this.match(suffix+"$") == suffix;
}

var NoppaCRA = {

	debug : false,

	fresh	: true,
	ready	: false,
	loading : false,
	
	courseTimer : null,
	
	searchRefresh : true,
	filterRefresh : true,
	
	searchLastScrollTop : 0,
	
	loginButton : false,
	registerButton : false,
	
	authenticated : false,
	
	init : function() {
	
		window.location.hash = '';
		
		$(document).bind('pagebeforechange', function(event, data) {
			//NoppaCRA.loading = true;
			//$('[data-role="header"] a, [data-role="navbar"] a').removeClass('ui-btn-active');
			//$('.' + data.toPage[0].id).addClass('ui-btn-active');
		});
		
		$(document).bind('pagechange', function(event, data) {
			//NoppaCRA.loading = false;
			//$('[data-role="header"] a, [data-role="navbar"] a').removeClass('ui-btn-active');
			//$('.' + data.toPage[0].id).addClass('ui-btn-active');
		});
		
		$('[data-role="header"] a, [data-role="navbar"] a').live('click', function(event) {
			$(this).addClass('ui-btn-active');
			if (window.location.hash != this.hash) {
				NoppaCRA.loading = true;
				$('.ui-loader').show();
				
				var hash = this.hash;
				$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
					if (hash != $(this).attr('href')) {
						$(this).removeClass('ui-btn-active');
					}
				});
				
				window.location.hash = this.hash;
			}
			$(this).addClass('ui-btn-active');
		});
		
		$(window).bind('hashchange', function(event) {
			var hash = window.location.hash;
			NoppaCRA.debug ? console.log(hash + ' view called') : '';
			
			var searchRefresh = false;
			var filterRefresh = false;
			var coursePage = false;
			var reviewPage = false;
			
			$('.page').hide();
			
			// TODO
			$('#header .home').data('icon', 'home').data('iconpos', 'notext').data('mini', '');
			$('#header .home').removeClass('ui-mini').addClass('ui-btn-icon-notext').removeClass('ui-btn-icon-left');
			
			$('#header .home').children('span').children('.ui-btn-text').html('Home');
			$('#header .home').children('span').children('.ui-icon').addClass('ui-icon-home').removeClass('ui-icon-arrow-l');
			
			$('#header .home').attr('href', '#home');
			$('#header .home').trigger('create');
			
			if (hash.startsWith('#course')) {
			
				coursePage = true;
				NoppaCRA.loadCourse();
				
				/*$('#search').show();*/
				$('#course').show();
				/*$('#course').animate({
					left: '0%'
				}, 1000);*/
			} else if (hash == '#reviews') {
				//
			} else if (hash != '') {
				$(hash).show();
			} else {
				if (!NoppaCRA.fresh) {
					location.reload(true);
				} else {
					NoppaCRA.fresh = false;
					window.location.hash = '#home';
				}
			}
			
			$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
				if (hash != $(this).attr('href')) {
					$(this).removeClass('ui-btn-active');
				}
			});
			
			switch(hash) {
				case '#home':
					$('.home').addClass('ui-btn-active');
					break;
				case '#login':
					$('.login').addClass('ui-btn-active');
					$('#logged-in-user').html('');
					$('.login').attr('href', '#login');
					$('.login').children('span').children('.ui-btn-text').text('Login');
					break;
				case '#search':
					$('.search').addClass('ui-btn-active');
					NoppaCRA.courseTimer = setTimeout(function() {
						$('#search ul li').removeClass('ui-btn-active');
					}, 1000);
					if (NoppaCRA.searchRefresh) {
						NoppaCRA.refreshSearch(NoppaCRA.filterRefresh);
						NoppaCRA.searchRefresh = false;
						searchRefresh = true;
					} else {
						$('body').scrollTop(NoppaCRA.searchLastScrollTop);
					}
					if (NoppaCRA.filterRefresh) {
						NoppaCRA.refreshFilters(true);
						NoppaCRA.filterRefresh = false;
						searchRefresh = true;
					}
					NoppaCRA.blacklist();
					break;
				case '#sort':
					$('.sort').addClass('ui-btn-active');
					break;
				case '#filter':
					$('.filter').addClass('ui-btn-active');
					var delayedBlacklist = false;
					if (NoppaCRA.filterRefresh) {
						filterRefresh = true;
						NoppaCRA.refreshFilters();
						NoppaCRA.filterRefresh = false;
						delayedBlacklist = true;
					}
					NoppaCRA.refreshBlacklist(delayedBlacklist);
					break;
				case '#reviews':
					$('.login').addClass('ui-btn-active');
					reviewPage = true;
					NoppaCRA.refreshReviews();
					
					break;
				default:
					NoppaCRA.fresh = false;
					break;
			}
			
			if (!searchRefresh && !coursePage && !filterRefresh && !reviewPage) {
				$('.ui-loader').hide();
			}
			NoppaCRA.loading = false;
		});
		
		NoppaCRA.initEvents();
		NoppaCRA.ready = true;
	
	},
	
	refreshBlacklist : function(delayedBlacklist) {
	
		$('#blacklist').html('');
		$('#blacklist').trigger('create').listview('refresh');
		
		var blacklist = localStorage.getItem('blacklist');
		if (!blacklist || blacklist == 'null' || typeof(blacklist) == 'null') {
			blacklist = '';
		}
		blacklist = blacklist.split(',');
		
		if (delayedBlacklist) {
			$('#blacklist').hide();
		}
		
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
		if (blacklist.length > 1 && !delayedBlacklist) {
			$('#blacklist-heading').show();
		} else {
			$('#blacklist-heading').hide();
		}
	
	},
	
	refreshReviews : function() {
	
		$('#reviews').hide();
		
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
	
	refreshFilters : function(callback) {
	
		$('#filter .faculties').hide();
	
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/'
		}).done(function(data) {
			NoppaCRA.debug ? console.log(data) : '';
			
			var counter = 0;
			var done = 0;
			
			$.each(data, function() {
				$('#filter .faculties').append(
					'<div class="' + this.code + '" data-role="fieldcontain">' +
						'<h4 class="name">' + this.name + '</h4>' +
						'<fieldset class="group" data-role="controlgroup"></fieldset>' +
					'</div>');
					
				var scode = this.code;
				
				jQuery.ajax({
					type: 'GET',
					url: 'noppa/' + this.code + '/'
				}).done(function(data) {
					NoppaCRA.debug ? console.log(data) : '';
					NoppaCRA.debug ? console.log(scode) : '';
					
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
	
	refreshSearch : function(callback) {
	
		$('.ui-loader').show();
		$('#search ul').html('').listview('refresh');
		$('#search input').val('');
		
		$('#filter input:checked').each(function() {
			
			var thisHolder = $(this);
			
			jQuery.ajax({
				type: 'GET',
				url: 'noppa/' + $(this).data('school-code') + '/' + $(this).data('faculty-code') + '/'
			}).done(function(data) {
				NoppaCRA.addResults(data, thisHolder.data('school-code'), thisHolder.data('faculty-code'), thisHolder.parent().children('label').children('span').children('.ui-btn-text').html());
				NoppaCRA.blacklist();
				$('.ui-loader').hide();
			});
			
		});
		
		if ($('#filter input:checked').length == 0 && !callback) {
			$('#search ul').html('<p class="search-info">Select interesting faculties from the filter page.</p>').listview('refresh');
			$('.ui-loader').hide();
		}
		
	},
	
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
		markup = '<li data-role="list-divider">' + fname + '</li>' + markup;
		$('#search ul').append(markup).trigger('create');
		
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
	
	loadCourse : function() {
	
		$('.ui-loader').show();
		
		// TODO
		$('#header .home').data('icon', 'arrow-l').data('iconpos', '').data('mini', 'true');
		$('#header .home').addClass('ui-mini').removeClass('ui-btn-icon-notext').addClass('ui-btn-icon-left');
		
		$('#header .home').children('span').children('.ui-btn-text').html('Back');
		$('#header .home').children('span').children('.ui-icon').removeClass('ui-icon-home').addClass('ui-icon-arrow-l');
		
		$('#header .home').attr('href', '#search');
		$('#header .home').trigger('create');
		
		$('#course .course-review, #course .course-reviews, #course .hide-course').hide();
		$('#course .course-reviews-content').html('<span>No reviews.</span>');
		var info = window.location.hash.split('+');
		
		$('#course .stars-header, #course .stars').hide();
		$('#course .stars').html('');
	
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/' + info[1] + '/' + info[2] + '/' + info[3] + '/'
		}).done(function(data) {
			NoppaCRA.debug ? console.log(data) : '';
			
			$.each(data, function() {
			
				var credits = null;
				var period = null;
				
				if (typeof(this.Any) != 'undefined') {
					$('#course-credits').html(this.Any.text);
					credits = this.Any;
				}
				if (typeof(this.Any_2) != 'undefined') {
					$('#course-period').html(this.Any_2.text);
					period = this.Any_2;
					$('#course-credits').width($('#course-code').width());
				}
				
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
			
			$('#rating').val(parseInt('5'));
			$('#rating').selectmenu("refresh");
			$('#comment').val('');
			
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
	
	blacklist : function() {
	
		var previous = localStorage.getItem('blacklist');
		if (!previous || previous == 'null' || typeof(previous) == 'null') {
			previous = '';
		}
		previous = previous.split(',');
		console.log(previous);
		$.each(previous, function() {
			if (this != '') {
				$('.' + this.replace('.', '-').replace(',', '-')).css('display', 'none');
			}
		});
	
	},
	
	initEvents : function() {
	
		$('#search ul li a').live('click', function() {
			NoppaCRA.searchLastScrollTop = $('body').scrollTop();
			NoppaCRA.debug ? console.log(NoppaCRA.searchLastScrollTop) : '';
			
			$('#course-code').html($(this).children('.code').html());
			$('#course-name').html($(this).children('.name').html());
			$('#course-credits, #course-period').html('');
			$('#course .course-details').html('');
			if ($(this).data('grade') != null) {
				$('#course .stars').data('grade', $(this).data('grade'));
			} else {
				$('#course .stars').data('grade', -1);
			}
			
			window.location.hash = $(this).attr('href');
			$('[data-role="header"] a, [data-role="navbar"] a').each(function() {
				$(this).removeClass('ui-btn-active');
			});
			$('#search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimer);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
		$('#search ul li a').live('mousedown', function() {
			$('#search ul li').removeClass('ui-btn-active');
			clearTimeout(NoppaCRA.courseTimer);
			$(this).parent().parent().parent().addClass('ui-btn-active');
		});
		
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
		
		$('#username').blur(function() {
		
			var usernameString = $('#username').val();
			if (usernameString != '') {
				
				$.post('auth/', { method: 'reserved', username: usernameString },
					function(data) {
						NoppaCRA.debug ? console.log('Check for: ' + usernameString + ' ' + data.method + ' returns ' + data.value + '.') : '';
						if (data.value == 'OK') {
							$('#register-button').button('enable');
						} else {
							$('#register-button').button('disable');
						}
						$('.ui-loader').hide();
					}, "json"
				);
			
			}
			return false;
		
		});
		
		$('#authenticate').submit(function(event) {
		
			$('#login .login-error, #login .registration-error').hide();
			
			var usernameString = $('#username').val();
			var passwordString = $('#password').val();
			
			if (usernameString != '' && passwordString != '') {
				
				if (NoppaCRA.loginButton) {
				
					$('.ui-loader').show();
					NoppaCRA.loginButton = false;
					
					$.post('auth/', { method: 'login', username: usernameString, password: hex_sha512(passwordString) },
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
					
				} else if (NoppaCRA.registerButton) {
				
					$('.ui-loader').show();
					NoppaCRA.registerButton = false;
					
					$.post('auth/', { method: 'register', username: usernameString, password: hex_sha512(passwordString) },
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
		
		$('#login-button').bind('click', function() {
			NoppaCRA.loginButton = true;
		});
		
		$('#register-button').bind('click', function() {
			NoppaCRA.registerButton = true;
		});
		
		$('#logout').submit(function(event) {
		
			$('#login .login-error, #login .registration-error').hide();
			$('#username').val('');
			$('#password').val('');
			
			$('.ui-loader').show();
			
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
					} else {
						$('.ui-loader').hide();
					}
				}
			);
			
			return false;
		
		});
		
		$('#reviews-holder .remove-button').live('click', function() {
		
			var thisHolder = $(this);
			$('.ui-loader').show();
			$.post('auth/', { method: 'drop', course: $(this).data('code') },
				function(data) {
					NoppaCRA.debug ? console.log(data.value) : '';
					if (data.value == 'OK') {
						thisHolder.parent().parent().parent().parent().remove();
						$('.ui-loader').hide();
					} else {
						$('.ui-loader').hide();
					}
				}
			);
			return false;
		});
		
		$('#course .hide-button').live('click', function() {
			
			var previous = localStorage.getItem('blacklist');
			if (!previous || previous == 'null' || typeof(previous) == 'null') {
				previous = '';
			}
			NoppaCRA.debug ? console.log(previous) : '';
			previous = previous + $('#course-code').html() + ',';
			$('.' + $('#course-code').html().replace('.', '-').replace(',', '-')).css('display', 'none');
			NoppaCRA.debug ? console.log(previous) : '';
			localStorage.setItem('blacklist', previous);
			
			window.location.hash = '#search';
		});
		
		$('#blacklist .show-button').live('click', function() {
		
			var previous = localStorage.getItem('blacklist');
			if (!previous || previous == 'null' || typeof(previous) == 'null') {
				previous = '';
			}
			NoppaCRA.debug ? console.log(previous) : '';
			previous = previous.replace($(this).data('code') + ',', '');
			$('.' + $(this).data('code').replace('.', '-').replace(',', '-')).show();
			NoppaCRA.debug ? console.log(previous) : '';
			localStorage.setItem('blacklist', previous);
			
			$(this).parent().parent().parent().parent().remove();
		});
	
	}

}

$(document).ready(function() {
	NoppaCRA.init();
});
