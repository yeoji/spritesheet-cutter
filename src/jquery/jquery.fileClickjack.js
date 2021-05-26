import jQuery from 'jquery';

(function($) {
	$.fn.fileClickjack = function($fileInput) {
		$fileInput = $( $fileInput );
		
		var hideCss = {
			top: -5000,
			left: 0
		};
		
		$fileInput.css( hideCss ).css({
			opacity: 0,
			position: 'absolute'
		});
		
		function openInput(event) {
			$fileInput[0].click();
			event.preventDefault();
		}
		
		this.each(function() {
			// must use addEventListener to keep the click listener in the stack
			this.addEventListener('click', openInput, false);
		});
		
		return this;
	};
	
})(jQuery);