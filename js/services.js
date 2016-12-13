angular.module('iamsam.services',['firebase'])
    .service('Auth', ['$firebaseAuth',
    function ($firebaseAuth) {
      var config = {
          apiKey: "AIzaSyCnmD46Y8UhtN-sWciVSydfG2ccqvwj_P8",
          authDomain: "iamsam-10ebd.firebaseapp.com",
          databaseURL: "https://iamsam-10ebd.firebaseio.com",
          storageBucket: "iamsam-10ebd.appspot.com",
          messagingSenderId: "35325513817"
        };
      firebase.initializeApp(config);
      return $firebaseAuth();
}])

;
