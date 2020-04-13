
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

let csrfToken = getCookie('csrftoken');

let margin = ({top: 70, right: 30, bottom: 30, left: 50});
let height = 625 - margin.top - margin.bottom;
let width = 805 - margin.left - margin.right;

let svg = d3.select('#map-div').append('svg')
    .attr('height', height)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top * 4})`);

// let sliderCreated = false;
// let sliderParams;
let deathData;

// function setSlider() {
//
//     // console.log('dates', dates);
//     sliderParams = d3.sliderBottom()
//         .on('onchange', () => {
//             getData();
//             updateMap()
//         });
//
//     // if (d3.select('#slider-tick-select').node().value === 'date') {
//     //     console.log('date');
//     let formatDate = d3.timeParse('%m/%d');
//
//     let sliderDates = dates.map(d => {
//         return formatDate(d)
//     });
//     // console.log('sliderDates', sliderDates);
//
//     sliderParams.min(sliderDates[0])
//         .max(sliderDates[dates.length - 1])
//         .step(1000 * 60 * 60 * 24)
//         .tickValues(sliderDates)
//         .tickFormat(d3.timeFormat('%m/%d'))
//         .default(sliderDates[sliderDates.length - 1])
//         .width(600)
//     ;
//
//     let slider = d3.select('#slider-div')
//         .append('svg')
//         .attr('id', 'svg-slider')
//         .attr('width', width)
//         .attr('height', 100)
//         .append('g')
//         .attr('id', 'slider')
//         .attr('transform', 'translate(30, 30)')
//     ;
//
//     if (!sliderCreated) {
//         sliderCreated = true;
//     } else {
//         d3.select('#svg-slider').remove();
//     }
//
//
//     slider.call(sliderParams);
// }

let path = d3.geoPath();

let caseInfo = {};

let projection = d3.geoAlbersUsa()
    .translate([-400, height])
    .scale([5000])
;

let states;

let tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function (d) {
        let total = mapData[d.properties['NAME']];
        if (total === undefined) {
            total = 0;
        }
        let deaths = deathData[d.properties['NAME']];
        if (deaths === undefined) {
            deaths = 0;
        }
        let info = 'County: ' + d.properties['NAME'] + '<br>';
        info += 'Cases: ' + total.toLocaleString() + '<br>';
        info += 'Deaths: ' + deaths.toLocaleString();
        return info
    })
    .direction(d => {
        if (d.properties['NAME'] === 'Keweenaw') {
            return 'e';
        } else {
            return 'n';
        }
    })
;

let color;

function colorFunction(d) {
    let total = mapData[d.properties['NAME']];
    if (total === undefined) {
        return '#FFFFFF';
    } else {
        total = mapData[d.properties['NAME']];
    }
    return color(total);
}

let legend;
let removeLegend = false;
let originalDomain;
let circles;

function totalLegend() {
    if (removeLegend) {
        d3.selectAll('.legend').remove();
    } else {
        removeLegend = true;
    }

    let dataValues = Object.values(mapData);

    let maxVal = Math.max(...dataValues);

    let domainVals;
    if (originalDomain !== undefined) {
        domainVals = originalDomain;
    } else {
       domainVals = [1];
        for (let i = 0; i < 6; i++) {
            domainVals[i + 1] = Math.round(maxVal / 9 + maxVal / 9 * i);
        }
        domainVals[7] = maxVal;
    }

    if (first) {
        originalDomain = domainVals;
    }
    domainVals = [1, 25, 50, 100, 500, 1000, 5000, 10000, 500000];
    color = d3.scaleThreshold(domainVals,
        d3.schemeOranges[9]);

    let legendVals = [];
    for (let i = 0; i < domainVals.length - 1; i++) {
        legendVals.push(`${domainVals[i].toLocaleString()} to ${(domainVals[i + 1] - 1).toLocaleString()}`)
    }

    legendVals[legendVals.length - 1] = legendVals[legendVals.length - 1].split(' ')[0] + '+';
    // legendVals.push(maxVal.toLocaleString() + '+');

    setLegend(legendVals);

    circles.attr('fill', d => {
            let cleaned = d.split('-')[0];
            cleaned = cleaned.replace(',', '');
            cleaned = cleaned.replace('+', '');
            return color(parseInt(cleaned))
        })
}

function dateLegend() {
    if (removeLegend) {
        d3.selectAll('.legend').remove();
    } else {
        removeLegend = true;
    }

    let dataValues = Object.values(mapData);

    let maxVal = Math.max(...dataValues);
    // console.log(maxVal);

    let domainVals;
    if (totalCases === 0) {
        return;
    } else if (totalCases < 9 || maxVal < 9) {
        domainVals = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    } else {
       domainVals = [1];
        for (let i = 0; i < 6; i++) {
            domainVals[i + 1] = Math.round(maxVal / 9 + maxVal / 9 * i);
        }
        domainVals[7] = maxVal;
    }

    color = d3.scaleThreshold(domainVals,
        d3.schemeOranges[9]);

    let legendVals = [];
    for (let i = 0; i < domainVals.length - 1; i++) {
        if (totalCases < 9) {
            legendVals.push(domainVals[i].toLocaleString())
        } else {
            legendVals.push(`${domainVals[i].toLocaleString()} to ${(domainVals[i + 1] - 1).toLocaleString()}`)
        }
    }
    if (totalCases > 9 && maxVal > 9) {
        legendVals.push(maxVal.toLocaleString() + '+');
    }

    if (totalCases.length < 9 || maxVal < 9) {
        legendVals = domainVals;
    }

    setLegend(legendVals);

     if (totalCases < 9 || maxVal < 9) {
         circles.attr('fill', d => color(d))
     } else {
         circles.attr('fill', d => {
                 let cleaned = d.split('-')[0];
                 cleaned = cleaned.replace(',', '');
                 cleaned = cleaned.replace('+', '');
                 return color(parseInt(cleaned))
             })
     }
}

function setLegend(legendVals) {
    legend = svg.selectAll('.legend')
        .data(legendVals)
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${width - 140}, ${i * 20})`)
    ;

    legend.exit().remove();

    legend.append('text').text(d => d)
        .attr('transform', 'translate(15, 5)')
        .attr('class', 'legend-text');

    circles = legend.append('circle')
        .style('stroke', 'black')
        .attr('cx', 5)
        .attr('cy', 0)
        .attr('r', 5);
}

