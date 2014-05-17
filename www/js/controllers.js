angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
    moment.lang('es', {});
    $scope.duration = function(dur, type){
        return moment.duration(dur, type).humanize();
    }

})

.controller('TrackCtrl', function($scope, trackRepository){
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

    goBackground = function(){        
        if(!($scope.clock.getTime() > 0))
            return;
        
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
        $scope.track = JSON.parse(timer);        
        currtiming = $scope.track.timeInterval;
        currdate = new Date();        
        
        if(!$scope.track.pause){
            currtiming += (currdate.getTime() - $scope.track.endTime) + 800;
        }
        
        if('clock' in $scope){            
            $scope.clock.setTime(currtiming);            
        }else{
            // Init timer. There is some delay, this is hacky but in general it is 1 second behind the right timing.
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

    // Listen view change event and store progress.
    $scope.$on('$locationChangeStart', function(event) {        
        goBackground();
        // document.removeEventListener("pause", goBackground, false);
        // document.removeEventListener("resume", restoreBackground, false);
    });

    document.addEventListener("pause", goBackground, false);
    document.addEventListener("resume", restoreBackground, false);

    // Load local storage        
    var storage = window.localStorage;

    $scope.last = {};
    
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";

    if(storage.getItem("timer")){        
        restoreBackground();
    }
    else{
        // Init timer.
        $scope.clock = $('.your-clock').tinytimer(0);

        // track object
        $scope.track = {};
        $scope.track.pause = false;
        $scope.track.breast = "L";
        $scope.track.id = undefined;
        getLastTrack();
    }

    
})

.controller('HistoryCtrl', function($scope, trackRepository){
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

            trackRepository.countTracks($scope.tracks.length, $scope.moreDataCanBeLoaded, function(){
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });

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

    $scope.moreData = function(){        
        return $scope.moreDataCanBeLoaded;
    }
    
    // Get 2 days.
    $scope.getItems(2);

})
