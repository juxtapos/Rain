define(function () 
{
	function initView(elementid, template, instance) {
		var data = {};
		console.log('initView scrollabletable' + instance);
		if (typeof instance !== 'undefined') {	
			data = JSON.parse(instance);
		}
		if (template.indexOf('{') === 0) {
			template = JSON.parse(template).content;
		}
		$.tmpl(template, { city : data.city } ).appendTo($('*[id=' + elementid + ']'));
	}

	return {
		initView : initView
	}
});
