angular.module('starter.services', [])

.factory('trackRepository', function(){
    var repository = {};    
    repository.db = openDatabase('babyfeeding', '1.0', 'track baby feeding', 5*1024*1024);
    repository.db.transaction(function(tx){
        tx.executeSql('CREATE TABLE tracks (id INTEGER PRIMARY KEY AUTOINCREMENT, startTime INTEGER, endTime INTEGER, breast TEXT, timeInterval INTEGER)');        
    });

    // TODO: Get record by id.
    repository.get = function(id, obj, callback){
        this.db.transaction(function(tx){
            tx.executeSql('SELECT * FROM tracks WHERE id=?', [id], function(tx, results){
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
                if(typeof callback === 'function')
                        callback();
            });
        });
    }

    // TODO: Save an object in the repository.
    repository.save = function(obj, callback){        
        this.db.transaction(function(tx){
            tx.executeSql('INSERT INTO tracks (startTime, endTime, breast, timeInterval) VALUES (?,?,?,?)', 
                [obj.startTime, obj.endTime, obj.breast, obj.timeInterval],
                function(tx, results){                    
                    obj.id = results.insertId;
                    if(typeof callback === 'function')
                        callback();
                },
                function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });    
        });
    }

    // TODO: Update an object in repo.
    repository.update = function(obj, callback){
        this.db.transaction(function(tx){
            tx.executeSql('UPDATE tracks SET startTime=?,endTime=?,breast=?, timeInterval=? WHERE id=?', 
                [obj.startTime, obj.endTime, obj.breast, obj.timeInterval, obj.id],
                function(){
                    if(typeof callback === 'function')
                        callback(); 
                },
                function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });       
        });
    }

    repository.getLastTrack = function(obj, callback, row){        
        this.db.transaction(function(tx){            
            tx.executeSql('SELECT * FROM tracks ORDER BY Id DESC LIMIT 2', [],
                function(tx, results) {                    
                    var len = results.rows.length;
                    if (len == 0){
                        return undefined;
                    }    
                    item = results.rows.item(row);
                    obj.id = item.id;
                    obj.startTime = item.startTime;
                    obj.endTime = item.endTime;
                    obj.timeInterval = item.timeInterval;
                    obj.breast = item.breast;
                    if(typeof callback === 'function')
                        callback();
                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
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
                    if(typeof callback === 'function')
                        callback();
                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });
        });
    };

    repository.getTracksByDay = function(days, obj, callback){
        var that = this;
        that.db.transaction(function(tx1){
            tx1.executeSql('SELECT * FROM tracks ORDER BY endTime DESC LIMIT 1', [], function(tx1, results1){
                var len = results1.rows.length;
                if (len == 0){
                    return undefined;
                }                
                var currdate = new Date(results1.rows.item(0).endTime);
                currdate.setDate(currdate.getDate() - days);
                currdate.setHours(0, 0, 0, 0);               
                that.db.transaction(function(tx){                    
                    tx.executeSql('SELECT * FROM tracks WHERE endTime > ? ORDER BY endTime DESC', [currdate.getTime()],
                    function(tx, results) {                         
                        var len = results.rows.length, i;
                        if (len == 0){
                            return undefined;
                        }

                        if (obj.length == len){
                            // No new results in this iteration recall                            
                            days+=1;
                            return repository.getTracksByDay(days, obj, callback);
                        }

                        // Empty array //

                        while(obj.length > 0) {
                            obj.pop();
                        }

                        for(i=0; i<len; i++){
                            obj.push(results.rows.item(i));
                        }
                        if(typeof callback === 'function')
                            callback();                        
                    }, function (t, e) {
                      // couldn't read database
                      console.log('unknown: ' + e.message);
                    });
                });
            }, function(t, e){
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

                    if (typeof callback === 'function')
                        callback();

                }, function (t, e) {
                  // couldn't read database
                  console.log('unknown: ' + e.message);
                });
        });  
    }

    repository.deleteTrack = function(id, callback){
        this.db.transaction(function(tx){
            tx.executeSql('DELETE FROM tracks WHERE id=?', [id],
                function(tx, results){
                    if(results.rowsAffected > 0){
                        if(typeof callback === 'function')
                            callback();
                    }
                }, function(t, e){
                    // couldn't read database
                    console.log('unknown: ' + e.message);
                });
        });
    }


    return repository;

})