<?php

namespace NoppaCRA;

Class NoppaDatabase {
	
	public static function getCourse($id) {
		$db = new \SQLite3('../scrape/noppa.sql');
		$query = 'SELECT * FROM kurssi WHERE id=' . intval($id) . ' ORDER BY koodi DESC';
		$results = $db->query($query);
		$results = $results->fetchArray();
		$db = NULL;
		return $results;
	}
	
	public static function getCourses($sort, $limit, $offset) {
		switch ($sort) {
			case 'id':
				$sort = 'id';
				break;
			case 'name':
				$sort = 'nimi';
				break;
			case 'credits':
				$sort = 'laajuus';
				break;
			case 'period':
				$sort = 'periodi';
				break;	
			default:
				$sort = 'koodi';
		}
		$db = new \SQLite3('../scrape/noppa.sql');
		$query = 'SELECT * FROM kurssi ORDER BY ' . $sort . ' DESC LIMIT ' . intval($offset) . ',' . intval($limit);
		$results = $db->query($query);
		$final = array();
		while ($row = $results->fetchArray()) {
			array_push($final, $row);
		}
		$db = NULL;
		return $final;
	}
	
	public static function getUserCourses($active) {
		if (TestUser::isAuthenticated()) {
			$results = array();
			$db = new \SQLite3('../scrape/noppa.sql');
			$query = 'SELECT * FROM omat_kurssit WHERE henkilo_id=' . intval(TestUser::getID()) . ' AND aktiivinen=' . intval($active);
			$courses = $db->query($query);

			while ($row = $courses->fetchArray()) {
				$query = 'SELECT * FROM kurssi WHERE id=' . intval($row['kurssi_id']);
				$temp = $db->query($query)->fetchArray();

				$results[] = $temp;
			}

			$final = array();
			
			$db = NULL;
			return $results;
		} else {
			return false;
		}
	}
	
	public static function getCourseRecommendations($sort, $limit, $offset, $filters) {
		switch ($sort) {
			case 'id':
				$sort = 'id';
				break;
			case 'name':
				$sort = 'nimi';
				break;
			case 'credits':
				$sort = 'laajuus';
				break;
			case 'period':
				$sort = 'periodi';
				break;	
			default:
				$sort = 'koodi';
		}
		$db = new \SQLite3('../scrape/noppa.sql');
		$query = 'SELECT * FROM kurssi ORDER BY ' . $sort . ' DESC LIMIT ' . intval($offset) . ',' . intval($limit);
		$results = $db->query($query);
		$final = array();
		while ($row = $results->fetchArray()) {
			array_push($final, $row);
		}
		$db = NULL;
		return $final;
	}
	
	public static function getCourseReviews($id) {
		$db = new \SQLite3('../scrape/noppa.sql');
		$query = 'SELECT * FROM arviot WHERE kurssi_id=' . intval($id);
		$results = $db->query($query);
		$final = array();
		while ($row = $results->fetchArray()) {
			array_push($final, $row);
		}
		$db = NULL;
		return $final;
	}
	
	public static function getUserCourseReview($id) {
		if (TestUser::isAuthenticated()) {
			$results = array();
			$db = new \SQLite3('../scrape/noppa.sql');
			$query = 'SELECT * FROM arviot WHERE henkilo_id=' . intval(TestUser::getID()) . ' AND kurssi_id=' . intval($id);
			$review = $db->query($query);
			$results = $review->fetchArray();
			$db = NULL;
			return $review;
		} else {
			return false;
		}
	}
	
	public static function getCourseRating($id) {
		$db = new \SQLite3('../scrape/noppa.sql');
		$query = 'SELECT * FROM arviot WHERE kurssi_id=' . intval($id);
		$reviews = $db->query($query);
		$final = array();
		while ($row = $reviews->fetchArray()) {
			array_push($final, $row);
		}
		$db = NULL;
		$count = 0; $sum = 0;
		foreach ($final as $review) {
			$sum += $review['arvio'];
			$count++;
		}
		if ($count != 0) {
			return $sum / $count;
		} else {
			return 0;
		}
	}

}

?>
