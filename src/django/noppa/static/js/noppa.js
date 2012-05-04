var NoppaCRA = {

	fresh	: true,
	ready	: false,
	loading : false,
	
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
			$('.page').hide();
			if (hash != '') {
				$(hash).show();
			} else {
				if (!NoppaCRA.fresh) {
					location.reload(true);
				} else {
					NoppaCRA.fresh = false;
					window.location.hash = '#home';
				}
			}
			switch(hash) {
				case '#home':
					break;
				case '#login':
					break;
				case '#search':
					NoppaCRA.initSearch();
					break;
				case '#sort':
					break;
				case '#filter':
					break;
				default:
					NoppaCRA.fresh = false;
					break;
			}
			$('.ui-loader').hide();
			NoppaCRA.loading = false;
		});
		
		$('#authenticate').submit(function() {
			console.log('form submitted');
			return false;
		});
		
		NoppaCRA.ready = true;
	
	},
	
	initSearch : function() {
	
		$('#search ul').append('<li>' 
								+ '<a href="#">'
									+ '<div class="name">Introduction to Software Engineering</div>' 
									+ '<div class="code">T-76.3601</div>'
									+ '<div id="T-76-3601" class="stars"></div>'
								+ '</a>' +
								'</li>').trigger('create');
		$('#search ul').listview('refresh');
		
		$('#T-111-5360').raty({
			half: true,
			readOnly: true,
			score: 2.5
		});
		/*
		jQuery.ajax({
			type: 'GET',
			url: 'http://127.0.0.1:8000/noppa/taik/a803/',
			jsonpCallback: 'NoppaCRA.handle',
			dataType: "jsonp"
		});
		*/
	},
	
	handle : function() {
		alert('a');
	}

}

$(document).ready(function() {
	NoppaCRA.init();
});
