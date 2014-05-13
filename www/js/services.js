angular.module('starter.services', [])

.factory('trackRepository', function(){
    var repository = {};    
    repository.db = openDatabase('babyfeeding', '1.0', 'track baby feeding', 5*1024*1024);
    repository.db.transaction(function(tx){
        tx.executeSql('CREATE TABLE tracks (id INTEGER PRIMARY KEY AUTOINCREMENT, startTime INTEGER, endTime INTEGER, breast TEXT, timeInterval INTEGER)');        
    });

    // TODO: Get record by id.
    repository.get = function(id){
        repository.db.executeSql('SELECT * FROM tracks WHERE id=?', [id], function(tx, results){
            var len = results.rows.length;
            if (len == 0){
                return undefined;
            }
            return results.rows.item(0);
        });
    }

    // TODO: Save an object in the repository.
    repository.save = function(obj){        
        this.db.transaction(function(tx){
            tx.executeSql('INSERT INTO tracks (startTime, endTime, breast, timeInterval) VALUES (?,?,?,?)', 
                [obj.startTime, obj.endTime, obj.breast, obj.timeInterval],
                function(tx, results){                    
                    obj.id = results.insertId;
                });    
        });
    }

    // TODO: Update an object in repo.
    repository.update = function(obj){
        this.db.transaction(function(tx){
            tx.executeSql('UPDATE tracks SET startTime=?,endTime=?,breast=?, timeInterval=? WHERE id=?', [obj.startTime, obj.endTime, obj.breast, obj.timeInterval, obj.id]);       
        });
    }

    repository.getLastTrack = function(obj, callback){
        this.db.transaction(function(tx){            
            tx.executeSql('SELECT * FROM tracks WHERE id = (SELECT MAX(Id) FROM tracks)', [],
                function(tx, results) {                    
                    var len = results.rows.length;
                    if (len == 0){
                        return undefined;
                    }    
                    item = results.rows.item(0);
                    obj.id = item.id;
                    obj.startTime = item.startTime;
                    obj.endTime = item.endTime;
                    obj.timeInterval = item.timeInterval;
                    obj.breast = item.breast;
                    callback();
                });
        });
    };

    repository.getTracks = function(length, obj, callback){        
        this.db.transaction(function(tx){            
            tx.executeSql('SELECT * FROM tracks ORDER BY endTime DESC LIMIT ?', [length],
                function(tx, results) {                    
                    var len = results.rows.length, i;
                    if (len == 0){
                        return undefined;
                    }
                    for(i=0; i<len; i++){
                        obj.push(results.rows.item(i));
                    }
                    callback();
                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });
        });
    };

    repository.getTracksByDay = function(days, obj, callback){
        var currdate = new Date();
        currdate.setDate(currdate.getDate() - days);
        currdate.setHours(0, 0, 0, 0);

        this.db.transaction(function(tx){            
            tx.executeSql('SELECT * FROM tracks WHERE endTime > ? ORDER BY endTime DESC LIMIT ?', [length, currdate.getTime()],
                function(tx, results) {                    
                    var len = results.rows.length, i;
                    if (len == 0){
                        return undefined;
                    }
                    for(i=0; i<len; i++){
                        obj.push(results.rows.item(i));
                    }
                    callback();
                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });
        });
    };

    repository.countTracks = function(len, more, callback){
        this.db.transaction(function(tx){            
            tx.executeSql('SELECT COUNT(id) as count FROM tracks', [],
                function(tx, results) {
                    if (len >= results.rows.item(0).count){                        
                        more = false;                        
                    }
                    callback();
                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });
        });  
    }


    return repository;

})