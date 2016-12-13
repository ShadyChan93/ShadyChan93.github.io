angular.module('iamsam.controllers', ['firebase'])

.controller('LoginCtrl', function ($scope,$ionicPopup,$ionicModal, $state, $firebaseAuth, $ionicLoading, $rootScope) {
    //console.log('Login Controller Initialized');
    var database = firebase.database();
    var auth = $firebaseAuth();

    $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.createUser = function (user) {
        console.log("Create User Function called");
        if (user && user.email && user.password && user.displayname && user.groupcode) {
            $ionicLoading.show({
                template: 'Signing Up...'
            });
            var email = user.email;
            var password =user.password;
            var groupCode = user.groupcode;
            var displayName = user.displayname;
            var xgroupOwner = false;

            // create group
            var ref = firebase.database().ref("groups/" + groupCode);
            ref.once("value")
            .then(function(snapshot) {
              var a = snapshot.exists();  // check if groupCode exists
              if(a){
                var ref = firebase.database().ref('groups/'+ groupCode);
                ref.once("value")
                .then(function(snapshot) {
                var quantity = parseInt(snapshot.child("groupQuantity").val());
                if(quantity>=8){
                  alert("This group is full!");
                }
                else{
                  var confirmPopup = $ionicPopup.confirm({
                    title: 'Group code exists',
                     template: 'There is already a existing group of that code. Join it?'
                   });
                   confirmPopup.then(function(res) {
                     if(res) {
                       //create user for auth
                       firebase.auth().createUserWithEmailAndPassword(email, password)
                       .then(function () {
                       alert("User created successfully!");
                       userId = firebase.auth().currentUser.uid;
                       // create user in database
                       firebase.database().ref('users/'+ userId).set({
                           email: user.email,
                           displayName: user.displayname,
                           groupCode:user.groupcode,
                           groupOwner: xgroupOwner,
                           matric: 'New',
                           ic: 'New',
                       });

                         firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+'userName').set(displayName);
                         firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+'userID').set(userId);
                         firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+'isOnline').set("offline");
                         var ref = firebase.database().ref('groups/'+ groupCode);
                         ref.once("value")
                         .then(function(snapshot) {
                         var quantity = parseInt(snapshot.child("groupQuantity").val()) + 1;
                         console.log("member quantity : "  +quantity);
                         firebase.database().ref('groups/' + groupCode + '/groupQuantity').set(quantity);
                         });
                         console.log('Join as member');

                     });
                     }
                      else {
                       alert("Group already exists.You are inside the group but not as admin");
                       console.log('Not joining');
                     }
                   });
                 }
               });
              }
              else{
                var confirmPopup = $ionicPopup.confirm({
                    title: 'New group',
                   template: 'There is no existing group of that code. Create it?'
                 });
                 confirmPopup.then(function(res) {
                   if(res) {
                     //create user for auth
                     firebase.auth().createUserWithEmailAndPassword(email, password)
                     .then(function () {
                     alert("User created successfully!");
                     userId = firebase.auth().currentUser.uid;
                     xgroupOwner = true;
                     // create user in database
                     firebase.database().ref('users/'+ userId).set({
                         email: user.email,
                         displayName: user.displayname,
                         groupCode:user.groupcode,
                         groupOwner: xgroupOwner,
                         matric: 'New',
                         ic: 'New',
                     });
                     firebase.database().ref('groups/'+ groupCode).set({
                         groupQuantity: 1,
                         groupOwner: displayName
                     });
                     firebase.database().ref('groups/' + groupCode + '/groupQuantity').set(1);
                     firebase.database().ref('groups/' + groupCode + '/groupOwner').set(displayName);
                     firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+ 'userName').set(displayName);
                     firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+ 'userID').set(userId);
                     firebase.database().ref('groups/' + groupCode + '/groupMembers/'+ userId+'/'+ 'isOnline').set("offline");
                     console.log('Join as group admin');
                   });
                   } else {
                     alert("Group not exists. Decide not create new one.");
                     console.log('Not joining');
                   }
                 });
              }
            });
            $ionicLoading.hide();
            $scope.modal.hide();
        }
        else
            alert("Please fill all details");
    }

    $scope.signIn = function (user) {

        if (user && user.email && user.pwdForLogin) {
            $ionicLoading.show({
                template: 'Signing In...'
            });
            var email = user.email;
            var password = user.pwdForLogin;
            firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function (user) {
                  console.log("Logged in as:" + user.uid);
                  $rootScope.userId = user.uid;
                  var ref = firebase.database().ref("users/"+ user.uid);
                  ref.once("value")
                  .then(function(snapshot) {
                  $rootScope.groupCode = snapshot.child("groupCode").val();
                  $rootScope.displayName = snapshot.child("displayName").val();
                  firebase.database().ref('groups/'+ $rootScope.groupCode + '/groupMembers/'+ $rootScope.userId+'/isOnline').set("online");
                  var query = firebase.database().ref("groups/"+ $rootScope.groupCode);
                  query.once("value")
                  .then(function(snapshot) {
                  $rootScope.groupQuantity = snapshot.child("groupQuantity").val();
                  console.log("quantity:"+$rootScope.groupQuantity);
                });
                });
                  $ionicLoading.hide();
                  $state.go('mainPage');
              }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // [START_EXCLUDE]
          if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
          } else {
            alert(errorMessage);
          }
          console.log(error);
          $ionicLoading.hide();
        });
        } else
            alert("Please enter email and password both");
    }
})

