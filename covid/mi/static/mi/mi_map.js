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
let width = 500 - margin.left - margin.right;

let svg = d3.select('#map-div').append('svg')
    .attr('height', height)
    .attr('width', width + margin.left + margin.right)
    // .attr('viewbox', `0 0 ${height} ${width + margin.left + margin.right}`)
    //     .attr('preserveAspectRatio', 'xMidYMin meet')
    .append('g')
    .attr('transform', `translate(${-150}, ${margin.top * 4})`)
;


let lineSvg = d3.select('#line-div').append('svg')
    .attr('height', height)
    .attr('width', width + 250 + margin.left + margin.right)
    .append('g')
    // .attr('transform', `translate(${margin.left}, ${margin.top * 4})`)
;

// let sliderCreated = false;
// let sliderParams;
let deathData;

let path = d3.geoPath();

let caseInfo = {};

let projection = d3.geoAlbersUsa()
    .translate([-200, height])
    .scale([4700])
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
        if (total > 0) {
            info += '<br>CFR: ' + (deaths / total * 100).toFixed(2) + '%';
        }
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
    domainVals = [1, 100, 250, 500, 1000, 5000, 20000, 40000, 500000];
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
    // console.log(legendVals);

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
        .attr('transform', (d, i) => `translate(${width - 200}, ${i * 20})`)
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

function cleanName(county) {
    return county.replace('.', '').replace(' ', '')
}

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

            d3.selectAll('body').style('cursor', '');
            d3.selectAll('html').style('cursor', '');
            d3.selectAll('input').style('cursor', '');
            d3.selectAll("input").attr("disabled", null);
            // console.log('cases', json['cases']);
            mapData = json['cases'];
            deathData = json['deaths'];
            totalCases = json['total_cases'];
            totalDeaths = json['total_deaths'];
            d3.select('#case-total').text('Cases: ' + totalCases.toLocaleString());
            d3.select('#death-total').text('Deaths: ' + totalDeaths.toLocaleString());
            d3.select('#cfr').text('CFR: ' + (totalDeaths / totalCases * 100).toFixed(2) + '%');
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
        .attr('class', 'county-bounds')
        .attr('id', d => {
            return cleanName(d.properties['NAME']);
        })
        // .attr('fill', d => colorFunction(d, mapData))
        .attr('d', path.projection(projection))
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click', d => {
            getLineData(d.properties['NAME']);
        })
    ;

    states.exit().attr('fill', 'none');

    svg.append('path')
        .datum(topojson.mesh(topography, topography.objects['cb_2015_michigan_county_20m'],
            (a, b) => a !== b))
        .attr('class', 'county')
        .attr('d', path)
    ;

    getData();

    // svg.attr('viewbox', `0 0 ${height} ${width + margin.left + margin.right}`)
    svg.call(tip);
}

d3.select('#current-date').text(max_date);
if (d3.select('#date-type-select').node().value !== 'total') {
    d3.select('#date-type-select').node().value = 'total';
}

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

let lineTip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function (d) {
        let total = d.totals;
        if (d.totals === undefined) {
            total = 0;
        }
        // let deaths = deathData[d.properties['NAME']];
        // if (deaths === undefined) {
        //     deaths = 0;
        // }
        let info = 'Date: ' + d.date.toISOString().substring(0, 10) + '<br>';
        info += d.count.substring(0, 1).toUpperCase() + d.count.substring(1) + ': ' + total.toLocaleString() + '<br>';
        return info
    })
;


