// MyChat App - Ionic & Firebase Demo

function onDeviceReady() {
    angular.bootstrap(document, ["iamsam"]);
}
//console.log("binding device ready");
// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// 'iamsam.services' is found in services.js
// 'iamsam.controllers' is found in controllers.js
angular.module('iamsam', ['ionic','angularMoment', 'iamsam.services', 'iamsam.controllers','firebase'])

.run(function ($ionicPlatform, $rootScope, $location, Auth, $ionicLoading) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        // To Resolve Bug
        ionic.Platform.fullScreen();

        //$rootScope.firebaseUrl = firebaseUrl;
        //$rootScope.displayName = null;

        Auth.$onAuthStateChanged(function (user) {
            if (user) {
                console.log("Logged in as:", user.uid);
            } else {
                console.log("Logged out");
                $ionicLoading.hide();
                $location.path('/login');
            }
        });

        $rootScope.logout = function () {
            firebase.database().ref('groups/' + $rootScope.groupCode + '/groupMembers/'+ $rootScope.userId+'/isOnline').set("offline");
            console.log("Logging out from the app");
            $ionicLoading.show({
                template: 'Logging Out...'
            });
            Auth.$signOut();
        }


        $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
            // We can catch the error thrown when the $requireAuth promise is rejected
            // and redirect the user back to the home page
            if (error === "AUTH_REQUIRED") {
                $location.path("/login");
            }
        });
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    console.log("setting config");
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // State to represent Login View
    .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl',
    })


    .state('mainPage', {
        url: '/mainPage',
        templateUrl: 'templates/mainPage.html',
        controller: 'mainPageCtrl',
      })

      .state('expense', {
      url: '/expense',
      templateUrl: 'templates/expense.html',
      controller: 'expenseCtrl'
    })

    .state('groupChat', {
      url: '/groupChat',
      templateUrl: 'templates/groupChat.html',
      controller: 'groupChatCtrl'
    })

    .state('shoppingList', {
      url: '/shoppingList',
      templateUrl: 'templates/shoppingList.html',
      controller: 'shoppingListCtrl'
    })

    .state('carPooling', {
      url: '/carPooling',
      templateUrl: 'templates/carPooling.html',
      controller: 'carPoolingCtrl'
    })

    .state('poolStatus', {
      url: '/poolStatus',
      templateUrl: 'templates/poolStatus.html',
      controller: 'poolStatusCtrl'
    })

    .state('poolStatus2', {
      url: '/poolStatus2',
      templateUrl: 'templates/poolStatus2.html',
      controller: 'poolStatus2Ctrl'
    })

    .state('choreChart', {
      url: '/choreChart',
      templateUrl: 'templates/choreChart.html',
      controller: 'choreChartCtrl'
    })

    .state('navigationSideBar', {
      url: '/navigation',
      templateUrl: 'templates/navigationSideBar.html',
      controller: 'navigationSideBarCtrl'
    })

    .state('personalInfo', {
      url: '/personalInfo',
      templateUrl: 'templates/personalInfo.html',
      controller: 'personalInfoCtrl'
    })

    .state('addChore', {
      url: '/addChore',
      templateUrl: 'templates/addChore.html',
      controller: 'addChoreCtrl'
    })

    .state('addExpense', {
      url: '/addExpense',
      templateUrl: 'templates/addExpense.html',
      controller: 'addExpenseCtrl'
    })

    .state('changeExpense', {
      url: '/changeExpense',
      templateUrl: 'templates/changeExpense.html',
      controller: 'changeExpenseCtrl'
    })
    .state('viewExpense', {
      url: '/viewExpense',
      templateUrl: 'templates/viewExpense.html',
      controller: 'viewExpenseCtrl'
    })


    .state('makePayment', {
      url: '/makePayment',
      templateUrl: 'templates/makePayment.html',
      controller: 'makePaymentCtrl'
    })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});