.controller('mainPageCtrl', function ($scope,$ionicPopup, $state,$rootScope,$firebaseArray) {
    //console.log("Rooms Controller initialized");
        var today = moment().format('YYYY-MM-DD');
        console.log("today: "+today);
        var queryPoolCheckExist = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool').orderByKey();
        queryPoolCheckExist.once("value")
      .then(function(snapshot) {
        var a = snapshot.hasChildren();
        if(a){
          var queryPoolCheck = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool').orderByKey();
          queryPoolCheck.once("value")
        .then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            // key will be "ada" the first time and "alan" the second time
            var key = childSnapshot.key;
            // childData will be the actual contents of the child
            var childData = childSnapshot.val();
            var quantity = childData.poolQuantity;
            var pooldate = childData.poolDate;
            console.log('quantity :'+quantity);
            console.log('date :'+pooldate);
            if(quantity == 4){
              firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool/'+key+'/status').set("Full");
              var ref = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool/'+key);
              ref.once("value")
                .then(function(snapshot) {
                  var driverID = snapshot.child('driverId').val();
                  firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+driverID+'/pools/'+key+'/status').set("Full");
                });
                console.log("Change status to full");
            }

            if(moment(today).isAfter(pooldate,'days')||moment(today).isSame(pooldate,'days')){
              firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool/'+key+'/status').set("Expired");
              var ref = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool/'+key);
              ref.once("value")
                .then(function(snapshot) {
                  var driverID = snapshot.child('driverId').val();
                  firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+driverID+'/pools/'+key+'/status').set("Expired");
                  firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+driverID+'/currentPool').set(null);
                  console.log("Change status to expired");
                });
            }

        });
      });
        }

      });

    var ref = firebase.database().ref('groups/'+ $rootScope.groupCode +'/groupMembers');
    $scope.users = $firebaseArray(ref);

    var query = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/publicPool');
    $scope.pools =$firebaseArray(query);

    $scope.joinPool = function(index,pool){
      var confirmPopup = $ionicPopup.confirm({
     title: 'Join Car Pooling',
     template: 'Are you sure you want to join this car pooling?'
   });

   confirmPopup.then(function(res) {
     if(res) {
       console.log('You are sure');
       var ref = firebase.database().ref("carPooling/"+ $rootScope.groupCode +'/publicPool/'+pool.$id);
       ref.once("value")
       .then(function(snapshot) {
       var quantity = snapshot.child("poolQuantity").val();
       console.log("poolQuantity:"+quantity);
       if(quantity < 4){
         firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId +'/currentJoinedPool').set(pool.$id);
         firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+pool.$id+'/poolQuantity').set(quantity + 1);
         console.log("quantity :"+quantity);
         var ref = firebase.database().ref("carPooling/"+ $rootScope.groupCode +'/publicPool/'+pool.$id);
         ref.once("value")
         .then(function(snapshot) {
           var userId = snapshot.child("driverId").val();
           var newPostKey = firebase.database().ref().child('carPooling/'+ $rootScope.groupCode + '/publicPool/'+ pool.$id+'/passengerAll').push().key;
         firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+userId+'/pools/'+pool.$id +'/passengerAll/'+newPostKey+'/passengerName').set($rootScope.displayName);
       });
       }
       else{
         alert("Sorry buddy. Car is full.");
       }
     });
     } else {
       console.log('Car Pool join cancelled');

     }
   });
    }

})
.controller('navigationSideBarCtrl', function ($scope,$ionicPopup , $state,$rootScope,Auth,$firebaseArray) {
    //console.log("Rooms Controller initialized");
    $scope.removeUser = function(){
      var month = moment().format('YYYY-MM');
      var ref= firebase.database().ref("totalExpenses/"+ $rootScope.groupCode +'/'+month +'/'+$rootScope.userId);
      ref.once("value")
      .then(function(snapshot) {
      //var contribution = parseFloat(snapshot.child("userContribution").val());
      var balance = snapshot.child("userBalance").val();
      console.log("balance: "+balance);
      if(balance > 0){
        var alertPopup = $ionicPopup.alert({
     title: 'Alert Invalid Balance',
     template: 'You currently still owes to the group. Please ensure your balance is less than 0 for leaving group.'
   });
   alertPopup.then(function(res) {
     console.log('Remove user cancelled due to invalid balance');
   });
      }
      else{
        var confirmPopup = $ionicPopup.confirm({
     title: 'Leaving Group',
     template: 'Are you sure you want to leave group? The remaining balance the group owes you will not be returned for this month.'
   });

   confirmPopup.then(function(res) {
     if(res) {
       console.log('remove user:'+ $rootScope.userId);
       var query = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month);
       query.once("value")
         .then(function(snapshot) {
                currentExpense = parseFloat(snapshot.child("currentExpense").val().toFixed(2));
                userContribution = parseFloat(snapshot.child($rootScope.userId+'/userContribution').val());
                currentExpense = parseFloat((currentExpense - userContribution).toFixed(2));
                firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(currentExpense);
                console.log('Deduct totalExpenses success');
         });
         var queryRemovefromGroup = firebase.database().ref('groups/'+ $rootScope.groupCode +'/groupMembers');
         queryRemovefromGroup.child($rootScope.userId).remove();
         var queryRemovefromUser = firebase.database().ref('users');
         queryRemovefromUser.child($rootScope.userId).remove();
         var queryRemovefromTotalExpense = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode +'/'+month);
         queryRemovefromTotalExpense.child($rootScope.userId).remove();
         var queryDeductQuantity = firebase.database().ref('groups/'+ $rootScope.groupCode);
         query.once("value")
           .then(function(snapshot) {
                  var quantity = snapshot.child("groupQuantity").val()-1;
                  console.log('Quantity: '+quantity);
                  firebase.database().ref('groups/'+ $rootScope.groupCode +'/groupQuantity').set(quantity);
                  console.log('Deduct quantity success :'+quantity);
           });
       console.log('Delete expense success');
        var user = firebase.auth().currentUser;
        user.delete().then(function() {
          console.log('Delete user success');
        }, function(error) {
          console.log('Delete user failed');
        });
        alert("Remove user success");
     } else {
       console.log('Remove user cancelled by user');
     }
   });
      }
    });
    }
})

