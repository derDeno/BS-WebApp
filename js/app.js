var app = new Framework7({
	cache: true,
	cacheIgnore: ['single-staffel.html'],
	cacheIgnoreGetParameters: false,
	swipePanel: 'left',
	pushState: true,
	scrollTopOnStatusbarClick: true,
	init: false,
	swipeBack: true,
	uniqueHistory: true,
	modalButtonCancel: 'Abrechen',
	modalPreloaderTitle: 'Lade ..',
	onAjaxStart: function(xhr) {
        app.showPreloader();
    },
    onAjaxComplete: function(xhr) {
        app.hidePreloader();
    },
	
});

var $$ = Dom7;
var mainView = app.addView('.view-main', {dynamicNavbar: true});
var favId = null;
var unwatchId = null;
var watchId = null;
analytics();

if(loggedIn() != false) {
	$$('body').find('.welcome').append(' '+localStorage['username']);
}else {
	$$('body').find('.logouter').hide();	
}

if(localStorage['last-save'] == 'on') {
	if(window.location != localStorage['last-url']) {
		window.location.href = localStorage['last-url'];
		window.location.reload();
	}
}

/** ALLE SERIEN **/
app.onPageInit('series-list', function(page) {	
	app.showPreloader();
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Alle Serien']);
	
	if(localStorage['last-save'] == 'on') {
		localStorage['last-url'] = window.location;
	}
	
	// SHOW LIST
	var loadAllSeries = function() {
		var data = JSON.parse( localStorage.getItem("all-data") );
		data = eval(data);
		
		vList = app.virtualList($$(page.container).find('.virtual-list'), {
			items: data,
			renderItem: function (index, item) {
				return '<li class="swipeout">' +
							'<a href="single.html?id='+ item.id +'" class="item-link item-content swipeout-content">' +
								'<div class="item-inner">' +
									'<div class="item-title">' + item.series + '</div>' +
								'</div>' +
							'</a>' +
							'<div class="swipeout-actions-right">' +
								'<a href="#" class="fav swipeout-close bg-blue" id="'+item.id+'" onClick="favIdIs(this.id)" >' +
									'<i class="icon icon-heart"></i>' +
								'</a>' +
							'</div>' +
					   '</li>';
			},
			searchAll: function (query, items) {
				var foundItems = [];
				for (var i = 0; i < items.length; i++) {
					if (items[i].series.toLowerCase().indexOf(query.trim().toLowerCase()) >= 0) foundItems.push(i);
				}
				return foundItems; 
			},
			
		});
		
		app.searchbar('.searchbar', {
    		searchList: '.list-block-search',
    		searchIn: '.item-title'
		});
		
		app.hidePreloader();
	}
	
	
	// DOWNLOAD AND SAVE
	if(localStorage.getItem("all-first") != 1) {
		var url = 'http://bs.to/api/series';
			
		$$.get(url, function(data) {
			localStorage.setItem("all-data", JSON.stringify(data));
			localStorage.setItem("all-first", 1);
			loadAllSeries();
		});
		
		localStorage['logged'] = 0;
		localStorage['session'] = '';
		localStorage['username'] = '';
		localStorage['starts'] = 0;
	}else {
		loadAllSeries();
		var starts = localStorage['starts'];
		starts++;
		localStorage['starts'] = starts;
	}
	
	
	// ADD TO FAV
	$$(document).on('click', '.fav', function () {
		addFav(favId);
	});
	
	
	// Logout pressed
	$$('body').find('.logouter').on('click', function () {
		logout();
		_gaq.push(['_trackEvent', 'Klicks', 'Menu', 'Logout']);
	});
	
	
	// LoggedIn ?
	if(loggedIn() != false) {
		$$('body').find('.loginer').hide();
		$$('body').find('.logouter').show();
		$$('body').find('.fav-menu').show();
		app.sizeNavbars('.view-main');
	}else {
		$$('body').find('.loginer').show();
		$$('body').find('.logouter').hide();
		$$('body').find('.fav-menu').hide();
		app.sizeNavbars('.view-main');
	}
	
	// Pull to refresh
	var ptrContent = $$('.pull-to-refresh-content');
	ptrContent.on('refresh', function () {
		localStorage['all-first'] = 1;
		app.pullToRefreshDone();
		window.location.reload(true);
	});
	
	// we are offline
	if(window.navigator.onLine == false) {
		_gaq.push(['_trackEvent', 'Allgemein', 'Device', 'Offline']);
		app.addNotification({
			hold: 1500,
			title: 'BS WebApp',
			message: 'Offline',
			closeIcon: false,
			closeOnClick: true
		});
		app.alert('Link kopiert!', 'BS WebApp');
	}else {
		_gaq.push(['_trackEvent', 'Allgemein', 'Device', 'Online']);
	}
});

