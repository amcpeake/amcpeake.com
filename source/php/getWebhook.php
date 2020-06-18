<?php
	$key = $_GET['key'];
	$json = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/source/config/webhooks.ignore.json"), true);

	if ($json && array_key_exists($key, $json)) {
		header('Content-Type: text/plain;charset=UTF-8');
		echo $json[$key];
	} else {
		http_response_code(400);
		die();
	}
?>
