<?php 

error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "Adding own courses to the database...<br />";

$txt_list = "AS-84.1132 AS-0.3301 AS-0.1101 AS-0.1103 T-61.2010 T-61.2020 T-111.4360 Kie-98.1601 Kie-98.1600 T-86.5141 Kie-98.2011 Kie-98.2012 Kie-98.2021 Tfy-3.1540 T-76.3601 T-121.2100 T-110.1100 AS-75.1102 TIK.kand KE-35.9700 TU-53.1030 AS-75.1124 T-75.1124 T-75.5100 Kie-98.1113 Mat-1.1120 Mat-1.1131 Mat-1.1132 AS-75.1107 T-111.2350 T-106.1240 T-106.1208 Kie-98.6031 Kie-98.6032 AS-75.2500 T-76.1143 T-106.1223 TU-22.1101 Inf-0.3101 T-75.2122 T-111.4310 T-75.5300";

$course_code_array = explode(' ', $txt_list);

$db = new \SQLite3('../../noppa_scrape/noppa.sql');

foreach ($course_code_array as $code) {
	$query = "SELECT id FROM kurssi WHERE koodi = '$code'";
	$results = $db->query($query);
	$row = $results->fetchArray();
	
	$course_id = $row['id'];

	echo "$code - $course_id<br/>";

	if ($course_id != '') {
		$query = "INSERT INTO omat_kurssit (henkilo_id, kurssi_id, vanha, aktiivinen)
			VALUES (1, $course_id, 1, 1)";
		$db->query($query);
	}
}

echo "Finished.";

?>