let first = true;
let onDays = false;
let totalCases;
let totalDeaths;

function getData() {
    let date_type = d3.select('#date-type-select').node().value;
    // console.log('setting up ajax...');
    d3.select('body').style('cursor', 'wait');
    d3.select('html').style('cursor', 'wait');
    d3.select('input').style('cursor', 'wait');
    d3.select("input").attr("disabled", "disabled");
    // let ed = sliderParams.value();
    // let parsed = '2020-' + ('0' + (ed.getMonth() + 1)).slice(-2) + '-' + ('0' + ed.getDate()).slice(-2);
    let parsed = d3.select('#current-date').text();
    d3.json(jsonUrl, {
        method: "POST",
        body: JSON.stringify({'end_date': parsed, 'date_type': date_type}),
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(json => {
            // console.log('back from ajax');

            d3.select('body').style('cursor', '');
            d3.select('html').style('cursor', '');
            d3.select('input').style('cursor', '');
            d3.select("input").attr("disabled", "");
            // console.log('cases', json['cases']);
            mapData = json['cases'];
            deathData = json['deaths'];
            totalCases = json['total_cases'];
            totalDeaths = json['total_deaths'];
            d3.select('#case-total').text('Total Cases: ' + totalCases.toLocaleString());
            d3.select('#death-total').text('Total Deaths: ' + totalDeaths.toLocaleString());
            d3.select('#current-date').text(parsed);
            if (!isNaN(mapData['Detroit'])) {
                mapData['Wayne'] += mapData['Detroit'];
                deathData['Wayne'] += deathData['Detroit'];
            }
            if (date_type === 'date') {
                dateLegend();
                onDays = date_type === 'date';
            } else {
                if (first || onDays === true) {
                    first = false;
                    onDays = false;
                    totalLegend();
                }
            }
            updateMap();

        });
}

let mapData;

function createMap() {

    states = svg.append('g')
        .selectAll('path')
        .data(topojson.feature(topography, topography.objects['cb_2015_michigan_county_20m']).features)
        .enter().append('path')
        .attr('stroke', 'black')
        // .attr('fill', d => colorFunction(d, mapData))
        .attr('d', path.projection(projection))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
    ;

    states.exit().attr('fill', 'none');

    svg.append('path')
        .datum(topojson.mesh(topography, topography.objects['cb_2015_michigan_county_20m'],
            (a, b) => a !== b))
        .attr('class', 'county')
        .attr('d', path)
    ;

    getData();

    svg.call(tip);
}

d3.select('#current-date').text(max_date);
if (d3.select('#date-type-select').node().value !== 'total') {
    d3.select('#date-type-select').node().value = 'total';
}
// setSlider();
createMap();

function updateMap() {

    caseInfo = mapData;
    states.transition()
        .duration(250)
        .attr('fill', d => colorFunction(d));
    // states.append('text')
    // .attr("transform", function(d) {console.log(d); return "translate(" + projection(d.geometry.coordinates) + ")"; })
    // .attr("dy", ".35em")
    //     .style('color', 'black')
    //     .style('font-size', '20px')
    //     .text(d => d.properties['NAME'])

}

let dateOffset = (24 * 60 * 60 * 1000);
function backDate() {
    let currentDate = d3.select('#current-date').text();
    d3.select('#next-btn').attr('disabled', null);
    d3.select('#last-btn').attr('disabled', null);

    let as_date = new Date(currentDate.replace(/-/g, '\/'));
    as_date.setTime(as_date.getTime() - dateOffset);

    setDate(as_date);

}

function nextDate() {
    let currentDate = d3.select('#current-date').text();
    d3.select('#prev-btn').attr('disabled', null);
    d3.select('#first-btn').attr('disabled', null);

    let as_date = new Date(currentDate.replace(/-/g, '\/'));
    let dateOffset = (24 * 60 * 60 * 1000);
    as_date.setTime(as_date.getTime() + dateOffset);
    setDate(as_date);
}

function firstDate() {
    let as_date = new Date(min_date.replace(/-/g, '\/'));
    setDate(as_date);
    d3.select('#prev-btn').attr('disabled', true);
    d3.select('#first-btn').attr('disabled', true);
    d3.select('#next-btn').attr('disabled', null);
    d3.select('#last-btn').attr('disabled', null);
}

function lastDate() {
    let as_date = new Date(max_date.replace(/-/g, '\/'));
    setDate(as_date);
    d3.select('#prev-btn').attr('disabled', null);
    d3.select('#first-btn').attr('disabled', null);
    d3.select('#next-btn').attr('disabled', true);
    d3.select('#last-btn').attr('disabled', true);
}

function setDate(asDate) {
    let newDate = asDate.toISOString().split('T')[0];
    d3.select('#current-date').text(newDate);
    if (newDate === min_date) {
        d3.select('#prev-btn').attr('disabled', true);
        d3.select('#prev-btn').attr('disabled', true);
    } else if (newDate === max_date) {
        d3.select('#next-btn').attr('disabled', true);
        d3.select('#last-btn').attr('disabled', true);
    }
    getData();
}

async function showProgression() {
    d3.select('#next-btn').attr('disabled', true);
    d3.select('#last-btn').attr('disabled', true);
    d3.select('#first-btn').attr('disabled', true);
    d3.select('#prev-btn').attr('disabled', true);
    d3.select('#progress-btn').attr('disabled', true);
    for (let i = 0; i < dates.length; i++) {
        d3.select('#current-date').text(dates[i]);
        getData();
        await new Promise(r => setTimeout(r, 550));
    }
    d3.select('#prev-btn').attr('disabled', null);
    d3.select('#first-btn').attr('disabled', null);
    d3.select('#progress-btn').attr('disabled', null);
}

document.addEventListener('keyup', (event) => {
    let min = new Date(min_date.replace(/-/g, '\/'));
    let max = new Date(max_date.replace(/-/g, '\/'));
    let currentDate = d3.select('#current-date').text();
    if (event.key === 'ArrowRight') {
        if (currentDate !== max.toISOString().split('T')[0]) {
            nextDate();
        }
    } else if (event.key === 'ArrowLeft') {
        if (currentDate !== min.toISOString().split('T')[0]) {
            backDate();
        }
    }
});

