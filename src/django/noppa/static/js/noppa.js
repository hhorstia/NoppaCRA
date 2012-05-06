String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function(suffix) {
	return this.match(suffix+"$") == suffix;
}

var NoppaCRA = {

	fresh	: true,
	ready	: false,
	loading : false,
	
	courseTimer : null,
	
	searchRefresh : true,
	filterRefresh : true,
	
	searchLastScrollTop : 0,
	
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
			console.log(hash + ' view called');
			
			var searchRefresh = false;
			var filterRefresh = false;
			var coursePage = false;
			
			$('.page').hide();
						
			if (hash.startsWith('#course')) {
			
				coursePage = true;
				NoppaCRA.loadCourse();
			
				/*$('#search').show();*/
				$('#course').show();
				/*$('#course').animate({
					left: '0%'
				}, 1000);*/
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
					break;
				case '#sort':
					$('.sort').addClass('ui-btn-active');
					break;
				case '#filter':
					$('.filter').addClass('ui-btn-active');
					
					if (NoppaCRA.filterRefresh) {
					
						filterRefresh = true;
						NoppaCRA.refreshFilters();
						NoppaCRA.filterRefresh = false;
					
					}
					
					break;
				default:
					NoppaCRA.fresh = false;
					break;
			}
			
			if (!searchRefresh && !coursePage && !filterRefresh) {
				$('.ui-loader').hide();
			}
			NoppaCRA.loading = false;
		});
		
		NoppaCRA.initEvents();
		NoppaCRA.ready = true;
	
	},
	
	refreshFilters : function(callback) {
	
		$('#filter .faculties').hide();
	
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/'
		}).done(function(data) {
			console.log(data);
			
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
					console.log(data);
					console.log(scode);
					
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
		
		$('#filter input:checked').each(function() {
			
			var thisHolder = $(this);
			
			jQuery.ajax({
				type: 'GET',
				url: 'noppa/' + $(this).data('school-code') + '/' + $(this).data('faculty-code') + '/'
			}).done(function(data) {
				NoppaCRA.addResults(data, thisHolder.data('school-code'), thisHolder.data('faculty-code'), thisHolder.parent().children('label').children('span').children('.ui-btn-text').html());
				$('.ui-loader').hide();
			});
			
		});
		
		if ($('#filter input:checked').length == 0 && !callback) {
			$('#search ul').html('<p class="search-info">Please select the faculties interesting you from the filter page.</p>').listview('refresh');
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
			var item = '<li>' 
						+ '<a href="#course+' + scode + '+' + fcode + '+' + this.code + '" data-faculty-code="' + fcode + '" data-faculty-name="' + fname + '">'
							+ '<div class="name">' + this.name + '</div>' 
							+ '<div class="code">' + this.code + '</div>'
							+ '<div id="' + identifier + '" class="stars"></div>'
						+ '</a>' +
						'</li>';
			markup = markup + item;
			identifiers.push('#' + identifier);
			grades.push(parseInt(this.grade) * 0.5);
		});
		markup = '<li data-role="list-divider">' + fname + '</li>' + markup;
		$('#search ul').append(markup).trigger('create');
		
		$.each(identifiers, function(index, value) {
			if (grades[index]) {
				$('#' + value).raty({
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
	
		var info = window.location.hash.split('+');
	
		jQuery.ajax({
			type: 'GET',
			url: 'noppa/' + info[1] + '/' + info[2] + '/' + info[3] + '/'
		}).done(function(data) {
			//console.log(data);
			
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
								
			$('.ui-loader').hide();
		});
	
	},
	
	initEvents : function() {
	
		$('#search ul li a').live('click', function() {
			NoppaCRA.searchLastScrollTop = $('body').scrollTop();
			console.log(NoppaCRA.searchLastScrollTop);
			
			$('#course-code').html($(this).children('.code').html());
			$('#course-name').html($(this).children('.name').html());
			$('#course-credits, #course-period').html('');
			$('#course .course-details').html('');
			
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
			console.log(previous);
			if ($(this).is(':checked')) {
				previous = previous + $(this).data('faculty-code') + ',';
			} else {
				previous = previous.replace($(this).data('faculty-code') + ',', '');
			}
			console.log(previous);
			localStorage.setItem('faculties', previous);
			NoppaCRA.searchRefresh = true;
		});
		
		$('#authenticate').submit(function() {
			
			var usernameString = $('#username').val();
			var passwordString = $('#password').val();	
			
			if (usernameString != '' && passwordString != '') {
			
				$('.ui-loader').show();
				
				$.post('auth/', { method: 'login', username: usernameString, password: hex_sha512(passwordString) },
					function(data) {
						console.log('Login: ' + usernameString + ', ' + passwordString + ': ' + data.method + ' returns ' + data.value + '.');
						if (data.value) {
							
						} else {
							$('#login').append('Login failed. Check your credentials!');
						}
						$('.ui-loader').hide();
					}, "json"
				);
			
			}
			return false;
		});
	
	}

}

$(document).ready(function() {
	NoppaCRA.init();
});
