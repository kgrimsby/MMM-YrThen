Module.register('MMM-YrThen', {
    defaults: {
        location: "1-2820936",
        yrApiUrl: "https://www.yr.no/api/v0/locations/id/%s/forecast",
        yrCelestialApiUrl: "https://www.yr.no//api/v0/locations/%s/celestialevent",
        updateInterval: 3600000,
        initialLoadDelay: 1000,
        showAll: true,
        showPrecipitation: true,
        showMaxMin: true,
        maxMinSeparator: '-',
        details: true,
        detailedPrec: true,
        numDetails: 2,
        numDays: 7,
        roundTemp: true,
        roundPrec: false,
        windShow: true,
        windGust: false,
        windUnit: '',
        windSize: 'yrthen-xxsmall',
        windText: true,
        windTextNumber: true,
        windTextNewLine: true,
        title: 'Værmelding for Skrubblivegen',
        header: false,
        size: "small"
    },

    getTranslations: function() {
        return {
            no: "translations/no.json",
            en: "translations/en.json",
            sv: "translations/sv.json",
            fi: "translations/fi.json",
            es: "translations/es.json",
            el: "translations/el.json",
            dk: "translations/dk.json",
        }
    },

    getScripts: function() {
        return [
            'printf.js',
            'readTextFile.js',
            'moment.js'
        ];
    },

    getStyles: function() {
        return [
            'MMM-YrThen.css'
        ];
    },

    start: function() {
        Log.info('Starting module ' + this.name);
        moment.locale(config.language);
        this.dataFromYr;
        this.loaded = false;
        this.forecastData = {};
        this.scheduleUpdate(this.config.initialLoadDelay);
        var self = this;
        setInterval(function() {
            self.updateDom(1000);
        },60000);
    },

    round: function(value, precision){
        var multiplier = Math.pow(10, precision || 0);
        var tempV = Math.round(value * multiplier) / multiplier;
        return tempV.toFixed(precision);
    },

    getDom: function() {
        var wrapper = document.createElement('div');
        if(!this.loaded){
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = "dimmed light " + this.config.size;
            return wrapper;
        }

        if(this.config.header){
            var header = document.createElement('header');
            header.innerHTML = this.config.title;
            header.className = 'align-left';
            wrapper.appendChild(header);
        }
        wrapper.classList.add = "dimmed light " + this.config.size;

        var table = document.createElement('table');

        // Find the size one smaller than size
        var possibleSizes = ["xsmall", "small", "medium", "large", "xlarge"]
        var oneSmallerSize = possibleSizes.indexOf(this.config.size) - 1;
        if (oneSmallerSize < 0) {
            oneSmallerSize = 0;
        }
        table.className = possibleSizes[oneSmallerSize] + " yrthen-table";

// SHOWING DETAILED FORECAST
        if(this.config.showAll == true){
            var day;
            var x = 0;
            var first = true;
            var timeRow = document.createElement('tr');
            table.appendChild(timeRow);

            // Find the size one smaller than size
            var possibleSizes = ["xsmall", "small", "medium", "large", "xlarge"]
            var oneSmallerSize = possibleSizes.indexOf(this.config.size) - 1;
            if (oneSmallerSize < 0) {
                oneSmallerSize = 0;
            }

            for(var i = 0; i < 5; i++){
                var newCell = document.createElement('td');
                newCell.className = 'align-left bright ' + oneSmallerSize + ' yrthen-header';
                if(i == 0) newCell.innerHTML = '&nbsp;';
                if(i == 1) newCell.innerHTML = this.translate("night");
                if(i == 2) newCell.innerHTML = this.translate("morning");
                if(i == 3) newCell.innerHTML = this.translate("afternoon");
                if(i == 4) newCell.innerHTML = this.translate("evening");
                timeRow.appendChild(newCell);
            }


            for (var f in this.dataFromYr) {
                    var newData = this.dataFromYr[f];
                    var checkTime = moment(newData.start).format("HH");
                    var today = moment(newData.start).format("ddd");
                    // Make max four cells pr day
                    if(day != today){
                        if(x < this.config.numDays){
                            var row = document.createElement('tr');
                            table.appendChild(row);

                            var dayCell = document.createElement("td");
                            dayCell.className = "yrthen-day align-left";
                            dayCell.innerHTML = moment(newData.start).format("dddd");
                            row.appendChild(dayCell);
                        }
                        day = today;
                        x++;
                    }
                    if(first == true){
                        if(checkTime >= "06"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                        if(checkTime >= "12"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                        if(checkTime >= "18"){
                            var emptyCell = document.createElement("td");
                            emptyCell.innerHTML = "&nbsp;";
                            row.appendChild(emptyCell);
                        }
                    }
                    first = false;
                if(x <= this.config.numDays){
                    var forecastCell = document.createElement("td");
                    forecastCell.className = "yrthen-forecast-cell";
                    var icon = document.createElement("img");
                    icon.className = "yrthen-icon";
    //                icon.width = "40";
                    var weatherSymbol = this.calculateWeatherSymbolId(newData.symbol);
                    icon.src = this.file(printf('images/%s.svg', weatherSymbol));
                    forecastCell.appendChild(icon);
                    forecastCell.innerHTML += '<br>';
                    if(this.config.roundTemp){
                        tempValue = this.round(newData.temperature.value, 0);
                        maxValue = this.round(newData.temperature.max, 0);
                        minValue = this.round(newData.temperature.min, 0);
                    }
                    else{
                        tempValue = this.round(newData.temperature.value, 1);
                        maxValue = this.round(newData.temperature.max, 1);
                        minValue = this.round(newData.temperature.min, 1);
                    }
                    if(this.config.showMaxMin){
                        if(newData.temperature.min && newData.temperature.max){
                            forecastCell.innerHTML += '<span class="bright ' + this.config.size + '">' + minValue + '°' + this.config.maxMinSeparator + maxValue + '°</span><br>';
                        }
                        else forecastCell.innerHTML += ' <span class="bright ' + this.config.size + '">' + tempValue + '°</span><br>';
                    }
                    else{
                        forecastCell.innerHTML += ' <span class="bright ' + this.config.size + '">' + tempValue + '°</span><br>';
                    }
                    if(this.config.showPrecipitation){
                        var precValue = ' <span class="dimmed">(';
                        if(this.config.detailedPrec){
                            if(newData.precipitation.min || newData.precipitation.max){
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.min, 0);
                                else precValue += this.round(newData.precipitation.min, 1);
                                precValue += "-";
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.max, 0);
                                else precValue += this.round(newData.precipitation.max, 1);
                            }
                            else{
                                if(this.config.roundPrec) precValue += this.round(newData.precipitation.value, 0);
                                else precValue += this.round(newData.precipitation.value, 1);
                            }
                        }
                        else {
                            if(this.config.roundPrec) precValue += this.round(newData.precipitation.value, 0);
                            else precValue += this.round(newData.precipitation.value, 1);
                        }
                        if(this.config.showMaxMin && !this.config.detailedPrec){
                            precValue += ' mm';
                        }
                        precValue += ')</span>';
                        forecastCell.innerHTML += precValue;
                    }
                    if(this.config.windShow){
                        var windValue = '<br><span class="dimmed yrthen-wind-det ' + this.config.windSize + '">';
                        if(this.config.windText){
                            windValue += this.calculateWindSpeed(newData.wind.speed);
                            if(this.config.windTextNumber){
                                windValue += ' ';
                                if(this.config.windTextNewLine) windValue += '<br>';
                                windValue += newData.wind.speed;
                            }
                            windValue += ' ';
                        }
                        else{
                            windValue += newData.wind.speed + ' ';
                            if(this.config.windUnit != false) windValue += this.config.windUnit + ' ';                            
                        }
                        windValue += this.translate(this.calculateWindDirection(newData.wind.direction));
                        if(this.config.windGust && newData.wind.gust) windValue += ' (' + newData.wind.gust + ' ' + this.translate("gust") + ') ';
                        windValue += '</span>';
                        forecastCell.innerHTML += windValue;
                    }
                    row.appendChild(forecastCell);
                }
            }
        }

// SHOWING DAILY FORECAST
        else{
            for (var f in this.dataFromYr) {
                var newData = this.dataFromYr[f];
                var checkTime = moment(newData.start).format("HH");

                var show = false;
                if(f < this.config.numDetails && this.config.details == true) show = true;
                if(checkTime > 11 && checkTime < 15) show = true;
                if(show == true){
                    var row = document.createElement('tr');
                    table.appendChild(row);

                    var dayCell = document.createElement("td");
                    dayCell.className = "yrthen-day align-left";
                    if(f < this.config.numDetails && this.config.details == true) dayCell.innerHTML = moment(newData.start).format("ddd HH:mm");
                    else dayCell.innerHTML = moment(newData.start).format("dddd");
                    row.appendChild(dayCell);

                    var iconCell = document.createElement("td");
                    iconCell.className = "yrthen-icon-cell";
                    row.appendChild(iconCell);

                    var icon = document.createElement("img");
                    icon.className = "yrthen-icon ";
                    icon.width = "40";
                    var weatherSymbol = this.calculateWeatherSymbolId(newData.symbol);
                    icon.src = this.file(printf('images/%s.svg', weatherSymbol));
                    iconCell.appendChild(icon);
        
                    var maxTempCell = document.createElement("td");
                    if(this.config.roundTemp){
                        tempValue = this.round(newData.temperature.value, 0);
                        maxValue = this.round(newData.temperature.max, 0);
                        minValue = this.round(newData.temperature.min, 0);
                    }
                    else{
                        tempValue = this.round(newData.temperature.value, 1);
                        maxValue = this.round(newData.temperature.max, 1);
                        minValue = this.round(newData.temperature.min, 1);
                    }

                    if(this.config.showMaxMin){
                        if(newData.temperature.min && newData.temperature.max) maxTempCell.innerHTML = minValue + '˚' + this.config.maxMinSeparator + maxValue + '˚';
                        else maxTempCell.innerHTML = tempValue;
                    }
                    else{
                        maxTempCell.innerHTML = tempValue;
                    }
                    maxTempCell.className = "align-right bright yrthen-temp " + this.config.size;
                    row.appendChild(maxTempCell);

                    var minTempCell = document.createElement("td");
                    minTempCell.innerHTML = this.round(newData.precipitation.value, 1);
                    minTempCell.className = "align-right yrthen-prec dimmed";
                    row.appendChild(minTempCell);

                    if(this.config.windShow){
                        windValue = '';
                        var windCell = document.createElement("td");
                        windCell.className = "align-left yrthen-wind dimmed " + this.config.windSize;
                        if(this.config.windText){
                            windValue += this.calculateWindSpeed(newData.wind.speed) + ' ';
                            if(this.config.windTextNumber){
                                if(this.config.windTextNewLine) windValue += '<br>';
                                windValue += newData.wind.speed;
                                if(this.config.windUnit) windValue += ' ' + this.config.windUnit;
                                windValue += ' ';
                            } 
                        }
                        else{
                            windValue += newData.wind.speed + ' ';
                            if(this.config.windUnit != false) windValue += this.config.windUnit + ' ';                            
                        }
                        if(this.config.windUnit != false) windValue += this.config.windUnit + ' ';
                        windValue += this.translate(this.calculateWindDirection(newData.wind.direction));
                        if(this.config.windGust && newData.wind.gust) windValue += ' (' + newData.wind.gust + ' ' + this.translate("gust") + ') ';
                        windCell.innerHTML += windValue;
                        row.appendChild(windCell);
                    }
                }
            }
        }


        wrapper.appendChild(table);
        this.loaded = true;
        return wrapper;
    },

    updateForecast: function() {
        Log.info('Updating forecast now');
        var forecastUrl = printf(printf('%s', this.config.yrApiUrl),this.config.location);
        this.sendSocketNotification('GET_YRTHEN_FORECAST', {
            forecastUrl: forecastUrl,
            config: this.config.updateInterval
        });
        this.scheduleUpdate();
    },

    processForecast: function(obj) {
        if(obj.longIntervals){
            this.loaded = true;
            this.dataFromYr = obj.longIntervals;
        }
        else{
            Log.info('I have no data!');
        }
    },

    calculateWeatherSymbolId: function(data) {
        if (!data) return '';
        let id = data.n < 10 ? printf('0%s', data.n) : data.n;
        switch (data.var) {
            case 'Sun':
            id += 'd';
            break;
            case 'PolarNight':
            id += 'm';
            break;
            case 'Moon':
            id += 'n';
            break;
        }
        return id;
    },

    calculateWindDirection: function(d) {
        if(!d) return '';
        if((d < 11.25) || (d > 348.75)) return 'N';
        if(d > 11.25 && d < 33.75) return 'NNE';
        if(d > 33.75 && d < 56.25) return 'NE';
        if(d > 56.25 && d < 78.75) return 'ENE';
        if(d > 78.75 && d < 101.25) return 'E';
        if(d > 101.25 && d < 123.75) return 'ESE';
        if(d > 123.75 && d < 146.25) return 'SE';
        if(d > 146.25 && d < 168.75) return 'SSE';
        if(d > 168.75 && d < 191.25) return 'S';
        if(d > 191.25 && d < 213.75) return 'SSW';
        if(d > 213.75 && d < 236.25) return 'SW';
        if(d > 236.25 && d < 258.75) return 'WSW';
        if(d > 258.75 && d < 281.25) return 'W';
        if(d > 281.25 && d < 303.75) return 'WNW';
        if(d > 303.75 && d < 326.25) return 'NW';
        if(d > 326.25 && d < 348.75) return 'NNW';
    },

    calculateWindSpeed: function(s){
        if(!s) return '';
        var w = '';
        if(s <= 0.2) return 'windCalm';
        if(s > 0.2 && s <= 1.5) w = 'windLightAir';
        if(s > 1.5 && s <= 3.3) w = 'windLightBreeze';
        if(s > 3.3 && s <= 5.4) w = 'windGentleBreeze';
        if(s > 5.4 && s <= 7.9) w = 'windModerateBreeze';
        if(s > 7.9 && s <= 10.7) w = 'windFreshBreeze';
        if(s > 10.7 && s <= 13.8) w = 'windStrongBreeze';
        if(s > 13.8 && s <= 17.1) w = 'windModerateGale';
        if(s > 17.1 && s <= 20.7) w = 'windGale';
        if(s > 20.7 && s <= 24.4) w = 'windStrongGale';
        if(s > 24.4 && s <= 28.4) w = 'windStorm';
        if(s > 28.4 && s <= 32.6) w = 'windViolentStorm';
        if(s > 32.6) w = 'windHurricaneForce';
        return this.translate(w);
    },

    socketNotificationReceived: function(notification, payload) {
        if(notification === 'YRTHEN_FORECAST_DATA') {
            Log.info('Got forecast');
            this.processForecast(payload.forecast);
            this.updateDom(1000);
        }
    },

    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setTimeout(function() {
            self.updateForecast();
        }, nextLoad);
    },

});
