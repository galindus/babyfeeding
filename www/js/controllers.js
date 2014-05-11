angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope) {
})

.controller('TrackCtrl', function($scope, trackRepository){    
    // Prevent counter from start on click timer
    $('.your-clock').click(function(e){
        e.preventDefault();
    });
    $scope.last = {};
    
    $scope.bbc = $scope.blc = $scope.brc = "button button-stable";

    // track object
    var pause = false;
    $scope.track = {};
    $scope.track.breast = "L";
    $scope.track.id = undefined;

    // Init timer.
    $scope.clock = $('.your-clock').FlipClock(3000, {
            clockFace: 'MinuteCounter',
            autoStart: false
        });

    // Set 0
    $scope.clock.setTime(0);

    // Start count function
    $scope.startCount = function(){
        if(!pause){
            $scope.track.startTime = Date.now();
            $scope.track.id = undefined;     
        }
        pause = false;        
        $scope.clock.start();        
    }

    $scope.pauseCount = function(){
        $scope.clock.stop();
        $scope.track.endTime = Date.now();
        pause = true;
        $scope.track.timeInterval = $scope.clock.getTime().getSeconds();        
        if($scope.track.id === undefined){
            trackRepository.save($scope.track);                       
            return;
        }

        trackRepository.update($scope.track);

    }

    $scope.stopCount = function(){                
        $scope.clock.stop();
        $scope.track.endTime = Date.now();
        pause = false;
        $scope.track.timeInterval = $scope.clock.getTime().getSeconds();        

        if($scope.track.id === undefined){
            trackRepository.save($scope.track);                       
            
        }else{
            trackRepository.update($scope.track);
        }
        $scope.last = $scope.track;
        $scope.clock.reset();
        $scope.clock.setTime(0);
    }

    $scope.selectBreast = function(breast){
        $scope.track.breast = breast.charAt(1).toUpperCase();
        $scope.bbc = $scope.blc = $scope.brc = "button button-stable";
        $scope[breast] = "button button-balanced";
    }

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
        $scope.$apply();
    });
})

.controller('HistoryCtrl', function($scope, trackRepository){
    $scope.limit = 10;
    $scope.tracks = [];    
    $scope.moreDataCanBeLoaded = true;    
    $scope.getItems = function(increase){
        $scope.limit += increase;                
        $scope.days = [];        
        $scope.tracks = [];
        trackRepository.getTracks($scope.limit, $scope.tracks, function(){            
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

        return total;
    }

    $scope.getItems(10);
})
