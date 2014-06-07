angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $translate) {
    storage = window.localStorage;
    var settings = storage.getItem("settings");
    $scope.settings = (settings !== null) ? JSON.parse(settings) : {}    

    // Set defaults
    $scope.settings.lang = typeof $scope.settings.lang !== 'undefined' ? $scope.settings.lang : {code: 'en'};        
    
    $translate.use($scope.settings.lang.code);

    $scope.duration = function(dur, type){
        return moment.duration(dur, type).humanize();
    }

})

.controller('TrackCtrl', function($scope, trackRepository){
    moment.lang($scope.settings.lang.code);
    // Start count function
    $scope.startCount = function(){
        if(!$scope.track.pause){
            $scope.track.startTime = Date.now();
            $scope.track.id = undefined;     
        }
        $scope.track.pause = false;
        $scope.clock.start();        
    }

    $scope.pauseCount = function(callback){
        $scope.clock.pause();
        $scope.track.endTime = Date.now();
        $scope.track.pause = true;
        $scope.track.timeInterval = $scope.clock.getTime();        
        if($scope.track.id === undefined){
            trackRepository.save($scope.track, callback);
            return;
        }

        trackRepository.update($scope.track, callback);

    }

    $scope.stopCount = function(){                
        $scope.clock.pause();
        $scope.track.endTime = Date.now();
        $scope.track.pause = false;
        $scope.track.timeInterval = $scope.clock.getTime();
        $scope.clock.stop();

        if($scope.track.id === undefined){
            trackRepository.save($scope.track);                       
            
        }else{
            trackRepository.update($scope.track);
        }

        $scope.last = $scope.track;
    }

    $scope.selectBreast = function(breast){        
        $scope.track.breast = breast.charAt(1).toUpperCase();
        $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
        $scope[breast] = "button button-balanced";
    }

    $scope.goBackground = function(){         
        if(!($scope.clock.getTime() > 0)){            
            return;
        }
        
        if(!$scope.track.pause){            
            $scope.pauseCount(function(){
                $scope.track.pause = false;                                
                storage.setItem("timer", JSON.stringify($scope.track));            
            });
            return;
        }
        
        storage.setItem("timer", JSON.stringify($scope.track));
    }

    restoreBackground = function(){         
        timer = storage.getItem("timer");
        storage.removeItem("timer");        
        if(timer === null)
            return;
        
        $scope.track = JSON.parse(timer);
        currtiming = $scope.track.timeInterval*1000;
        currdate = new Date();
        
        if(!$scope.track.pause){
            currtiming += (currdate.getTime() - $scope.track.endTime);
        }
        
        if('clock' in $scope){            
            $scope.clock.setTime(currtiming, true);
        }else{            
            $scope.clock = $('.your-clock').tinytimer(currtiming);
        }
        
        if(!$scope.track.pause){            
            $scope.clock.start();
        }

        getLastTrack(1);        
    }

    getLastTrack = function(row){        
        row = typeof row !== 'undefined' ? row : 0;
        trackRepository.getLastTrack($scope.last, function(){            
            switch ($scope.last.breast){
                case 'L':
                    $scope.selectBreast('blc');
                    break;
                case 'R':
                    $scope.selectBreast('brc');
                    break;
                case 'B':
                    $scope.selectBreast('bbc');
                    break;
                default:
                    break;
            } 
            
        },
        row);
    }

    $scope.switchLastRel = function(){
        $scope.lastRelative = $scope.lastRelative ? false : true;
    }

    // Listen view change event and store progress.
    $scope.$on('$locationChangeStart', function(event) {        
        $scope.goBackground();
        document.removeEventListener("pause", $scope.goBackground, false);
        document.removeEventListener("resume", restoreBackground, false);
    });

    document.addEventListener("pause", $scope.goBackground, false);
    document.addEventListener("resume", restoreBackground, false);

    $scope.last = {};
    $scope.lastRelative = true;
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
    var testtimer = storage.getItem("timer");    
    if(storage.getItem("timer")){
        restoreBackground();
    }
    else{
        // Init timer.
        $scope.clock = $('.your-clock').tinytimer(0, true);

        // track object
        $scope.track = {};
        $scope.track.pause = false;
        $scope.track.breast = "L";
        $scope.track.id = undefined;
        getLastTrack();
    }

    
})

