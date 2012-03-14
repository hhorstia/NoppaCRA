<?php

namespace NoppaCRA;

Class HttpApi {
	
	public static function getCourseRating($cid) {
		return rand(0, 5);
	}
	
	public static function resolve($method) {
		$response = array("method" => "", "valid" => 0);
		
		if (isset($method)) {
			
			$response["method"] = $method;
			$response["valid"] = 1;
			
			switch ($method) {
				case "getCourseRating":
					if (isset($_POST["id"])) {
						$response["id"] = $_POST["id"];
						$response["value"] = HttpApi::getCourseRating($_POST["id"]);
					} else {
						$response["valid"] = 0;
					}
					break;
				default:
					$response["valid"] = 0;
			}
		}
		
		return json_encode($response);
	}
	
}

?>
