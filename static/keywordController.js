var keywordApp = angular.module('keywordApp',[]);


var BASE_URL = "http://localhost:8080"

keywordApp.controller('404keywordController', function($scope,$window) {
  var url = new URL($window.location);
  $scope.requestedKeyword  = url.searchParams.get("q");
});


keywordApp.controller('lookupKeywordController',function($scope,$http){
	$scope.keywordLookup = "";
	$scope.results = null;
	$scope.$watch('keywordLookup', function () {
		if ($scope.keywordLookup.length > 0){
			$http.get(BASE_URL+"/keyword/"+$scope.keywordLookup).then(
				function successCallback(response) {
					$scope.results = response.data;
			}, function errorCallback(response) {
					$scope.results = null;
			})
		}
		else{
			$scope.results = null;
		}
	})
})

keywordApp.controller('recentKeywordController',function($scope,$http,$timeout){
	$scope.results = [];

	var countUp = function() {
        $http.get(BASE_URL+"/recent").then(
			function successCallback(response) {
				$scope.results = response.data;
		}, function errorCallback(response) {
				$scope.results = [];
		})
        $timeout(countUp, 5000);
    }

    $timeout(countUp, 0);

})

keywordApp.controller('addKeywordController', function($scope,$http,$window) {

	//Init variables
	$scope.newKeyword = {
		"keyword":"",
		"url":"",
		"localStorage":false
	}

	//Check if 404
	var url = new URL($window.location);
	var requestedKeyword  = url.searchParams.get("q");
	if (requestedKeyword != null){
		$scope.newKeyword.keyword = requestedKeyword;
		angular.element('#url').focus();

	}
	$scope.errorMsg = "";

	$scope.submitKeyword = function(){
		$http.post(BASE_URL+"/keyword",$scope.newKeyword).then(
			function successCallback(response) {
				$scope.state = 1;
				$scope.newKeyword = {};
			}, function errorCallback(response) {
				$scope.state = 2;
				$scope.errorMsg = response.data.error;
			});
		}
});