.controller('HistoryCtrl', function($scope, trackRepository, $location, $ionicActionSheet, $ionicGesture, $ionicPopup, $translate){    
    moment.lang($scope.settings.lang.code);
    $scope.limit = 0;
    $scope.tracks = [];   
    $scope.moreDataCanBeLoaded = true;
    $scope.edit = true;

    $scope.confirmDelete = function(id){        
        var confirmPopup = $ionicPopup.confirm({
            title: $scope.translations.DeleteItem,
            template: $scope.translations.ConfirmDelete
        });

        confirmPopup.then(function(res){
            if(res){
                trackRepository.deleteTrack(id, function(){
                    $scope.getItems(0   );
                });
            } else {
                return true;
            }

        });
    }

    $scope.translations = {
            'Edit' : 'Edit',
            'Delete' : 'Delete',
            'EditRecord' : 'Edit record',
            'Cancel' : 'Cancel',
            'DeleteItem' : 'Delete item',
            'ConfirmDelete' : 'Confirm delete'
        }
        
    $translate('Edit').then(function(tran){
        $scope.translations.Edit = tran;
    })
    $translate('EditRecord').then(function(tran){        
        $scope.translations.EditRecord = tran;
    })
    $translate('Delete').then(function(tran){
        $scope.translations.Delete = tran;
    })
    $translate('Cancel').then(function(tran){
        $scope.translations.Cancel = tran;
    })
    $translate('DeleteItem').then(function(tran){
        $scope.translations.DeleteItem = tran;
    })
    $translate('ConfirmDelete').then(function(tran){
        $scope.translations.ConfirmDelete = tran;
    })


    // Triggered on item hold
    $scope.showActions = function(id) {
        // Show the action sheet
        $ionicActionSheet.show({
        buttons: [            
            { text: $scope.translations['Edit'] },
        ],
        destructiveText: $scope.translations['Delete'],
        titleText: $scope.translations['Edit record'],
        cancelText: $scope.translations['Cancel'],
        cancel: function(){
            return true;
        },
        destructiveButtonClicked: function() {
            $scope.confirmDelete(id);
            return true;
        },
        buttonClicked: function(index){
            switch(index){
                case 0:
                    $location.path( "/app/track/edit/"+id );
                    return true;               
                default:
                    return true;
            }
        }
        });
    };

    $scope.trackSelected = {};
    $scope.trackSelected.Id = undefined;
    $scope.tracks = [];


    var timer = storage.getItem("timer");
    var lastitem = 0;
    var lasttrack = {};
    $scope.maxitems = 0;
    $scope.currlen = 0;
    $scope.days = [];
    if(timer === null)
        lastitem = 1;

    trackRepository.countTracks(function(len){
        $scope.maxitems = len;
        trackRepository.getLastTrack(lasttrack, function(){            
            $scope.startdate = new Date(lasttrack.endTime);
            $scope.startdate.setHours(0, 0, 0, 0); 
            $scope.enddate = new Date();            
            // Get 2 days.
            $scope.getItems(0);
        }, lastitem);
    });    

    $scope.getItems = function(increase){         
        if(increase > 0){
            $scope.enddate = new Date($scope.startdate.getTime());
            $scope.startdate.setDate($scope.startdate.getDate() - increase);
            $scope.startdate.setHours(0,0,0,0);

        }        
        
        trackRepository.getTracksByDay($scope.startdate, $scope.enddate, function(results){                        
            var len = results.rows.length;            
            if(len == 0)
                return $scope.getItems(1);
            $scope.currlen += len;
            $scope.days[$scope.days.length] = [];            
            for(i=0; i<len; i++){                
                $scope.days[$scope.days.length-1].push(results.rows.item(i));
            }
            if ($scope.currlen >= $scope.maxitems)
                $scope.moreDataCanBeLoaded = false;            
            $scope.$broadcast('scroll.infiniteScrollComplete');
            $scope.$apply();            
        });
    }    

    $scope.getTotalFeed = function(arr){
        len = arr.length;
        total = 0;
        for(i=0;i<len;i++)
            total+=arr[i].timeInterval;

        return moment.duration(total, 'seconds').humanize();
    }
    
    var elements = angular.element(document.querySelector('.track-item'));

})