.controller('addChoreCtrl', function ($scope, $state,$rootScope,$firebaseArray,$ionicLoading) {
    //console.log("Rooms Controller initialized");
    var ref = firebase.database().ref('groups/'+ $rootScope.groupCode +'/groupMembers');
    $scope.users = $firebaseArray(ref);
    $scope.createChore = function (handler,choreName,day) {
        //var handlerNo = document.getElementById('handler').value;
        //var handler = $scope.users[handlerNo].userName;
        var handlerName = handler.userName;
        var handlerId = handler.userID;
        console.log("Add Chore Function called");
        console.log("handler: "+handlerName);
        console.log("choreName: "+choreName);
        console.log("day: "+day);
        if (handler && choreName && day) {
            $ionicLoading.show({
                template: 'Saving...'
            });

            var newPostKey = firebase.database().ref().child('chores/'+ $rootScope.groupCode + '/'+ day).push().key;
            firebase.database().ref('chores/'+ $rootScope.groupCode + '/'+ day + '/'+ newPostKey +'/choreName' ).set(choreName);
            firebase.database().ref('chores/'+ $rootScope.groupCode + '/'+ day + '/'+ newPostKey +'/handler' ).set(handlerName);
            firebase.database().ref('chores/'+ $rootScope.groupCode + '/'+ day + '/'+ newPostKey +'/handlerId' ).set(handlerId);

            alert("Done update!");
            $ionicLoading.hide();
            $state.go('choreChart');
        } else
            alert("Please fill all details");
            $ionicLoading.hide();

    }
})

