/**  
 * Module Container, Manager, Factory, whatever. All module related thingz must belong to us. 
 *
 * Todos:
 *
 * * scan the local module folder for web component descriptors as resources. 
 * * download module descriptors from remote web component hosts as resources. 
 * * provide web component objects.  
 * * crud on module instances. 
 * 
 */
var mod_fs = require('fs')
	, mod_resourcemanager = require('./resourcemanager.js')
	, path = require('path')



function moduleRootFolder() {
	return path.join(__dirname, '..', 'modules');
}

function scanFolder(folder) {
	mod_fs.readdir(moduleRootFolder(), function (err, files) {
		if (err) throw err;

		mod_resourcemanager.getResources(['file://' + moduleRootFolder() + '/app/htdocs/index.html']).then(function () {
			console.log('grunz...');	
		}); 
		
	});
}

const DEFAULT_VIEW = 'main.html';
/**
 * Gets an absolute file URL of a module. 
 * [TBD] not here
 * 
 * @param {String} moduleId unique module id
 * @param {String} viewname view name, may be a partial path
 * @return {String}
 */ 
function getViewUrl(moduleid, viewname) {
    return 'file://' + require('path')
            .join(__dirname
                    , '..'
                    , 'modules'
                    , moduleid
                    , 'htdocs'
                    , viewname ? viewname : DEFAULT_VIEW
            );
}   


exports.getViewUrl = getViewUrl;