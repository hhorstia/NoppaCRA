<?php

namespace NoppaCRA;

Class HttpApi {
	
	public static function getCourse($id) {
		return TestDatabase::getCourse($id);
	}
	
	public static function getCourses($sort, $limit, $offset) {
		$value = array();
		$courses = TestDatabase::getCourses($sort, $limit, $offset);
		foreach ($courses as $course) {
			array_push($value, $course);
		}
		return $value;
	}
	
	public static function getUserCourses($active) {
		$value = array();
		$courses = TestDatabase::getUserCourses($active);
		foreach ($courses as $course) {
			array_push($value, $course);
		}
		return $value;
	}
	
	public static function getCourseRecommendations($sort, $limit, $offset, $filters) {
		$value = array();
		$courses = TestDatabase::getCourseRecommendations($sort, $limit, $offset);
		foreach ($courses as $course) {
			$course['arvio'] = TestDatabase::getCourseRating($course['id']);
			array_push($value, $course);
		}
		return $value;
	}
	
	public static function getCourseReviews($id) {
		$value = array();
		$reviews = TestDatabase::getCourseReviews($id);
		foreach ($reviews as $review) {
			array_push($value, $review);
		}
		return $value;
	}
	
	public static function getUserCourseReview($id) {
		return TestDatabase::getUserCourseReview($id);
	}
	
	public static function getCourseRating($id) {
		return TestDatabase::getCourseRating($id);
	}
	
	public static function resolve($method) {
		$response = array('method' => '', 'valid' => 0);
		
		if (isset($method)) {
			
			$response['method'] = $method;
			$response['valid'] = 1;
			
			switch ($method) {
				case 'getCourse':
					if (isset($_POST['id'])) {
						$response['id'] = $_POST['id'];
						$response['value'] = HttpApi::getCourse($response['id']);
					} else {
						$response['valid'] = 0;
					}
					break;
				case 'getCourses':
					$response['sort'] = $_POST['sort'] ? $_POST['sort'] : 'code';
					$response['limit'] = $_POST['limit'] ? $_POST['limit'] : 10;
					$response['offset'] = $_POST['offset'] ? $_POST['offset'] : 0;
					$response['value'] = HttpApi::getCourses($response['sort'], $response['limit'], $response['offset']);
					break;
				case 'getUserCourses':
					if (TestUser::isAuthenticated()) {
						$response['active'] = $_POST['active'] ? $_POST['active'] : 0;
						$response['value'] = HttpApi::getUserCourses($response['active']);
					} else {
						$response['valid'] = 0;
					}
					break;
				case 'getCourseRecommendations':
					$response['sort'] = $_POST['sort'] ? $_POST['sort'] : 'code';
					$response['limit'] = $_POST['limit'] ? $_POST['limit'] : 10;
					$response['offset'] = $_POST['offset'] ? $_POST['offset'] : 0;
					$response['value'] = HttpApi::getCourseRecommendations($response['sort'], $response['limit'], $response['offset'], $response['filters']);
					break;
				case 'getCourseReviews':
					if (isset($_POST['id'])) {
						$response['id'] = $_POST['id'];
						$response['value'] = HttpApi::getCourseReviews($response['id']);
					} else {
						$response['valid'] = 0;
					}
					break;
				case 'getUserCourseReview':
					if (isset($_POST['id'])) {
						$response['id'] = $_POST['id'];
						$response['value'] = HttpApi::getUserCourseReview($response['id']);
					} else {
						$response['valid'] = 0;
					}
					break;
				case 'getCourseRating':
					if (isset($_POST['id'])) {
						$response['id'] = $_POST['id'];
						$response['value'] = HttpApi::getCourseRating($response['id']);
					} else {
						$response['valid'] = 0;
					}
					break;
				default:
					$response['valid'] = 0;
			}
		}
		
		return json_encode($response);
	}
	
}

?>