.controller('addExpenseCtrl', function ($scope, $state,$ionicLoading,Auth,$rootScope) {
    //console.log("Rooms Controller initialized");

      $scope.createExpense = function () {
          console.log("Add Expense Function called");
          var addExpense_inputMonthYear = document.getElementById('addExpense-inputMonthYear').value;
          var addExpense_inputExpenseName = document.getElementById('addExpense-inputExpenseName').value;
          var addExpense_getinputExpenseAmount = parseFloat(document.getElementById('addExpense-inputExpenseAmount').value).toFixed(2);
          var addExpense_inputExpenseAmount = parseFloat(addExpense_getinputExpenseAmount);
          if (addExpense_inputMonthYear && addExpense_inputExpenseName && addExpense_inputExpenseAmount) {
              $ionicLoading.show({
                  template: 'Saving...'
              });

              var newPostKey = firebase.database().ref().child('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/'+ $rootScope.userId).push().key;
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/'+ $rootScope.userId + '/'+ newPostKey +'/expenseName' ).set(addExpense_inputExpenseName);
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/'+ $rootScope.userId + '/'+ newPostKey + '/expenseAmount' ).set(addExpense_inputExpenseAmount);
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/'+ $rootScope.userId + '/'+ newPostKey + '/expenseCreditor' ).set($rootScope.displayName);
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/publicExpense/'+ newPostKey +'/expenseName' ).set(addExpense_inputExpenseName);
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/publicExpense/'+ newPostKey + '/expenseAmount' ).set(addExpense_inputExpenseAmount);
              firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ addExpense_inputMonthYear + '/publicExpense/'+ newPostKey + '/expenseCreditor' ).set($rootScope.displayName);
              var query = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear);
              var userBalance;
              var currentExpense;
              var userContribution;
              var ref = firebase.database().ref("groups/"+ $rootScope.groupCode);
              ref.once("value")
              .then(function(snapshot) {
              $rootScope.groupQuantity = parseFloat((snapshot.child("groupQuantity").val()).toFixed(2));
            });

              query.once("value")
                .then(function(snapshot) {
                  var b = snapshot.child("currentExpense").exists();
                  var c = snapshot.child($rootScope.userId).exists();
                  console.log("currentExpense : "+b);
                  console.log("currentExpense : "+c);
                  if(b){
                    query.once("value")
                      .then(function(snapshot) {
                        currentExpense = parseFloat(snapshot.child("currentExpense").val().toFixed(2));
                        if(c){
                          query.once("value")
                            .then(function(snapshot) {

                              userContribution = parseFloat(snapshot.child($rootScope.userId+'/userContribution').val().toFixed(2));
                              userBalance = parseFloat(snapshot.child($rootScope.userId+'/userBalance').val().toFixed(2));
                              currentExpense = parseFloat((currentExpense + addExpense_inputExpenseAmount).toFixed(2));
                              userContribution = parseFloat((userContribution + addExpense_inputExpenseAmount).toFixed(2));
                              userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                              console.log("currentExpense :"+ currentExpense);
                              console.log("userBalance :"+ userBalance);
                              console.log("userContribution :"+ userContribution);
                              firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/currentExpense').set(currentExpense);
                              firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                              firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userBalance').set(userBalance);

                            });
                        }
                        else {
                          currentExpense = parseFloat((currentExpense + addExpense_inputExpenseAmount).toFixed(2));
                          userContribution = parseFloat((addExpense_inputExpenseAmount).toFixed(2));
                          userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                          firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/currentExpense').set(currentExpense);
                          firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                          firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userBalance').set(userBalance);

                        }

                      });
                    }
                    else{
                      currentExpense = parseFloat((addExpense_inputExpenseAmount).toFixed(2));
                      userContribution = parseFloat((addExpense_inputExpenseAmount).toFixed(2));
                      userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                      firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/currentExpense').set(currentExpense);
                      firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                      firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+addExpense_inputMonthYear+'/'+$rootScope.userId+'/userBalance').set(userBalance);
                    }
                });
              alert("Done update!");
              $ionicLoading.hide();
              $state.go('expense');
          } else
              alert("Please fill all details");
              $ionicLoading.hide();
            }
            //$scope.$apply();
})