let currentCounty = 'All'
function createLine() {

    let parser = d3.timeParse('%Y-%m-%d')

    let min = 0;
    let max = 0;
     let dateArray = [];
    // lineDates = c_lineDates
    // console.log(lineDates);
    dateArray[0] = {'count': 'cases', 'values': []}
    dateArray[1] = {'count': 'deaths', 'values': []}
    let newDates = [];

    for (const date in lineDates) {
        if (lineDates[date]['cases'] > max) {
            max = lineDates[date]['cases'];
        }
        if (lineDates[date]['deaths'] > max) {
            max = lineDates[date]['deaths'];
        }
        if (lineDates[date]['cases'] < min) {
            lineDates[date]['cases'] = min;
        }
        if (lineDates[date]['deaths'] < min) {
            lineDates[date]['deaths'] = min;
        }
        newDates.push(lineDates[date]['date']);
        dateArray[0]['values'].push({'date': parser(lineDates[date]['date']),
                                     'totals': lineDates[date]['cases'],
                                     'count': 'cases'})
        dateArray[1]['values'].push({'date': parser(lineDates[date]['date']),
                                     'totals': lineDates[date]['deaths'],
                                     'count': 'deaths'})
    }

    // console.log('dateArray', dateArray);
    // console.log(lineDates);

    let xScale = d3.scaleTime()
        .domain(d3.extent(newDates, d => parser(d)))
        .range([0, width + 150]);

    let xAxis = lineSvg.append('g')
        // .attr('transform', `translate(${-width / 2 + 31}, ${-20})`)
        .attr('transform', `translate(${margin.left + margin.right}, ${height - margin.bottom - 10})`)
        .attr('class', 'axis')
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    let yScale = d3.scaleLinear()
        .domain([min, max + d3.max([Math.round(max / 10), 10])])
        .range([height - margin.top, 0])

    let yAxis = lineSvg.append('g')
        .attr('transform', `translate(${margin.left + margin.right}, ${margin.bottom})`)
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale))

    let countyLine = d3.line()
        .x(d => {
            // console.log(d);
            // console.log('xs', xScale(d['date']));
            return xScale(d['date']) + margin.left + margin.right
        })
        .y(d => {
            // console.log('ys', d.cases);
            return yScale(d['totals']) + margin.bottom
        })

    let lineColor = d3.scaleOrdinal(d3.schemeCategory10);
    // lineColor.domain(lineArray.map(c => c.county))
    lineColor.domain([0, 10])



    let cLine = lineSvg.selectAll('.county-line')
        .data(dateArray)
        .enter().append('g')
        .attr('class', 'county-line')
    ;


    cLine.append('text')
        .attr('x', width / 2 - margin.right)
        .attr('y', margin.bottom - 10)
        .attr('class', 'line-title')
;
    let titleExtraText = ' for All Counties';
    if (currentCounty !== 'All') {
        titleExtraText = ` for ${currentCounty}`
    }

    let date_type = d3.select('#date-type-select').node().value;
    if (date_type === 'total') {
        d3.selectAll('.line-title').text('Cumulative Totals' + titleExtraText);
    } else {
        d3.selectAll('.line-title').text('Daily Totals' + titleExtraText);
    }
    // .attr('fill', d => colorFunction(d));

    lineSvg.call(lineTip);

    let path = cLine.append('path')
        .attr('class', 'line')
        .style('fill', 'none')
        .style('stroke-width', '2px')
        .style('stroke', d => lineColor(d.count))
        .attr('d', d => countyLine(d.values))
    ;

    let totalLength = path.node().getTotalLength();
    // console.log(totalLength);

    path.attr('stroke-dashoffset', totalLength)
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .transition()
        .duration(1600)
        .attr('stroke-dashoffset', 0)

    cLine.selectAll('circle')
        .data(d => d.values)
        .enter().append('circle')
        .attr('class', 'line-circle')
        .attr('cx', d => xScale(d.date) + margin.left + margin.right)
        .attr('cy', d => yScale(d.totals) + margin.bottom)
        .attr('r', 0)
        // .attr('fill', 'red')
        .style('fill', (d) => {
            // console.log(d);
            return lineColor(d.count)
        })
        .on('mouseover', d => {
            lineTip.show(d);
        })
        .on('mouseout', d => lineTip.hide(d))
        .transition()
        .duration(3700)
        .attr('r', 4)
    // ;


// gridlines in x axis function
    function xGrid() {
        return d3.axisBottom(xScale)
            .ticks(15)
    }

