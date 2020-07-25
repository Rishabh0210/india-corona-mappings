var percentColors = [
    { pct: 0.0, color: { r: 0xff, g: 0x00, b: 0 } },
    { pct: 0.5, color: { r: 0xff, g: 0xff, b: 0 } },
    { pct: 1.0, color: { r: 0x00, g: 0xff, b: 0 } } ];

var greenToRedColors = function(pct) {
    for (var i = 1; i < percentColors.length - 1; i++) {
        if (pct < percentColors[i].pct) {
            break;
        }
    }
    var lower = percentColors[i - 1];
    var upper = percentColors[i];
    var range = upper.pct - lower.pct;
    var rangePct = (pct - lower.pct) / range;
    var pctLower = 1 - rangePct;
    var pctUpper = rangePct;
    var color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
    };
    return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
    // or output as hex if preferred
};

var lightToDarkPurple = function(pct) {
    var r = 75 + 140*pct;
    var g = 200*pct;
    var b = 128 + 127*pct;

    return 'rgb(' + [r, g, b].join(',') + ')';
};

var normalizeDeathPct = function(deaths, maxDeaths) {
    var pct = 0;
    if(deaths >= 2000) {
        var range = maxDeaths - 2000;
        pct = (deaths - 2000)/range;
        pct = 80 + 20*pct;
    } else if(deaths >= 200 && deaths < 2000) {
        var range = 1800;
        pct = (deaths - 200)/range;
        pct = 40 + 40*pct;
    } else if(deaths < 200) {
        pct = deaths/200;
        pct = 40*pct;
    }
    return 1 - (pct/100);
}

var lightToDarkRed = function(activeCases) {
    var r = 0;
    if(activeCases > 15000)
        r = 255;
    else {
        r = (activeCases/15000)*255;
    }
    var g = 0;
    var b = 0;
    return 'rgb(' + [r, g, b].join(',') + ')';
}

async function fetchStates() {
    try {
        const response = await fetch("../data/states.json");
        const data = await response.json();
        return data.states;
    } catch (error) {
        console.error(error);
    }
}

async function fetchCovidData() {
    try {
        const response = await fetch("https://covid-india-cases.herokuapp.com/states/");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}


var covidData = null;
async function updateMap(tab) {
    const stateslocation = await fetchStates();

    if(covidData == null) {
        covidData = await fetchCovidData();
        console.log("Hit it!");
    }
    // console.log(covidData);

    var maxDeaths = 0;
    covidData.forEach(element => {
        if(element['deaths'] > maxDeaths)
            maxDeaths = element['deaths'];
    });

    // console.log(`max deaths: ${maxDeaths}`);

    covidData.forEach(element => {
            var latitude = stateslocation[element['state']].latitude;
            var longitude = stateslocation[element['state']].longitude;

            // console.log(`longitude: ${longitude}, latitude: ${latitude}`);

            var totalCases = element['noOfCases'];
            var cured = element['cured'];
            var deaths = element['deaths'];
            var activeCases = totalCases -  cured - deaths;

            if(tab == 2) {          //recovery rates
                var pctRecovered = (cured/totalCases);
                var color = greenToRedColors(pctRecovered)

                if(totalCases == 0)
                    color = greenToRedColors(1);

                var marker = new mapboxgl.Marker({
                    draggable: false,
                    color : color
                })
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`<h1>${(pctRecovered * 100).toFixed(2)}%</h1>`))
                .addTo(map);

            } else if(tab == 3) {   //deaths
                var pctRecovered = (cured/totalCases);
                
                var pct = normalizeDeathPct(deaths, maxDeaths);
                var color = lightToDarkPurple(pct);
                // console.log(`deaths: ${deaths}, pct = ${pct}`);

                var marker = new mapboxgl.Marker({
                    draggable: false,
                    color : color
                })
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`<h1>${deaths}</h1>`))
                .addTo(map);
            } else {                //active cases
                var color = lightToDarkRed(activeCases);
                // console.log(activeCases);
                var marker = new mapboxgl.Marker({
                    draggable: false,
                    color : color
                })
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`<h1>${activeCases}</h1>`))
                .addTo(map);
            }
        });
}