.controller('changeExpenseCtrl', function ($scope, $ionicPopup, $state,$rootScope,$firebaseArray) {
    //console.log("Rooms Controller initialized");
    var listOfMonth= ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var today= moment().format("M")-1;
    var month = moment().format('YYYY-MM');
    console.log("month index : "+today);
    console.log("month format : "+month);

    $scope.month = listOfMonth[today];
    var ref = firebase.database().ref('expenses/'+ $rootScope.groupCode +'/'+month+'/'+$rootScope.userId);
    $scope.expenses = $firebaseArray(ref);

    $scope.removeExpense = function (index, expense) {
          // FIREBASE: REMOVE ITEM FROM LIST
          $ionicPopup.confirm({
             title: 'Delete Expense',
             template: 'Are you sure you want to delete this expense?'
           }).then(function(res) {
             if(res) {
               console.log('expense:'+expense);
               var query = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month);
               query.once("value")
                 .then(function(snapshot) {
                        currentExpense = parseFloat(snapshot.child("currentExpense").val().toFixed(2));
                        userContribution = parseFloat(snapshot.child($rootScope.userId+'/userContribution').val().toFixed(2));
                        userBalance = parseFloat(snapshot.child($rootScope.userId+'/userBalance').val().toFixed(2));
                        currentExpense = parseFloat((currentExpense - expense.expenseAmount).toFixed(2));
                        userContribution = parseFloat((userContribution - expense.expenseAmount).toFixed(2));
                        userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(currentExpense);
                        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userBalance').set(userBalance);
                        console.log('Deduct group expense success');
                 });
                 var query = firebase.database().ref('expenses/'+ $rootScope.groupCode +'/'+month+'/publicExpense');
                 query.child(expense.$id).remove();
                 $scope.expenses.$remove(expense);
               console.log('Delete expense success');
             } else {
               console.log('Delete expense cancelled');
             }
           });
         };
    //$scope.$apply();
})
.controller('viewExpenseCtrl', function ($scope, $state,$rootScope,$firebaseArray) {
    //console.log("Rooms Controller initialized");
    var listOfMonth= ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var today= moment().format("M")-1;
    var month = moment().format('YYYY-MM');
    $scope.month = listOfMonth[today];
    var ref = firebase.database().ref('expenses/'+ $rootScope.groupCode +'/'+month+'/publicExpense');
    $scope.expenses = $firebaseArray(ref);
    //$scope.$apply();
})


.controller('carPoolingCtrl', function ($scope,$ionicPopup, $state,$rootScope,$firebaseArray,$timeout) {
    //console.log("Rooms Controller initialized");
    $scope.maxDate = moment().add(7, 'd').format('YYYY-MM-DD');
    $scope.minDate = moment().format('YYYY-MM-DD');
    console.log("minDate:"+$scope.minDate);
    console.log("maxDate:"+$scope.maxDate);
    $scope.createPool =function(){
      var query = firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId);
      query.once("value")
        .then(function(snapshot) {
          if(snapshot.child("currentPool").exists()){
            alert("Sorry there is an ongoing car pooling.");
          }
          else{
            var today = document.getElementById('carPoolDate').value;
            var time = document.getElementById('carPoolTime').value;
            var newPostKey = firebase.database().ref().child('carPooling/'+ $rootScope.groupCode).push().key;
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/status').set('Available');
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/driverName').set($rootScope.displayName);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/driverId').set($rootScope.userId);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/poolQuantity').set(0);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/poolDate').set(today);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/publicPool/'+newPostKey +'/poolTime').set(time);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/status').set('Available');
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/driverName').set($rootScope.displayName);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/driverId').set($rootScope.userId);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/poolQuantity').set(0);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/poolDate').set(today);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId + '/pools/'+newPostKey +'/poolTime').set(time);
            firebase.database().ref('carPooling/'+ $rootScope.groupCode+'/'+$rootScope.userId +'/currentPool').set(newPostKey);
            console.log("Success create pool");
            alert("Posted to group!");
          }
        });
    }
})

