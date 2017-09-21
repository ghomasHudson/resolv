var keywordApp = angular.module('keywordApp',[]);


var BASE_URL = "http://localhost:8080"

keywordApp.controller('404keywordController', function($scope,$window) {
  var url = new URL($window.location);
  $scope.requestedKeyword  = url.searchParams.get("q");
});

keywordApp.controller('addKeywordController', function($scope,$http) {

	$scope.newKeyword = {
		"keyword":"",
		"url":"",
		"localStorage":false
	}

	$scope.submitKeyword = function(){
		$http.post(BASE_URL+"/keyword",$scope.newKeyword).then(
			function successCallback(response) {
				$scope.state = 1;
				$scope.newKeyword = {};
			}, function errorCallback(response) {
				$scope.state = 2;
			});
		}
});