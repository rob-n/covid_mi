// import {legend} from "d3/color-legend"

let margin = ({top: 70, right: 30, bottom: 30, left: 50});
let height = 625 - margin.top - margin.bottom;
let width = 955 - margin.left - margin.right;

let svg = d3.select('#map-div').append('svg')
    .attr('height', height)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top * 4})`);

let sliderCreated = false;
let sliderParams;
let deathData;

function setSlider() {

    console.log('dates', dates);
    sliderParams = d3.sliderBottom()
        .on('onchange', () => {
            getData();
            updateMap()
        });

    // if (d3.select('#slider-tick-select').node().value === 'date') {
        console.log('date');
        let formatDate = d3.timeParse('%m/%d');

        let sliderDates = dates.map(d => {
            return formatDate(d)
        });
        console.log('sliderDates', sliderDates);

        sliderParams.min(sliderDates[0])
            .max(sliderDates[dates.length - 1])
            .step(1000 * 60 * 60 * 24)
            .tickValues(sliderDates)
            .tickFormat(d3.timeFormat('%m/%d'))
            .default(sliderDates[sliderDates.length - 1])
            .width(600)
        ;

    // } else {
    //
    //     sliderParams.min(0)
    //         .max(dates.length)
    //         .step(1)
    //         .ticks(dates.length)
    //         .default(dates.length)
    //         .width(600)
    //         .tickFormat(d3.format('.4'))
    //     ;
    //
    // }
    let slider = d3.select('#slider-div')
        .append('svg')
        .attr('id', 'svg-slider')
        .attr('width', width)
        .attr('height', 100)
        .append('g')
        .attr('id', 'slider')
        .attr('transform', 'translate(30, 30)')
    ;

    if (!sliderCreated) {
        sliderCreated = true;
    } else {
        d3.select('#svg-slider').remove();
    }


    slider.call(sliderParams);
}

let path = d3.geoPath();

let caseInfo = {};

let projection = d3.geoAlbersUsa()
    .translate([-400, height ])
    .scale([5000])
;

let states;

let tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
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
});

let color;

function colorFunction(d, data) {
    let total = data[d.properties['NAME']];
    if (total === undefined) {
        return '#FFFFFF';
    } else {
        total = data[d.properties['NAME']];
    }
    return color(total);
}

let legend_a;

function setLegend() {
    // let data = getData();
    let dataValues = Object.values(mapData);
    // let newSet = new Set;
    // for (let i = 0; i < dataValues.length; i++) {
    //     newSet.add(parseInt(dataValues[i]));
    // }
    // console.log('dataValues', dataValues);
    // console.log('newSet', newSet);
    // let newDomain = Array.from(newSet).sort((a, b) => a - b);
    // let newDomain = d3.range(Math.min(...dataValues), Math.max(...dataValues));
    // console.log('domain', newDomain);


    let minVal = Math.min(...dataValues);
    let maxVal = Math.max(...dataValues);
    console.log(maxVal);

    let domainVals = [1];
    for (let i = 0; i < 6; i++) {
        domainVals[i + 1] = Math.round(maxVal / 9 + maxVal / 9 * i);
    }
    domainVals[7] = maxVal;
    // console.log('domainVals', domainVals);
    color = d3.scaleThreshold(domainVals,
        d3.schemeOranges[9])
    ;

    let legendVals = [];
    for (let i = 0; i < domainVals.length - 1; i++) {
        legendVals.push(`${domainVals[i]}-${domainVals[i + 1] - 1}`)
    }
    legendVals.push(maxVal.toString() + '+');

    legend_a = svg.selectAll('.legend')
        .data(legendVals)
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${width - 300}, ${i * 20})`)
    ;

    legend_a.exit().remove();

    legend_a.append('text').text(d => d)
        .attr('transform', 'translate(15, 5)')
        .attr('class', 'legend-text');

    legend_a.append('circle')
        .attr('fill', d => color(parseInt(d.split('-')[0])))
        .attr('cx', 5)
        .attr('cy', 0)
        .attr('r', 5);
}

let first = true;
let onDays = false;

function getData() {
    // let mapData;
    let date_type = d3.select('#date-type-select').node().value;
    // console.log('setting up ajax...');
    d3.select('body').style('cursor', 'wait');
    d3.select('html').style('cursor', 'wait');
    d3.select('input').style('cursor', 'wait');
    d3.select("input").attr("disabled", "disabled");
    let ed = sliderParams.value();
    let parsed = '2020-' + ('0' + (ed.getMonth() + 1)).slice(-2) + '-' + ('0' + ed.getDate()).slice(-2);
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
            if (!isNaN(mapData['Detroit'])) {
                mapData['Wayne'] += mapData['Detroit'];
            }
            if (first || date_type === 'date') {
                setLegend();
                first = false;
            } else {
                if (onDays === true) {
                    onDays = false;
                    setLegend();
                }
            }

            onDays = date_type === 'date';
            d3.select('#case-total').text('Total Cases: ' + json['total_cases'].toLocaleString());
            d3.select('#death-total').text('Total Deaths: ' + json['total_deaths'].toLocaleString());

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

    svg.call(tip);

    getData();

}


setSlider();
createMap();

function updateMap() {

    caseInfo = mapData;
    states.attr('fill', d => colorFunction(d, mapData))

}

