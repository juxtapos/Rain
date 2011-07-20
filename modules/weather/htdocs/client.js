define(function () 
{
	function initView(elementid, template, instance) {
		var data = {};
		console.log('initView ' + elementid);
		if (typeof instance !== 'undefined') {	
			data = JSON.parse(instance);
		}
		if (template.indexOf('{') === 0) {
			template = JSON.parse(template).content;
		} 
		$.tmpl(template, { city : data.city } ).appendTo($('*[id=' + elementid + ']>content'));
	}

	return {
		initView : initView
	}
});
