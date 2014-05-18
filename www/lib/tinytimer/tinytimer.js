(function ( $ ) {
    build = function(elm){
        $(elm).addClass("tinytimer");
        $(elm).append("<span class='minutes-dec digit'/>")
                .append("<span class='minutes-un digit'/>")
                .append("<span class='divider'><span class='dot top'></span><span class='dot bottom'></span></span>")
                .append("<span class='seconds-dec digit'/>")
                .append("<span class='seconds-un digit'/>");        
    }

    $.fn.tinytimer = function(startTime) {
        var that = this;
        build(that);        
        that.extend({
            count: 0,
            setTime: function(time, reset){
                reset = typeof reset !== 'undefined' ? reset : false;
                that.count += time;
                if(reset)
                    that.count = time;

                min = Math.floor(that.count/1000/60) << 0,
                sec = Math.floor(that.count/1000) % 60;                
                min = min.toString();
                sec = sec.toString();
                if(min.length == 1)
                    min = 0+min;
                if(sec.length == 1)
                    sec = 0+sec;

                $('.minutes-dec', that).text(min[0]);
                $('.minutes-un', that).text(min[1]);
                $('.seconds-dec', that).text(sec[0]);
                $('.seconds-un', that).text(sec[1]);                
            },

            start: function(){                
                that.counter = setInterval(function(){                    
                    that.setTime(1000);
                }, 1000);
                that.running=true;
            },

            getTime: function(){
                return that.count/1000;
            },

            pause: function(){
                clearInterval(that.counter);
                that.running = false;
            },

            stop: function(){
                clearInterval(that.counter);
                that.setTime(0, true);
                that.running = false;
            },

            running: false
        });
        that.setTime(startTime, true);
        return that;
    };
}( jQuery ));