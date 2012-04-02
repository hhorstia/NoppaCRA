<?php

error_reporting(E_ALL);
//ini_set('display_errors', '1');

require_once('TestDatabase.php');
require_once('NoppaDatabase.php');
require_once('TestUser.php');
require_once('HttpApi.php');

NoppaCRA\TestDatabase::init();
exit(NoppaCRA\HttpApi::resolve($_POST["method"]));

?>
