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
        console.log("go background");
        if(!($scope.clock.getTime() > 0))
            console.log("go background: no timer running exit.");
            return;
        if(!$scope.track.pause){
            console.log("go background: timer paused, setting pause status.");
            $scope.pauseCount(function(){
                $scope.track.pause = false;                                
                storage.setItem("timer", JSON.stringify($scope.track));            
            });
            return;
        }
        console.log("go background: timer running storing status.");
        storage.setItem("timer", JSON.stringify($scope.track));
    }

    restoreBackground = function(){         
        console.log("restoring background");
        timer = storage.getItem("timer");
        storage.removeItem("timer");
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
            console.log("restoring background: start clock");
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

    // Listen view change event and store progress.
    $scope.$on('$locationChangeStart', function(event) {        
        $scope.goBackground();
        document.removeEventListener("pause", $scope.goBackground, false);
        document.removeEventListener("resume", restoreBackground, false);
    });

    document.addEventListener("pause", $scope.goBackground, false);
    document.addEventListener("resume", restoreBackground, false);

    $scope.last = {};
    
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";

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

.controller('HistoryCtrl', function($scope, trackRepository){
    moment.lang($scope.settings.lang.code);
    $scope.limit = 0;
    $scope.tracks = [];    
    $scope.moreDataCanBeLoaded = true;    
    $scope.getItems = function(increase){
        $scope.limit += increase;                
        $scope.days = [];        
        $scope.tracks = [];
        trackRepository.getTracksByDay($scope.limit, $scope.tracks, function(){            
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

            $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    }    

    $scope.getTotalFeed = function(arr){
        len = arr.length;
        total = 0;
        for(i=0;i<len;i++)
            total+=arr[i].timeInterval;

        return moment.duration(total, 'seconds').humanize();
    }

    $scope.moreData = function(){              
        return $scope.moreDataCanBeLoaded;
    }
    
    // Get 2 days.
    $scope.getItems(2);

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