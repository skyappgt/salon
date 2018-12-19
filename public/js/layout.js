$(document).ready(function() {
	let sub_elements = $('.sub-element');
	$('.element li').hover(function() {
		let element = $(this).find('.sub-element');
		if(element.hasClass('hidden')){
			element.toggleClass('hidden');
		}
		if(!element.hasClass('visible')){
			element.toggleClass('visible');
		}
	}, function() {
		let element = $(this).find('.sub-element');
		if(element.hasClass('visible')){
			element.toggleClass('visible');
		}
		if(!element.hasClass('hidden')){
			element.toggleClass('hidden');
		}
	});
});
