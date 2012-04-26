var NoppaCRA = {

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
				location.reload(true);
			}
			switch(hash) {
				case '#home':
					break;
				case '#login':
					break;
				case '#search':
					break;
				case '#sort':
					break;
				case '#filter':
					break;
				default:
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
	
	}

}

$(document).ready(function() {
	NoppaCRA.init();
});