.controller('EditTrackCtrl', function($scope, $translate, $stateParams, $filter, $location, trackRepository){
    moment.lang($scope.settings.lang.code);
    $scope.track = {};
    trackRepository.get($stateParams.id, $scope.track, function(){
        $scope.date = moment($scope.track.startTime).format('D MMMM YYYY');

        $scope.startTime = function(){
            return moment($scope.track.startTime).format('h:mm a');
        }

        $scope.endTime = function(){
            return moment($scope.track.startTime + $scope.track.timeInterval*1000).format('h:mm a');
        }

        Object.defineProperty($scope, 'interval', {
            get: function() {            
                return parseInt($filter('number')($scope.track.timeInterval/60, '0'));
            },
            set: function(val){
                $scope.track.timeInterval = val*60;
                trackRepository.update($scope.track);
            }
        });

        $scope.$watch("interval");

        $scope.returnHistory = function(){        
            $location.path("/app/history");        
        }

        $scope.$apply();
    });
    
    

})

.controller('AddTrackCtrl', function($scope, $filter, $location, trackRepository){
    $scope.track = {
        'startTime' : undefined,
        'endTime': undefined,
        'timeInterval': undefined,
        'bbc': undefined,
        'breast': 'L'
    };
    $scope.trackDate = new Date();
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
    
    $scope.selectBreast = function(breast){        
        $scope.track.breast = breast.charAt(1).toUpperCase();
        $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
        $scope[breast] = "button button-balanced";
    }

    Object.defineProperty($scope, 'trackDateStr', {
        get: function() {                        
            return $filter("date")($scope.trackDate, 'yyyy-MM-dd');
        },
        set: function(val){      
            $scope.trackDate = new Date(moment(val, 'YYYY-MM-DD').valueOf());
            $scope.startModified($scope.endTime);
            $scope.endModified($scope.startTime);
        }
    });

    $scope.startTime = moment(new Date()).format('HH:mm');
    $scope.endTime = moment(new Date()).format('HH:mm');
    $scope.track.timeInterval = ($scope.track.endTime - $scope.track.startTime)/1000; 
    $scope.track.endTime = new Date().getTime();
    $scope.track.startTime = new Date().getTime();
    $scope.intervalTime = $scope.track.timeInterval

    $scope.timeInterval = function(){
        return $scope.startTime.getTime() - $scope.endTime.getTime();
    }
    
    $scope.startModified = function(val){        
        $scope.track.startTime = new Date(moment($scope.trackDateStr + " " + val, 'YYYY-MM-DD HH:mm').valueOf()).getTime();
        $scope.track.timeInterval = ($scope.track.endTime - $scope.track.startTime)/1000;
        $scope.intervalTime = Math.floor($scope.track.timeInterval/60);
    }

    $scope.endModified = function(val){        
        $scope.track.endTime = new Date(moment($scope.trackDateStr + " " + val, 'YYYY-MM-DD HH:mm').valueOf()).getTime();
        $scope.track.timeInterval = ($scope.track.endTime - $scope.track.startTime)/1000;                
        $scope.intervalTime = Math.floor($scope.track.timeInterval/60);
    }

    $scope.intervalCheck = function(){
        if(!$scope.intervalTime || !$scope.track.breast || $scope.intervalTime <=0)
            return true;        
        return false;
    }

    $scope.saveTrack = function(){
        trackRepository.save($scope.track, function(){
            $scope.$apply(function(){
                $location.path("/app/history")}
                );
        });
    }
})

.controller('SettingsCtrl', function($rootScope, $scope, $translate){
    $scope.languages = [
        {code: 'es', text: 'lang_es'},
        {code: 'en', text: 'lang_en'},
        {code: 'ca', text: 'lang_ca'}
    ];

    $scope.setLanguage = function(){
        storage.setItem("settings", JSON.stringify($scope.settings));        
        $translate.use($scope.settings.lang.code)
    }
})