app.init();


/** LOGIN **/
app.onPageInit('login-screen', function (page) {
	app.params.swipePanel= false;
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Login']);
	
	$$('.button-fill').on('click', function () {
		app.showPreloader();
		
    	var us = $$(page.container).find('input[name="username"]').val();
    	var pw = $$(page.container).find('input[name="password"]').val();
		var login = {login: {user: us, pass: pw}};
		
		$.post('http://bs.to/api/login/', login, function(data) {
  			if(typeof data.session !== 'undefined') {
				localStorage['session'] = data.session;
				localStorage['username'] = data.user;
				localStorage['logged'] = 1;
				
				$$('body').find('.welcome').append(' '+localStorage['username']);
				
				mainView.router.back();
				app.alert('Du hast dich erfolgreich eingeloggt!', 'Login erfolgreich', function() {
					window.location.reload(true);
				});
				
			}else {
				var error = '<p class="list-block-label color-red">'+ data.error +'</p>';
				$$(page.container).find('.inside-login').append(error);
				localStorage['logged'] = 0;
			}
			
			app.hidePreloader();
		});
	});
});


/** SERIE **/
app.onPageInit('serie', function(page) {
	app.showPreloader();
	app.params.swipePanel= false;
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Serie']);
	
	if(localStorage['last-save'] == 'on') {
		localStorage['last-url'] = window.location;
	}
	
	var url = 'http://bs.to/api/series/'+page.query.id+'/1';
	var outVid = '<div class="list-block ">';
	var outInfo = '<div class="content-block">';
	
	$$.getJSON(url, function(data) {
		_gaq.push(['_trackEvent', 'Serien', 'Serie', data.series.series]);
		outVid += '	<ul>';
		
		// STAFFELN
		for(var i=0; i < data.series.seasons; i++) {
			i = i+1;
			outVid += ' 	<li>';
			outVid += ' 		<a href="single-staffel.html?id='+page.query.id+'&staffel='+i+'" class="item-content item-link" >';
			outVid += ' 			<div class="item-inner">';
			outVid += ' 				<div class="item-title">Staffel '+i+'</div>';
			outVid += ' 			</div>';
			outVid += ' 		</a>';
			outVid += ' 	</li>';
			
			i = i-1;
		}
		
		outVid += ' </ul>';
		outVid += '</div>';
		
	
		// INFO
		var cover 		= 'http://s.bs.to/img/cover/'+page.query.id+'.jpg';
		var start 		= checkString(data.series.start);
		var end 		= checkString(data.series.end);
		var genre_main 	= checkString(data.series.data.genre_main);
		var genres		= arrayToString( checkString(data.series.data.genre) );
		var actors 		= arrayToString( checkString(data.series.data.actor) );
		var directors 	= arrayToString( checkString(data.series.data.director) );
		var authors 	= arrayToString( checkString(data.series.data.author) );
		var producer 	= arrayToString( checkString(data.series.data.producer) );
		
		if(genres == 'Unbekannt') {
			genres = '';	
		}else {
			genre_main += ',';	
		}
		
		outInfo += '	<img src="'+ cover +'" width="auto" />';
		outInfo += '  <div class="content-block-title">Beschreibung</div>';
		outInfo += '  <div class="content-block-inner">';
		outInfo += '    <p>'+ data.series.description +'</p>';
		outInfo += '  </div>';
		outInfo += '</div>';
		outInfo += '  <div class="content-block-title">Info</div>';
		outInfo += '  <div class="list-block media-list">';
		outInfo += ' 	<ul>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Genres</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text"><b>'+genre_main+'</b> '+ genres +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Produktionsjahre</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text">'+ start+' - '+ end +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Hauptdarsteller</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text">'+ actors +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Regisseure</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text">'+ directors +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Autoren</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text">'+ authors +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 		<li class="item-content">';
		outInfo += ' 			<div class="item-inner">';
		outInfo += ' 				<div class="item-title-row">';
		outInfo += ' 					<div class="item-title">Produzenten</div>';
		outInfo += ' 				</div>';
		outInfo += ' 				<div class="item-text">'+ producer +'</div>';
		outInfo += ' 			</div>';
		outInfo += ' 		</li>';
		
		outInfo += ' 	</ul>';
		outInfo += ' </div>';
		outInfo += '</div>';		
		
		
	//	$$('body').find('.navbar-on-center  .center').text(data.series.series);
		$$(page.container).find('.tab1').append(outVid);
		$$(page.container).find('.tab2').append(outInfo);
		$$(page.container).find('.content-block').find('a').addClass('external');
		
		app.sizeNavbars(page.container);
		app.hidePreloader();
	});
	
});