.controller('poolStatusCtrl', function ($scope,$ionicPopup, $state,$rootScope,$firebaseArray,$timeout) {
    //console.log("Rooms Controller initialized");
    var query = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+$rootScope.userId);
    query.once("value")
      .then(function(snapshot) {
        var currentpool = snapshot.child('currentPool').val();
        console.log('currentpool :'+currentpool);
        var query1 = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+$rootScope.userId+'/pools/'+currentpool);
        query1.once("value")
          .then(function(snapshot) {
            $scope.poolTime = snapshot.child('poolTime').val();
            $scope.poolDate = snapshot.child('poolDate').val();
          });
        var ref = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+$rootScope.userId+'/pools/'+currentpool +'/passengerAll');
        $scope.passengers = $firebaseArray(ref);
        var ref = firebase.database().ref('carPooling/'+ $rootScope.groupCode +'/'+$rootScope.userId+'/pools');
        $scope.pools = $firebaseArray(ref);
      });
})


.controller('choreChartCtrl', function ($scope, $state,$rootScope,$firebaseArray,$timeout) {
    //console.log("Rooms Controller initialized");
    var weekDays= ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var today= moment().format("E")-1;
    console.log("today :" + today);
    $scope.todayDayOftheWeek = weekDays[today];
    var ref = firebase.database().ref('chores/'+ $rootScope.groupCode +'/'+$scope.todayDayOftheWeek);
    $scope.chores = $firebaseArray(ref);
    $scope.remove = function (chore) {
        $scope.chores.$remove(chore).then(function (ref) {
            ref.key === chore.$id; // true item has been removed
            console.log("chore deleted");
        });
      }

    $timeout(function(){
                    $scope.$apply();
                });

})

.controller('expenseCtrl', function ($scope, $state,$rootScope,$firebaseArray) {
    //console.log("Rooms Controller initialized");
    var month = moment().format('YYYY-MM');
    //check group exists
    var ref = firebase.database().ref('totalExpenses');
    ref.once("value")
    .then(function(snapshot) {
    if(snapshot.child($rootScope.groupCode+'/'+month).exists()){
      var ref = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month);
      ref.once("value")
      .then(function(snapshot) {
      $scope.currentExpense = parseFloat(snapshot.child("currentExpense").val().toFixed(2));
      console.log("current expense: " +$scope.currentExpense);
      if(snapshot.child($rootScope.userId).exists()){
        $scope.userContribution = snapshot.child($rootScope.userId).child("userContribution").val();
        $scope.userBalance = snapshot.child($rootScope.userId).child("userBalance").val();
        $scope.$apply();
      }
      else{
        var userBalance = parseFloat(($scope.currentExpense/$rootScope.groupQuantity).toFixed(2));
        console.log("quantity:" +$rootScope.groupQuantity);
        console.log("current expense: " +$scope.currentExpense);
        console.log("userBalance:" + userBalance);
        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userContribution').set(0);
        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userBalance').set(userBalance);
        $scope.userContribution = snapshot.child($rootScope.userId).child("userContribution").val();
        $scope.userBalance = snapshot.child($rootScope.userId).child("userBalance").val();
        $scope.$apply();
      }
      });
    }
    else{
        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(0);
        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userContribution').set(0);
        firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userBalance').set(0);
        $scope.currentExpense = snapshot.child($rootScope.groupCode+'/'+month).child("currentExpense").val();
        $scope.userContribution = snapshot.child($rootScope.groupCode+'/'+month).child($rootScope.userId).child("userContribution").val();
        $scope.userBalance = snapshot.child($rootScope.groupCode+'/'+month).child($rootScope.userId).child("userBalance").val();
        $scope.$apply();
    }
  });

})

.controller('groupChatCtrl', function ($scope, $state,Auth,$firebaseArray,$rootScope) {
    //console.log("Rooms Controller initialized");

        $scope.IM = {
            textMessage: ""
        };

          var ref = firebase.database().ref('chats/'+ $rootScope.groupCode);
          //var query = ref.orderByChild("timestamp").limitToLast(10);
          $scope.chats = $firebaseArray(ref);

        $scope.sendMessage = function (msg) {
            if ($rootScope.displayName && msg) {
                var newPostKey = firebase.database().ref().child('chats/'+ $rootScope.groupCode).push().key;
                firebase.database().ref('chats/'+$rootScope.groupCode+'/'+newPostKey).set({
                  sender: $rootScope.displayName,
                  msgContent: msg,
                  timestamp: firebase.database.ServerValue.TIMESTAMP
                }).then(function (data) {
                    console.log("message added");

            $scope.IM.textMessage = "";
              });
          }
        }
        $scope.remove = function (chat) {
            $scope.chats.$remove(chat).then(function (ref) {
                ref.key === chat.$id; // true item has been removed
                console.log("message deleted");
            });
          }
          //$scope.$apply();
})

