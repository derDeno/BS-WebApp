// Check if a new cache is available on page load.
window.addEventListener('load', function (e) {
    window.applicationCache.addEventListener('updateready', function (e) {
        if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
            app.confirm('Update verf&uuml;gbar! Jetzt runterladen?', 'Update', function () {
                window.location.reload();
            });
        }
    }, false);
}, false);


Array.prototype.contains = function(k) {
	for(var i=0; i < this.length; i++){
    	if(this[i] === k){
      		return true;
    	}
  	}
  	return false;
}


// Get Hoster Link
function hostLink(id) {
	$$.getJSON('http://bs.to/api/watch/'+ id +'/?s='+loggedIn(), function(data) {
		if(app.device.ios) {
			if(data.hoster == 'Vivo' || data.hoster == 'Streamcloud') {				
				var buttons = [
					{
						text: 'Was soll ich machen?',
						label: true
					},
					{
						text: '<a href="'+ data.fullurl +'" target="_blank" class="external item-link">&Ouml;ffnen in Safari</a>',
						bold: true
					},
					{
						text: 'Video abspielen',
						disabled: true,
						onClick: function() {
								if(data.hoster == 'Vivo') {
									getVivoVideo(data.fullurl);
								}else {
									getStreamcloudVideo(data.fullurl);
								}
							}
					},
					{
						text: 'Link Kopieren',
						disabled: true,
						onClick: function() {
								window.clipboardData.setData('Text', data.fullurl);
								app.addNotification({
									hold: 1000,
									title: 'BS WebApp',
									message: 'Link kopiert!',
									closeIcon: false,
									closeOnClick: true
								});
							}
					}
				];
			}else {
				var buttons = [
					{
						text: 'Was soll ich machen?',
						label: true
					},
					{
						text: '<a href="'+ data.fullurl +'" target="_blank" class="external item-link">&Ouml;ffnen in Safari</a>',
						bold: true
					},
					{
						text: 'Link Kopieren',
						disabled: true,
						onClick: function() {
								window.clipboardData.setData('Text', data.fullurl);
								app.addNotification({
									hold: 1000,
									title: 'BS WebApp',
									message: 'Link kopiert!',
									closeIcon: false,
									closeOnClick: true
								});
							}
					}
				];
			}
			
			var cancel = [
				{
					text: 'Abbrechen',
					color: 'red'
				}
			];
			
			var groups = [buttons, cancel];
			app.actions(groups);
		}else {
			window.open(data.fullurl);
		}
	});
}

// Vivo Video
function getVivoVideo(url) {
	$$.get('http://pixelartdev.github.io/BS-WebApp/cors.php?id&url='+url, function(data) {
		var timestamp;
		var hash; // = url.substring(url.lastIndexOf('/') + 1);
		
		var html = new DOMParser().parseFromString(data, 'text/html');		
		var inputs = html.getElementsByTagName('input');
        for (i = 0; i < inputs.length; i++) {
            if (inputs[i].name == 'hash') {
                hash = inputs[i].value;
				console.log(hash);
            }else if (inputs[i].name == 'timestamp') {
				timestamp = inputs[i].value;
				console.log(timestamp); 
            } 
        }
		
		app.showPreloader('Countdown');
		setTimeout(function() {
			$$.post('http://pixelartdev.github.io/BS-WebApp/cors.php?id&url='+url, 'hash='+hash+'&timestamp='+timestamp, function(res) {
				console.log('weiter gehts');
				var html = new DOMParser().parseFromString(res, 'text/html');
				var divs = html.getElementsByTagName('div');
				for (i = 0; i < divs.length; i++) {
					if (divs[i].getAttribute('class') == 'stream-content') {
						var video = divs[i].getAttribute('data-url');
						console.log(video);
						app.hidePreloader();
						playVideo(video);				
					} 
				} 
			});
		}, 7100);
		
	});
}

/* Streamcloud Video
function getStreamcloudVideo(url) {
	$$.get('http://pixelartdev.github.io/BS-WebApp/cors.php?id&url='+url, function(data) {
		var fname;
		var id;
		
		var html = new DOMParser().parseFromString(data, 'text/html');
		var inputs = html.getElementsByTagName('input');
        for (i = 0; i < inputs.length; i++) {
			console.log('inside loop');
            if (inputs[i].name == 'fname') {
                fname = inputs[i].value;
				console.log(fname);
            }else if (inputs[i].name == 'id') {
				id = inputs[i].value;
				console.log(id);
            }
		}
		
		app.showPreloader('Countdown');
		setTimeout(function() {
			$$.post('http://pixelartdev.github.io/BS-WebApp/cors.php?&url='+url, 'id='+id+'&fname='+fname+'&imhuman=Weiter zum Video&op=download1&usr_login&hash', function(res) {
				var html = new DOMParser().parseFromString(res, 'text/html');
				var s = html.getElementsByTagName('script');
				console.log(res);
				for (i = 0; i < s.length; i++) {
					if (String(s[i]).match('file: ".*?",')) {
						var video = String(s[i]).match('file: ".*?",');
						console.log(video);
						app.hidePreloader();
						playVideo(video);				
					} 
				}
			});
		}, 10100);
		
	});
} */