/** STAFFEL **/
app.onPageInit('staffel', function(page) {
	app.showPreloader();
	app.params.swipePanel= false;
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Staffel']);
	
	if(localStorage['last-save'] == 'on') {
		localStorage['last-url'] = window.location;
	}
	
	var id = page.query.id;
	var staffel = page.query.staffel;
	var url = 'http://bs.to/api/series/'+id+'/'+staffel+'?s='+localStorage['session'];
	
	$$.getJSON(url, function(data) {
		var out = '<div class="list-block media-list">';
		
		if(loggedIn() != false) {
			out += '	<ul>';
			
			for(var i=0; i < data.epi.length; i++) {
				var watched = data.epi[i].watched;
				
				out += ' 	<li class="swipeout">';
				out += ' 		<a href="single-episode.html?id='+id+'&staffel='+staffel+'&folge='+data.epi[i].epi+'" class="swipeout-content item-content item-link" >';
				if(watched == 'true' || watched == true) {
					out += '			<div class="item-media bg-green space-5"><i class="icon icon-watch"></i></div>';
					out += ' 			<div class="item-inner">';
					out += '				<div class="item-title-row">';
					out += ' 					<div class="item-title">'+ data.epi[i].german +'</div>';
					out += '				</div>';	
					out += '				<div class="item-subtitle">'+ data.epi[i].english +'</div>';
					out += ' 			</div>';
					out += ' 		</a>';
					out += '		<div class="swipeout-actions-right">';
					out += '			<a href="#" class="unwatchIt bg-red" onClick="javascript:unwatchIdIs(\'series/'+ id+'/'+staffel+'/'+data.epi[i].epi +'\')">';
					out += '				<i class="icon icon-unwatch"></i>';
					out += '			</a>';
				}else {
					out += '			<div class="item-media bg-gray space-5"><i class="icon icon-unwatch"></i></div>';
					out += ' 			<div class="item-inner">';
					out += '				<div class="item-title-row">';
					out += ' 					<div class="item-title">'+ data.epi[i].german +'</div>';
					out += '				</div>';	
					out += '				<div class="item-subtitle">'+ data.epi[i].english +'</div>';
					out += ' 			</div>';
					out += ' 		</a>';
					out += '		<div class="swipeout-actions-right">';
					out += '			<a href="#" class="watchIt bg-green" onClick="javascript:watchIdIs(\'series/'+ id+'/'+staffel+'/'+data.epi[i].epi +'\')" >';
					out += ' 				<i class="icon icon-watch"></i>';
					out += '			</a>';
				}
				
    			out += '		</div>';
				out += ' 	</li>';
				
			}
		}else {
			out += '	<ul>';
			
			for(var i=0; i<data.epi.length; i++) {
				out += ' 	<li>';
				out += ' 		<a href="single-episode.html?id='+id+'&staffel='+staffel+'&folge='+data.epi[i].epi+'" class="item-content item-link" >';
				out += ' 			<div class="item-inner">';
				out += '				<div class="item-title-row">';
				out += ' 					<div class="item-title">'+ data.epi[i].german +'</div>';
				out += '				</div>';	
				out += '				<div class="item-subtitle">'+ data.epi[i].english +'</div>';
				out += ' 			</div>';
				out += ' 		</a>';
				out += ' 	</li>';
				
			}
		}
		
		out += ' </ul>';
		out += '</div>';
		
	//	$$('body').find('.navbar-on-center  .center').append('Staffel '+staffel);
		$$(page.container).find('.page-content').append(out);
		
		app.sizeNavbars('.view-main');
		app.hidePreloader();
	});
	
	$$(document).on('click', '.watchIt', function () {
		watchIt(watchId);
	});
	
	$$(document).on('click', '.unwatchIt', function () {
		unwatchIt(unwatchId);
	});
	
});