.controller('makePaymentCtrl', function ($scope, $state,$rootScope,$firebaseArray) {
    //console.log("Rooms Controller initialized");
    var month = moment().format('YYYY-MM');
    var ref = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month);
    ref.once("value")
    .then(function(snapshot) {
    $scope.currentExpense = snapshot.child("currentExpense").val();
    if(snapshot.child($rootScope.userId).exists()){
      $scope.userContribution = snapshot.child($rootScope.userId).child("userContribution").val();
      $scope.userBalance = snapshot.child($rootScope.userId).child("userBalance").val();
    }
    else{
      firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userContribution').set(0);
      firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId +'/userBalance').set(parseFloat(snapshot.child("currentExpense").val().toFixed(2)));
      $scope.userContribution = snapshot.child($rootScope.userId).child("userContribution").val();
      $scope.userBalance = snapshot.child($rootScope.userId).child("userBalance").val();
    }
    $scope.$apply();
    });


})

.controller('personalInfoCtrl', function ($scope, $state,$rootScope,Auth,$ionicLoading) {
    //console.log("Rooms Controller initialized");
    //var database = firebase.database();
    Auth.$onAuthStateChanged(function(user) {
          // User is signed in.
          //console.log("can see this or not?" + uid);
          var ref = firebase.database().ref("users/"+ $rootScope.userId);
          ref.once("value")
          .then(function(snapshot) {
            var displayName = snapshot.child("displayName").val();
            var email = snapshot.child("email").val();
            var matric = snapshot.child("matric").val();
            var ic = snapshot.child("ic").val();
            var carplate = snapshot.child("carplate").val();
            $scope.user_displayName = displayName;
            $scope.user_email = email;
            $scope.user_matric = matric;
            $scope.user_ic = ic;
            $scope.user_carplate = carplate;
            $state.reload();
          });

      });
      $scope.updateUser = function () {
          console.log("Update User Function called");
          if ($scope.user_email && $scope.user_displayName && $scope.user_matric && $scope.user_ic) {
              $ionicLoading.show({
                  template: 'Updating...'
              });
              var userId = firebase.auth().currentUser.uid;
              var user_email = document.getElementById('user.email').value;
              var user_displayName = document.getElementById('user.displayName').value;
              var user_matric = document.getElementById('user.matric').value;
              var user_ic = document.getElementById('user.ic').value;
              var user_carplate = document.getElementById('user.carplate').value;
              firebase.database().ref('users/'+ userId + '/email').set(user_email);
              firebase.database().ref('users/'+ userId + '/displayName').set(user_displayName);
              firebase.database().ref('users/'+ userId + '/matric').set(user_matric);
              firebase.database().ref('users/'+ userId + '/ic').set(user_ic);
              firebase.database().ref('users/'+ userId + '/carplate').set(user_carplate);
              firebase.database().ref('groups/'+$rootScope.groupCode+'/groupMembers/'+userId+'/userName').set(user_displayName);
              alert("Done update!");
              $ionicLoading.hide();
          } else
              alert("Please fill all details");
              $ionicLoading.hide();

      }
  })