// gridlines in y axis function
    function yGrid() {
        return d3.axisLeft(yScale)
            .ticks(10)
    }// .style('fill', 'red')

    // https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    // X grid lines
    lineSvg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${-width / 2 + 31}, ${-20})`)
        .call(xGrid()
            .tickSize(-height + 63 + 150)
            .tickFormat("")
        )

    // Y grid lines
    lineSvg.append("g")
        .attr("class", 'grid')
        .attr('transform', `translate(${margin.left + margin.right}, ${margin.bottom})`)
        .call(yGrid()
            .tickSize(-width - 120 - margin.right)
            .tickFormat("")
        )
    createLineLegend();
}

function createLineLegend() {
    d3.selectAll('.line-legend').remove();

    let legendVals = ['cases', 'deaths']

    setLineLegend(legendVals);

}

let lineLegend;
let lineLegendCircles;
function setLineLegend(legendVals) {
    lineLegend = lineSvg.selectAll('.line-legend')
        .data(legendVals)
        .enter().append('g')
        .attr('class', 'line-legend')
        .attr('transform', (d, i) => `translate(${width + 90 + 130 + margin.right}, ${i * 20 + 200})`)
    ;

    lineLegend.exit().remove();

    lineLegend.append('text').text(d => d.substring(0, 1).toUpperCase() + d.substring(1, d.length))
        .attr('transform', 'translate(15, 5)')
        .attr('class', 'line-legend-text')
        // .style('font-size', '0px')
        // .transition()
        //     .duration(3700)
        //     .style('font-size', '14px')
    ;

    let lineColor = d3.scaleOrdinal(d3.schemeCategory10);
    lineColor.domain([0, 10])

    lineLegendCircles = lineLegend.append('circle')
        .style('stroke', 'black')
            .attr('cx', 5)
            .attr('cy', 0)
            .attr('r', 5)
        // .transition()
        //     .duration(3700)
        //     .attr('r', 5)
    ;

    lineLegendCircles.attr('fill', d => lineColor(d))
}

createLine();

let selector = document.getElementById('county-select');

for (let i = 1; i < countyList.length + 1; i++) {
    selector.options[i] = new Option(countyList[i - 1], countyList[i - 1]);
}

function getLineData(county) {

    let date_type = d3.select('#date-type-select').node().value;
    if (((county === currentCounty) ||
        (currentCounty === document.getElementById('county-select').value && county === undefined)) &&
        (date_type === 'total' !== onDays)) {
        return;
    }

    clearLineData();

    // console.log('setting up ajax...');
    d3.select('body').style('cursor', 'wait');
    d3.select('html').style('cursor', 'wait');
    d3.select('input').style('cursor', 'wait');
    d3.select("input").attr("disabled", "disabled");
    if (county === undefined) {
        currentCounty = document.getElementById('county-select').value;
        let c = {properties: {NAME: currentCounty}}
        d3.select('#' + cleanName(currentCounty)).attr('fill', colorFunction(c));
        // document.getElementById('county-select').value = 'All';
    } else {
        // d3.select('#' + currentCounty).attr('stroke', 'black');
        let c = {properties: {NAME: currentCounty}}
        d3.select('#' + cleanName(currentCounty)).attr('fill', colorFunction(c));
        // d3.select('#' + currentCounty).attr('stroke-width', '1px');
       currentCounty = county;
       document.getElementById('county-select').value = currentCounty;
        // d3.select('#' + currentCounty).attr('stroke', 'green');
        // d3.select('#' + currentCounty).attr('stroke-width', '5px');
    }
    d3.select('#' + cleanName(currentCounty)).attr('fill', '#5c5b5b');
    d3.json(growthUrl, {
        method: "POST",
        body: JSON.stringify({'county': currentCounty, 'date_type': date_type}),
        headers: {
            "X-CSRFToken": csrfToken,
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then(json => {
            // console.log('back from ajax');

            d3.selectAll('body').style('cursor', '');
            d3.selectAll('html').style('cursor', '');
            d3.selectAll('input').style('cursor', '');
            d3.selectAll("input").attr("disabled", null);
            // console.log('cases', json['cases']);
            lineDates = JSON.parse(json['totals']);
            createLine();

        });
}

function clearLineData() {
    d3.selectAll('.grid').remove();
    d3.selectAll('.county-line').remove();
    d3.selectAll('.axis').remove();
    d3.selectAll('.line-legend').remove();
    d3.selectAll('.line-circle').remove();
    let c = {properties: {NAME: currentCounty}}
    d3.select('#' + cleanName(currentCounty)).attr('fill', colorFunction(c));
}

function resetLineChart() {
    clearLineData();
    getLineData('All')
}