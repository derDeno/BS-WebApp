<?php
header("Access-Control-Allow-Origin: *");

if(isset($_GET['url'])) {
	$url = $_GET['url'];

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

	if (isset($_POST)) {
		 curl_setopt($ch, CURLOPT_POST, true);
		 curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($_POST));
	}
	
	if(isset($_GET['host'])) {
		$url2 = substr($url, 0,strrpos($url, '/'));
		$header = array('Referer:'+$url,
			'Origin:'+$url2,
			'Host:'+remove_http($url2),
			'Accept-Encoding: gzip, deflate',
			'Accept-Language:de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4',
			'Cache-Control: no-cache',
			'Connection: keep-alive',
			'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
			'X-Requested-With:XMLHttpRequest'
		);
		
		curl_setopt($ch, CURLOPT_HTTPHEADER, $header);		
		curl_setopt($ch, CURLINFO_HEADER_OUT, true);
		curl_setopt($ch, CURLOPT_HEADER, true);
	}
	
	
	$data = curl_exec($ch);
	curl_close($ch);

	echo $data;
}

function remove_http($url) {
   $disallowed = array('http://', 'https://');
   foreach($disallowed as $d) {
      if(strpos($url, $d) === 0) {
         return str_replace($d, '', $url);
      }
   }
   return $url;
}
?>