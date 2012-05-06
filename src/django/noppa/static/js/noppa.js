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
	courseRefresh : true,
	
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
			
			var courseRefresh = false;
			var coursePage = false;
			
			$('.page').hide();
						
			if (hash.startsWith('#course')) {
			
				coursePage = true;
				$('.ui-loader').show();
			
				var info = hash.split('+');
			
				jQuery.ajax({
					type: 'GET',
					url: '../noppa/' + info[1] + '/' + info[2] + '/' + info[3] + '/'
				}).done(function(data) {
					console.log(data);
					$('.ui-loader').hide();
				});
			
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
					if (NoppaCRA.courseRefresh) {
						NoppaCRA.refreshSearch();
						NoppaCRA.courseRefresh = false;
						courseRefresh = true;
					} else {
						$('body').scrollTop(NoppaCRA.searchLastScrollTop);
					}
					break;
				case '#sort':
					$('.sort').addClass('ui-btn-active');
					break;
				case '#filter':
					$('.filter').addClass('ui-btn-active');
					break;
				default:
					NoppaCRA.fresh = false;
					break;
			}
			
			if (!courseRefresh && !coursePage) {
				$('.ui-loader').hide();
			}
			NoppaCRA.loading = false;
		});
		
		NoppaCRA.initEvents();
		NoppaCRA.ready = true;
	
	},
	
	refreshSearch : function() {
	
		$('.ui-loader').show();
		$('#search ul').html('').listview('refresh');
		/*$('#search ul').html('').listview({
			autodividers: true,
			autodividersSelector: function(li) {
				var out = li.children('a').data('faculty-name');
				return out;
			}
		}).listview('refresh');*/
		
		jQuery.ajax({
			type: 'GET',
			url: '../noppa/taik/a803/'
		}).done(function(data) {
			//console.log(data);
			/*$.each(data, function() {
				NoppaCRA.addResult(this.code, this.name, this.grade, 'taik', 'a803', 'Muotoilun laitos');
			});*/
			$('#search ul').html('<li data-role="list-divider">Muotoilun laitos</li>');
			NoppaCRA.addResults(data, 'taik', 'a803', 'Muotoilun laitos');
			$('.ui-loader').hide();
		});
		
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
	
	initEvents : function() {
	
		$('#search ul li a').live('click', function() {
			NoppaCRA.searchLastScrollTop = $('body').scrollTop();
			console.log(NoppaCRA.searchLastScrollTop);
			
			$('#course-code').html($(this).children('.code').html());
			$('#course-name').html($(this).children('.name').html());
			
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
		
		$('#authenticate').submit(function() {
			console.log('form submitted');
			return false;
		});
	
	}

}

$(document).ready(function() {
	NoppaCRA.init();
});
