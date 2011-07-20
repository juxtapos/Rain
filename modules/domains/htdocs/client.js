define(function () 
{
	function initView(elementid, template, instance) {
		console.log('initView Domains ' + elementid);
		var data = {};
		if (typeof instance !== 'undefined') {	
			data = JSON.parse(instance);
		}
		if (template.indexOf('{') === 0) {
			template = JSON.parse(template).content;
		}
		data = "<h1>domains</h1>";
		$.tmpl(template, { blob : data } ).appendTo($('*[id=' + elementid + ']>content'));
	}

	return {
		initView : initView
	}
});
