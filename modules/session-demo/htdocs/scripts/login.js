/*
Copyright (c) 2011, Radu Viorel Cosnita <radu.cosnita@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

define(function() {
	function init() {
		require(["/modules/core-components/htdocs/js/session.js"], function(session) {				
			$("#btnCreateSession").click(function(event) {
				session.currentSession.createSession(function(data) {
					alert("Session created: " + data);
				},
				function(ex) {
					alert("Session create error: " + ex);
				});								
			});					
		
			$("#btnSetValue").click(function(event) {
				session.currentSession.setValue("myname", "Radu Viorel Cosnita", function() {
					alert("Key myname set to Radu Viorel Cosnita");
				},
				function(ex) {
					alert(ex);
				});					
			});
			
			$("#btnGetValue").click(function(event) {
				session.currentSession.getValue("myname", function(data) {
					alert("Key myname is: " + data);
				},
				function(ex) {
					alert(ex);
				});					
			});			
		});
	}
	
	function start() {}
	
	function stop() {}
	
	function load() {}
	
	function dispose() {}
	
	return {
		init : init,
		start : start,
		stop : stop,
		load : load,
		dispose : dispose
	};
});