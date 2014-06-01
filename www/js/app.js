// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'pascalprecht.translate', 'timeRelative', 'starter.controllers', 'starter.services', 'starter.directives'])

.run(function($ionicPlatform) {

  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();            
    }

    if(window.plugins){
      window.plugin.backgroundMode.enable();
      window.plugins.insomnia.keepAwake();
    }

  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.track', {
      url: "/track",
      views: {
        'menuContent' :{
          templateUrl: "templates/track.html",
          controller: 'TrackCtrl'
        }
      }
    })

    .state('app.history', {
      url: "/history",
      views: {
        'menuContent' :{
          templateUrl: "templates/history.html",
          controller: 'HistoryCtrl'
        }
      }
    })
    
    .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.html",
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('app.editTrack',{
      url: "/track/edit/:id",
      views:{
        'menuContent' :{
          templateUrl: "templates/editTrack.html",
          controller: 'EditTrackCtrl'
        }
      }
    })

    .state('app.addTrack',{
      url: "/track/add",
      views:{
        'menuContent' :{
          templateUrl: "templates/addTrack.html",
          controller: 'AddTrackCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/track');
})
.config(function($translateProvider){
  $translateProvider.translations('es', translations_es);
  $translateProvider.translations('en', translations_en);
  $translateProvider.translations('ca', translations_ca);
  $translateProvider.preferredLanguage('en');
});