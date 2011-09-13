define(function () 
{
	function initView(elementid, template, instance) {
		var data = {};
		console.log('initView translation');
		// console.log(instance)
		// if (typeof instance !== 'undefined') {	
		// 	data = JSON.parse(instance);
		// }
		// if (template.indexOf('{') === 0) {
		// 	template = JSON.parse(template).content;
		// } 
		
		// var d = $('*[id=' + elementid + ']').append('<div class="grunz">');
		// d.load('/modules/weather/controller/getWeatherData?location=' + data.woeid);
		//$.tmpl(template, { city : data.city } ).appendTo($('*[id=' + elementid + ']'));
	}

	function init () {
		initView();
		
		var transInfo = $('#translationInfo');
		var extractTranslationObject = function(obj){
		  var li = '';
		  for(var i = obj.messages.length; i--;){
		    var message = obj.messages[i];
		    li += '<li><p><div>msgid: <span class="reeeeeed">'+message.msgid+'</span></div>'
		          + '<div>msgid_plural: <span class="reeeeeed">'+(message.msgid_plural || '--------')+'</span></div>'
		          + '<div>attribute: <span class="reeeeeed">'+(message.attr || '--------')+'</span></div>'
		          + '<div>fallback: <span class="reeeeeed">'+message.fallback+'</span></div>'
		          + '<div>locale: <span class="reeeeeed">'+message.locale+'</span></div>'
		          + '</p></li>'
		  }
		  
		  return '<div>Localepath: '+obj.localepath+'</div><ul>'+li+'</ul>';
		};
		
		$('[data-gettext]').live('mouseover mouseout mousemove', function(e){
		  switch(e.type){
        case "mouseout":
          transInfo.hide();
          break;
          
        case "mouseover":
          transInfo.html(extractTranslationObject($(this).data('gettext')));
          transInfo.offset({
            top : e.pageY+20,
            left: e.pageX+20
          });
          transInfo.show();
          break;
          
        case "mousemove":
          transInfo.offset({
            top : e.pageY+20,
            left: e.pageX+20
          });
      }
    });
	}

	function load () {}

	function start () {}

	function pause () {}

	function stop () {}

	function dispose () {}

	return {
		init 		: init,
		load 		: load, 
		start 		: start, 
		pause 		: stop, 
		stop 		: stop,
		dispose 	: dispose
	}
});