/** EPISODE **/
app.onPageInit('episode', function(page) {
	app.showPreloader();
	app.params.swipePanel= false;
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Episode']);
	
	if(localStorage['last-save'] == 'on') {
		localStorage['last-url'] = window.location;
	}
	
	var id = page.query.id;
	var staffel = page.query.staffel;
	var folge = page.query.folge;
	var url = 'http://bs.to/api/series/'+id+'/'+staffel+'/'+folge+'?s='+localStorage['session'];
	var out = '<div class="content-block">';
	
	$$.getJSON(url, function(data) {
		if(data.epi.description.length > 0) {
			out += '  <div class="content-block-title">Beschreibung</div>';
			out += '  <div class="content-block-inner">';
			out += '    <p>'+ data.epi.description +'</p>';
			out += '  </div>';
		}
		
		out += '</div>';
		out += '  <div class="content-block-title">Links</div>';
		out += '  <div class="list-block">';
		out += ' 	<ul>';
		
		for(var i=0; i< data.links.length; i++) {
			out += '		<li>';
			out += ' 			<a href="javascript: hostLink('+ data.links[i].id +');"  class="item-link item-content external">';
			out += ' 				<div class="item-inner">';
			out += ' 					<div class="item-title-row">';
			out += ' 						<div class="item-title">'+ data.links[i].hoster +'</div>';
			out += '						<div class="item-subtitle">Part '+ data.links[i].part +'</div>';
			out += ' 					</div>';
			out += ' 				</div>';
			out += ' 			</a>';
			out += ' 		</li>';
		}
		
		out += ' 	</ul>';
		out += ' </div>';
		
		
		$$(page.container).find('.page-content').append(out);
		app.hidePreloader();
	});
	
});


/** FAVORITEN **/
app.onPageInit('favoriten', function(page) {
	app.showPreloader();
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Favoriten']);
	var session = loggedIn();

	
	if(localStorage['last-save'] == 'on') {
		localStorage['last-url'] = window.location;
	}
	
	$$.getJSON('http://bs.to/api/user/series/?s='+session, function (data) {
		var out = '<div class="list-block ">';
		out += '	<ul>';
		
		for(var i=0; i<data.length; i++) {
			out += ' 	<li class="swipeout">';
			out += ' 		<a href="single.html?id='+data[i].id+'" class="item-content item-link swipeout-content" >';
			out += ' 			<div class="item-inner">';
			out += ' 				<div class="item-title">'+data[i].series+'</div>';
			out += ' 			</div>';
			out += ' 		</a>';
			out += '		<div class="swipeout-actions-right">';
			out += '			<a href="#" class="remove bg-red" id="'+data[i].id+'" onClick="javascript: favIdIs(this.id)">';
			out += '				<i class="icon icon-delete"></i>';
			out += '			</a>';
			out += '		</div>';
			out += ' 	</li>';
		}
		
		out += ' </ul>';
		out += '</div>';
		
		$$(page.container).find('.page-content').append(out);
		app.hidePreloader();
	});
	
	$$(document).on('click', '.remove', function () {
		deleteFav(favId);
		_gaq.push(['_trackEvent', 'Klicks', 'Action', 'Favorit entfernen']);
	});
	
	
	// Pull to refresh
	$$('.pull-to-refresh-content').on('refresh', function () {
		app.pullToRefreshDone();
		location.reload();
	});
	
});


/** EINSTELLUNGEN **/
app.onPageInit('settings', function(page) {
	_gaq.push(['_trackEvent', 'Seiten', 'Seite', 'Einstellungen']);
	if(loggedIn() != false) {
		$$(page.container).find('.logout-container').hide();
	}else {
		$$(page.container).find('.logout-container').show();	
	}
	
	if(localStorage['last-save'] == 'on') {
		$$('.last').prop('checked', true);
		localStorage['last-url'] = window.location;
	}
	
	// logout pressed
	$$('.logout').on('click', function () {
		logout();
	});
	
	// last save pressed
	$$('.last').on('click', function () {
		console.log( $$('.last:checked').val() );
		localStorage['last-save'] = $$('.last:checked').val();
		localStorage['last-url'] = window.location;
		_gaq.push(['_trackEvent', 'Klicks', 'Setting', 'Last Save']);
	});
	
});


/** Funktionen **/
function favIdIs(id) {
	favId = id;
	_gaq.push(['_trackEvent', 'Klicks', 'Action', 'Favorisieren']);
}

function watchIdIs(id) {
	watchId = id;
	_gaq.push(['_trackEvent', 'Klicks', 'Action', 'Gesehen makieren']);
}

function unwatchIdIs(id) {
	unwatchId = id;
	_gaq.push(['_trackEvent', 'Klicks', 'Action', 'Ungesehen makieren']);
}

// Pull to refresh
var ptrContent = $$('.pull-to-refresh-content');
ptrContent.on('refresh', function () {
	app.pullToRefreshDone();
	window.location.reload(true);
});
