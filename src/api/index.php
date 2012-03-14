<?php

require_once('HttpApi.php');

exit(NoppaCRA\HttpApi::resolve($_POST["method"]));

?>
