<?php
header('Content-Type: text/cache-manifest');
$filesToCache = array(
    './favorite.html',
	'./index.html',
	'./login.html',
	'./settings.html',
	'./settings-info.html',
	'./single.html',
	'./single-episode.html',
	'./single-staffel.html',
	
	'./css/app.css',
	'./css/f7.min.css',
	
	'./js/app.js',
	'./js/function.js',
	'./js/f7.min.js',
	'./js/f7.min.js.map',
	
	'./favicon.ico',
	'./img/delete.png',
	'./img/heart.png',
	'./img/list.png',
	'./img/menu.png',
	'./img/settings.png',
	'./img/unwatch-b.png',
	'./img/unwatch.png',
	'./img/watch-b.png',
	'./img/watch.png',
	'./img/ios/Icon-60@2x.png',
	'./img/ios/Icon-60@3x.png',
	'./img/ios/Icon-76.png',
	'./img/ios/Icon-76@2x.png',
	'./img/ios/Icon-Small@2x.png'	
);
?>
CACHE MANIFEST

CACHE:
<?php

$hashes = '';
foreach($filesToCache as $file) {
    echo $file."\n";
    $hashes.=md5_file($file);
};
?>

NETWORK:
*

# Hash Version: <?=md5($hashes)?>