<?php

namespace NoppaCRA;

Class TestDatabase {

	public static function init() {
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$db->queryexec("CREATE TABLE IF NOT EXISTS kayttaja (id INTEGER PRIMARY KEY, opiskelijanumero TEXT UNIQUE NOT NULL, kayttajatunnus TEXT, etunimi TEXT NOT NULL, sukunimi TEXT NOT NULL, sahkopostiosoite TEXT, aktiivinen INTEGER NOT NULL)");
		$db->queryexec("CREATE TABLE IF NOT EXISTS kurssi (id INTEGER PRIMARY KEY, koodi TEXT UNIQUE NOT NULL, nimi TEXT NOT NULL, laajuus TEXT, sisalto TEXT, periodi TEXT, aktiivinen INTEGER NOT NULL)");
		$db->queryexec("CREATE TABLE IF NOT EXISTS omat_kurssit (id INTEGER PRIMARY KEY, henkilo_id INTEGER NOT NULL, kurssi_id INTEGER NOT NULL, vanha INTEGER NOT NULL, aktiivinen INTEGER NOT NULL, CONSTRAINT x UNIQUE (henkilo_id, kurssi_id))");
		$db->queryexec("CREATE TABLE IF NOT EXISTS arviot (id INTEGER PRIMARY KEY, henkilo_id INTEGER NOT NULL, kurssi_id INTEGER NOT NULL, arvio INTEGER NOT NULL, kommentti TEXT, CONSTRAINT x UNIQUE (henkilo_id, kurssi_id))");
		
		//$db->queryexec("INSERT INTO kayttaja (opiskelijanumero, kayttajatunnus, etunimi, sukunimi, aktiivinen) VALUES ('12345A', 'jdoe', 'John', 'Doe', 1);");
		
		//$db->queryexec("INSERT INTO kurssi (koodi, nimi, laajuus, sisalto, periodi, aktiivinen) VALUES ('T-111.5360', 'WWW Applications P', '4', 'The course description.', 'III - IV', 1);".
		//			   "INSERT INTO kurssi (koodi, nimi, laajuus, sisalto, periodi, aktiivinen) VALUES ('T-106.4300', 'Web Software Development', '3-6', 'The course description.', 'II - III', 0); ".
		//			   "INSERT INTO kurssi (koodi, nimi, laajuus, sisalto, periodi, aktiivinen) VALUES ('T-75.4300', 'Semanttinen web L', '4', 'The course description.', 'III - IV', 1);");
					   
		//$db->queryexec("INSERT INTO omat_kurssit (henkilo_id, kurssi_id, vanha, aktiivinen) VALUES (1, 1, 0, 1);");
		//$db->queryexec("INSERT INTO omat_kurssit (henkilo_id, kurssi_id, vanha, aktiivinen) VALUES (1, 2, 1, 0);");
		//$db->queryexec("INSERT INTO omat_kurssit (henkilo_id, kurssi_id, vanha, aktiivinen) VALUES (1, 3, 0, 1);");
		/*
		$db->queryexec("INSERT INTO arviot (henkilo_id, kurssi_id, arvio, kommentti) VALUES (1, 2, 4, 'OK.');");
		$db = NULL;
		*/
	}
	
	public static function getCourse($id) {
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$query = 'SELECT * FROM kurssi WHERE id=' . intval($id) . ' ORDER BY koodi DESC';
		$results = $db->arrayQuery($query, SQLITE_ASSOC);
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
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$query = 'SELECT * FROM kurssi ORDER BY ' . $sort . ' DESC LIMIT ' . intval($offset) . ',' . intval($limit);
		$results = $db->arrayQuery($query, SQLITE_ASSOC);
		$db = NULL;
		return $results;
	}
	
	public static function getUserCourses($active) {
		if (TestUser::isAuthenticated()) {
			$results = array();
			$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
			$query = 'SELECT * FROM omat_kurssit WHERE henkilo_id=' . intval(TestUser::getID()) . ' AND aktiivinen=' . intval($active);
			$courses = $db->arrayQuery($query, SQLITE_ASSOC);
			foreach ($courses as $course) {
				$query = 'SELECT * FROM kurssi WHERE id=' . intval($course['kurssi_id']);
				$temp = $db->arrayQuery($query, SQLITE_ASSOC);
				if ($temp[0]) array_push($results, $temp[0]);
			}
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
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$query = 'SELECT * FROM kurssi ORDER BY ' . $sort . ' DESC LIMIT ' . intval($offset) . ',' . intval($limit);
		$results = $db->arrayQuery($query, SQLITE_ASSOC);
		$db = NULL;
		return $results;
	}
	
	public static function getCourseReviews($id) {
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$query = 'SELECT * FROM arviot WHERE kurssi_id=' . intval($id);
		$results = $db->arrayQuery($query, SQLITE_ASSOC);
		$db = NULL;
		return $results;
	}
	
	public static function getUserCourseReview($id) {
		if (TestUser::isAuthenticated()) {
			$results = array();
			$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
			$query = 'SELECT * FROM arviot WHERE henkilo_id=' . intval(TestUser::getID()) . ' AND kurssi_id=' . intval($id);
			$review = $db->arrayQuery($query, SQLITE_ASSOC);
			$db = NULL;
			return $review;
		} else {
			return false;
		}
	}
	
	public static function getCourseRating($id) {
		$db = new \SQLiteDatabase('../db/NoppaCRA.sqlite', 0666);
		$query = 'SELECT * FROM arviot WHERE kurssi_id=' . intval($id);
		$reviews = $db->arrayQuery($query, SQLITE_ASSOC);
		$db = NULL;
		$count = 0; $sum = 0;
		foreach ($reviews as $review) {
			$sum += $review['arvio'];
			$count++;
		}
		return $sum / $count;
	}

}

?>