.controller('shoppingListCtrl', function ($scope ,$ionicPopup,$ionicLoading, $state,$firebaseArray,$rootScope) {
    //console.log("Rooms Controller initialized");
    // CREATE A FIREBASE REFERENCE
  var itemsRef = firebase.database().ref('shoppingList/'+ $rootScope.groupCode);
  // GET ITEMS AS AN ARRAY
  $scope.items = $firebaseArray(itemsRef);

  // ADD ITEM ITEM METHOD
  $scope.addItem = function () {

      // CREATE A UNIQUE ID
      var timestamp = new Date().valueOf();
      var getitemName = document.getElementById('itemName').value;
      $scope.items.$add({
          timeCreated: timestamp,
          itemName: getitemName,
          status: 'pending',
          creator: $rootScope.displayName,
          creatorID: $rootScope.userId,
          completedBy:'none'
      });
      document.getElementById('itemName').value = "";
      $scope.itemName = "";

  };

  // REMOVE TODO ITEM METHOD
  $scope.removeItem = function (index, item) {

      // CHECK THAT ITEM IS VALID
      if (item.timeCreated === undefined)return;
      var confirmPopup = $ionicPopup.confirm({
         title: 'Delete Item',
         template: 'Are you sure you want to delete this pending item?'
       });
       confirmPopup.then(function(res) {
         if(res) {
           $scope.items.$remove(item);
           console.log('Delete item success');
         } else {
           console.log('Delete item cancelled');
         }
       });

  };

  // MARK ITEM AS COMPLETE METHOD
  $scope.completeItem = function (index, item) {

      // CHECK THAT ITEM IS VALID
      if (item.timeCreated === undefined)return;

      $ionicPopup.show({
    template: '<input type="number" id="item_price" ng-model="item_price">',
    title: 'Enter Item Price',
    subTitle: 'This will be added in your contribution',
    scope: $scope,
    buttons: [
      { text: 'Cancel' },
      {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          var getexpenseAmount = parseFloat(document.getElementById('item_price').value).toFixed(2);
          var expenseAmount = parseFloat(getexpenseAmount);
          if (!getexpenseAmount) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
             var month = moment().format('YYYY-MM');
             var newPostKey = firebase.database().ref().child('expenses/'+ $rootScope.groupCode + '/'+ month + '/'+ $rootScope.userId).push().key;
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/'+ $rootScope.userId + '/'+ newPostKey +'/expenseName' ).set(item.itemName);
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/'+ $rootScope.userId + '/'+ newPostKey + '/expenseAmount' ).set(parseFloat(expenseAmount));
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/'+ $rootScope.userId + '/'+ newPostKey + '/expenseCreditor' ).set($rootScope.displayName);
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/publicExpense/'+ newPostKey +'/expenseName' ).set(item.itemName);
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/publicExpense/'+ newPostKey + '/expenseAmount' ).set(parseFloat(expenseAmount));
             firebase.database().ref('expenses/'+ $rootScope.groupCode + '/'+ month + '/publicExpense/'+ newPostKey + '/expenseCreditor' ).set($rootScope.displayName);
             var query = firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month);
             var userBalance;
             var currentExpense;
             var userContribution;
             var ref = firebase.database().ref("groups/"+ $rootScope.groupCode);
             ref.once("value")
             .then(function(snapshot) {
             $rootScope.groupQuantity = parseFloat((snapshot.child("groupQuantity").val()).toFixed(2));
           });
             query.once("value")
               .then(function(snapshot) {
                 var b = snapshot.child("currentExpense").exists();
                 var c = snapshot.child($rootScope.userId).exists();
                 if(b){
                   query.once("value")
                     .then(function(snapshot) {
                       currentExpense = parseFloat(snapshot.child("currentExpense").val().toFixed(2));
                       if(c){
                         query.once("value")
                           .then(function(snapshot) {

                             userContribution = parseFloat(snapshot.child($rootScope.userId+'/userContribution').val().toFixed(2));
                             userBalance = parseFloat(snapshot.child($rootScope.userId+'/userBalance').val().toFixed(2));
                             currentExpense = currentExpense + expenseAmount;
                             userContribution = userContribution + expenseAmount;
                             userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                             firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(currentExpense);
                             firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                             firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userBalance').set(userBalance);

                           });
                       }
                       else {
                         currentExpense = currentExpense +  parseFloat(expenseAmount);
                         userContribution =  parseFloat(expenseAmount);
                         userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                         firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(currentExpense);
                         firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                         firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userBalance').set(userBalance);

                       }

                     });
                   }
                   else{
                     currentExpense =  parseFloat(expenseAmount);
                     userContribution = parseFloat(expenseAmount);
                     userBalance = parseFloat(((currentExpense/$rootScope.groupQuantity) - userContribution).toFixed(2));
                     firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/currentExpense').set(currentExpense);
                     firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userContribution').set(userContribution);
                     firebase.database().ref('totalExpenses/'+ $rootScope.groupCode+'/'+month+'/'+$rootScope.userId+'/userBalance').set(userBalance);
                   }
                   // UPDATE STATUS TO COMPLETE AND SAVE
                   item.status = 'completed';
                   item.completedBy = $rootScope.displayName;
                   $scope.items.$save(item);
                 alert("Done update!");
               });

          }
        }
      }
    ]
  });
  };


})
