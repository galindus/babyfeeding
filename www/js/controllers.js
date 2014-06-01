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
    $scope.enableEdit = function(){
        $scope.edit = $scope.edit ? false : true;        
    }

    $scope.confirmDelete = function(id){        
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete item',
            template: 'Are you sure you want to delete this item?'
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
            'Edit record' : 'Edit record',
            'Cancel' : 'Cancel'
        }
        
    $translate('Edit').then(function(tran){
        $scope.translations.Edit = tran;
    })
    $translate('Edit record').then(function(tran){
        console.log(tran);
        $scope.translations['Edit record'] = tran;
    })
    $translate('Delete').then(function(tran){
        $scope.translations.Delete = tran;
    })
    $translate('Cancel').then(function(tran){
        $scope.translations.Cancel = tran;
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

    $scope.itemSelected = function(track) {
        $scope.trackSelected = track;
    }

    $scope.getItems = function(increase){        
        $scope.limit += increase;
        $scope.days = [];        
        $scope.tracks = [];        
        trackRepository.getTracksByDay($scope.limit, $scope.tracks, function(){ 
            console.log("limit", $scope.limit);
            var lent = $scope.tracks.length, lend = undefined, i;            
            for(i=0;i<lent;i++){
                if(lend == undefined){
                    $scope.days[0] = [];
                    $scope.days[0].push($scope.tracks[i]);
                    lend=0;
                    continue;
                }
                
                tdate = new Date($scope.tracks[i].endTime);
                tdates = tdate.getDate()+"-"+tdate.getMonth()+"-"+tdate.getFullYear();
                ddate = new Date($scope.days[lend][0].endTime);
                ddates = ddate.getDate()+"-"+ddate.getMonth()+"-"+ddate.getFullYear();

                if(tdates.localeCompare(ddates) === 0){
                    $scope.days[lend].push($scope.tracks[i]);
                    continue;
                }                
                lend+=1;
                $scope.days[lend] = [];
                $scope.days[lend].push($scope.tracks[i]);
            } 

            trackRepository.countTracks(lent, $scope.moreDataCanBeLoaded);
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$apply();
        });
    }    

    // Get 2 days.
    $scope.getItems(1);

    $scope.getTotalFeed = function(arr){
        len = arr.length;
        total = 0;
        for(i=0;i<len;i++)
            total+=arr[i].timeInterval;

        return moment.duration(total, 'seconds').humanize();
    }
    
    var elements = angular.element(document.querySelector('.track-item'));

})

.controller('EditTrackCtrl', function($scope, $translate, $stateParams, trackRepository){
    moment.lang($scope.settings.lang.code);
    $scope.track = {};
    trackRepository.get($stateParams.id, $scope.track, function(){
        $scope.$apply();
    });

    $scope.date = moment($scope.track.startTime).format('D MMMM YYYY');

    $scope.startTime = function(){
        return moment($scope.track.startTime).format('D MMMM  YYYY, h:mm a');
    }

    $scope.endTime = function(){
        return moment($scope.track.startTime + $scope.track.timeInterval*1000).format('D MMMM YYYY, h:mm a');
    }

    Object.defineProperty($scope, 'interval', {
        get: function() {                        
            return $scope.track.timeInterval/60;
        },
        set: function(val){
            $scope.track.timeInterval = val*60;
            trackRepository.update($scope.track);
        }
    });

    $scope.$watch("interval");

})

.controller('AddTrackCtrl', function($scope, $filter, trackRepository){
    $scope.track = {
        'startTime' : undefined,
        'endTime': undefined,
        'timeInterval': undefined,
        'bbc': undefined
    };
    $scope.trackDate = new Date();
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
    
    $scope.selectBreast = function(breast){        
        $scope.track.breast = breast.charAt(1).toUpperCase();
        $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
        $scope[breast] = "button button-balanced";
        console.log($scope);
    }

    Object.defineProperty($scope, 'trackDateStr', {
        get: function() {                        
            return $filter("date")($scope.trackDate, 'yyyy-MM-dd');
        },
        set: function(val){        
            $scope.trackDate = new Date(moment(val, 'YYYY-MM-DD').valueOf());            
        }
    });

    Object.defineProperty($scope, 'startTime', {
        get: function() {
            if($scope.track.startTime === undefined)
                return undefined;            
            return $filter("date")(new Date($scope.track.startTime - $scope.trackDate.getTime()), 'HH:mm');
        },
        set: function(val){
            val = $filter("date")($scope.trackDate, 'yyyy-MM-dd') + " " + val;            
            $scope.track.startTime = new Date(moment(val, 'YYYY-MM-DD HH:mm').valueOf()).getTime();
        }
    });

    Object.defineProperty($scope, 'endTime', {
        get: function() {                                             
            console.log($scope.track.startTime, $scope.track.timeInterval);
            return $filter("date")($scope.track.startTime + $scope.timeInterval*1000, 'HH:mm');
        }
    });

    Object.defineProperty($scope, 'timeInterval', {
        get: function() {                        
            return $scope.track.timeInterval/60;
        },
        set: function(val){
            $scope.track.timeInterval = val*60;
        }
    });

    $scope.$watch("endTime", function(val){
        // console.log(val);
    })

    $scope.$watch("startTime", function(val){
        console.log(val);
    })
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