Module.register('MMM-YrNow', {
	defaults: {
        
	},

    getTranslations: function() {
        return {
            no: "translations/no.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js',
            'readTextFile.js'
        ];
    },

    getStyles: function() {
        return [
            'styles.css'
        ];
    },

	start: function() {
		this.list = null;
		this.loaded = false;
        this.getNowcast();
        var self = this;
        setInterval(function() {
            self.updateDom(1000);
        }, 60000);
	},

    socketNotificationReceived: function(notification, payload) {
		if(notification === 'YR_NOWCAST_DATA'){
			if(payload.points != null) {
                var nextUpdate = payload.update;
                var millisToUpdate = Math.abs((Date.parse(nextUpdate) - new Date()));
                if (!this.loaded) {
                    this.scheduleUpdate(millisToUpdate);
				    this.processJSON(payload);
                }
    			this.loaded = true;
			}
		}
	},

    getNowcast: function() {
        var yrApiUrl = printf('https://www.yr.no/api/v0/locations/id/%s/forecast/now' ,this.config.locationId);
		this.sendSocketNotification('GET_YR_NOWCAST', yrApiUrl);
	},

    getNextPrecipStart: function() {
        return this.list.points.filter((item) => 
            item.intensity > 0 && Date.parse(item.time) >= new Date().valueOf())[0];
    },

    getNextPrecipStop: function() {
        return this.list.points.filter((item) => 
            item.intensity === 0 && Date.parse(item.time) >= new Date().valueOf())[0];
    },

    getMinutesTill: function(nextItemTime) {
        return Math.abs(Date.parse(nextItemTime) - new Date().valueOf()) / (1000 * 60);
    },

	getDom: function() {
		var wrapper = document.createElement('div');

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('loading');
			wrapper.className = 'dimmed light small';
			return wrapper;
	    }
        wrapper.className = 'light large bright';

        var precipitationStart = this.getNextPrecipStart();
        var precipitationStop = this.getNextPrecipStop();
        var nowCast = this.translate('no_precip_next_90');

        if(precipitationStart != null) {
            //Precip some time during the next 90 minutes
            var precipitationStartsIn = this.getMinutesTill(precipitationStart.time);
                
            //Precip now
            if(precipitationStartsIn < 7) {
                this.createAnimation(wrapper);
                wrapper.appendChild(this.getUmbrella());
                
                if(precipitationStop) {
                    precipitationStopsIn = this.getMinutesTill(precipitationStop.time);
                    nowCast = printf(this.translate("precipitation_ends"), precipitationStopsIn.toFixed(0));
                }
                else
                    nowCast = this.translate("precip_next_90");
            }
            else {
                //Precip in n minutes
                wrapper.appendChild(this.getUmbrella());
                nowCast = printf(this.translate("precip_in"), precipitationStartsIn.toFixed(0));
            }
        }
        
        var precipText = document.createElement("p");
        precipText.className = 'precipText';
        precipText.innerHTML = nowCast; 
        wrapper.appendChild(precipText);
    	return wrapper;
	},

    createAnimation: function(testElement) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.file("images/rain.svg"), false);
        xhr.send("");
        testElement.appendChild(xhr.responseXML.documentElement);
    },

    getUmbrella: function() {
        var umbrella = document.createElement("img");
        umbrella.src = this.file("images/umbrella.svg");
        return umbrella;
    },

	processJSON: function(obj) {
		this.list = obj;
        this.loaded = true;	
		this.updateDom(1000);
	},

	scheduleUpdate: function(delay) {
		var nextLoad = 450000;
		if (typeof delay !== 'undefined' && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.getNowcast();
		}, nextLoad);
	}
});