function playVideo(url) {
	var popupHTML = '<div class="popup">'+
                    '<div class="content-block">'+
                      '<video width="100%" controls> <source src="http://pixelartdev.github.io/BS-WebApp/cors.php?id&url='+url+'">Kein Video support!</video>'+
                      '<br><p><a href="#" class="button button-fill close-popup">Schlie&szlig;en</a></p>'+
                    '</div>'+
                  '</div>'
	app.popup(popupHTML);
}


// delete from fav list
function deleteFav(id) {
	app.showPreloader();
	var session = loggedIn();
	if(session != false) {
		var ids = [ ];
		$$.getJSON('http://bs.to/api/user/series/?s='+session, function(data) {
			for(var i=0; i<data.length; i++) {
				ids.push(data[i].id);
			}
			
			if(ids.length == 1) {
				ids[0] = "";
			}else {
				var index = ids.indexOf(id);
				if (index > -1) {
					ids.splice(index, 1);
				}
			}
			
			$$.get('http://bs.to/api/user/series/set/'+ ids.toString() +'?s='+session, function() {
				app.hidePreloader();
				window.location.reload();
			});
			
		});
	}else {
		app.hidePreloader();
		notLogged();
	}
}


// add to favs
function addFav(id) {
	app.showPreloader();
	var session = loggedIn();
	if(session != false) {
		$$.getJSON('http://bs.to/api/user/series/?s='+session, function(data) {
			var ids = [ ];
			for(var i=0; i<data.length; i++) {
				ids.push(parseInt(data[i].id));
			}
			
			if(!ids.contains(id)) {
				ids.push(parseInt(id));
			}
			
			$$.get('http://bs.to/api/user/series/set/'+ ids.toString() +'/?s='+session);
			app.hidePreloader();
			app.alert('Zu Favoriten hinzugef&uuml;gt!', 'Favorisiert');
		});
	}else {
		app.hidePreloader();
		notLogged();
	}
}


function notLogged() {
	ok = function() {
			mainView.router.loadPage('login.html');
		};
	cancel = function() {
			mainView.router.back();
		};
	app.confirm('Logge dich bitte zuerst ein', 'Fehler!', ok, cancel);
}


function loggedIn() {
	if(localStorage['logged'] == 1) {
		return localStorage['session'];
	}else {
		return false;
	}
}


function arrayToString(arr) {
	if(arr.length > 1 && arr != 'Unbekannt') {
		var str = '';
		for(var i=0; i<arr.length; i++) {
			str += arr[i]+', ';
		}
		return str;
		
	}else if(arr == 'Unbekannt') {
		return arr;
		
	}else {
		return arr[0];
	}
}


function checkString(str) {
	if(str == 'undefined' || typeof str === 'undefined' || str == null) {
		return 'Unbekannt';
	}else {
		return str;
	}
}


function logout() {
	$$.getJSON('http://bs.to/api/logout/?s='+localStorage['session'], function(data) {
		if(data.logout == true) {
			localStorage['logged'] = 0;
			localStorage['username'] = '';
			localStorage['session'] = '';
			app.alert('Du hast dich erfolgreich ausgeloggt!', 'Logout erfolgreich', function() {
				window.location.reload(true);
			});
		}else {
			app.alert('Dein Logout war nicht erfolgreich!', 'Logout fehlgeschlagen');
		}
	});
}


// unwatch episode
function unwatchIt(uri) {
	app.showPreloader();
	var session = loggedIn();
		
	$$.getJSON('http://bs.to/api/'+uri, function(d) {
		
		$$.getJSON('http://bs.to/api/unwatch/'+ d.epi.id +'/?s='+session, function(d) {
			app.hidePreloader();
			if(d.success) {
				app.alert('Als ungesehen makiert', 'Erfolgreich!', function() {
					window.location.reload(true);
				});
			}else {
				app.alert('Es ist ein Problem aufgetreten', 'Fehler!');
			}	
		});	
	});
}


// watch episode
function watchIt(uri) {
	app.showPreloader();
	var session = loggedIn();
		
	$$.getJSON('http://bs.to/api/'+uri, function(d) {
		
		$$.get('http://bs.to/api/watch/'+ d.links[0].id +'/?s='+session, function(d) {
			app.hidePreloader();
			if(d.length > 0) {
				app.alert('Als gesehen makiert', 'Erfolgreich!', function() {
					window.location.reload(true);
				});
			}else {
				app.alert('Es ist ein Problem aufgetreten', 'Fehler!');
			}	
		});	
	});
}


// Analytics
function analytics() {
	if(app.device.webView) {
		_gaq.push(['_trackEvent', 'Devices', 'Homescreen', 'Ja']);
	}else {
		_gaq.push(['_trackEvent', 'Devices', 'Homescreen', 'Nein']);
	}
	
	_gaq.push(['_trackEvent', 'Allgemein', 'Starts', 'App Starts', localStorage['starts'] ]);
}





















