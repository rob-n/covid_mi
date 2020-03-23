// import {legend} from "d3/color-legend"

let margin = ({top: 70, right: 30, bottom: 30, left: 50});
let height = 750 - margin.top - margin.bottom;
let width = 955 - margin.left - margin.right;

let svg = d3.select('#map-div').append('svg')
    .attr('height', height + margin.top * 2 + margin.bottom * 2)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top * 2})`);

let sliderParams = d3.sliderBottom()
    .on('onchange', updateMap);

let slider = d3.select('#slider-div')
    .append('svg')
    .attr('width', 600)
    .attr('height', 100)
    .append('g')
    .attr('id', 'slider')
    .attr('transform', 'translate(30, 30)')
;

sliderParams.min(2010)
    .max(2015)
    .step(1)
    .ticks(6)
    .width(500)
    .tickFormat(d3.format('.4'))
;
// console.log('loading json');
// let promises = [
//     d3.json('./michigan-counties.json'),
// ];

let path = d3.geoPath();
let cases = d3.map();

let caseInfo = {};

let projection = d3.geoAlbersUsa()
    .translate([-250, height + margin.top + margin.bottom])
    // .translate([width / 150 - margin.right - margin.left, height + margin.top + margin.bottom])
    .scale([5000])
;

let states;

function addDetroit(d, total) {
    if (d.properties['NAME'] === 'Wayne') {
        let detroitTotal = data['Detroit'];
        if (detroitTotal !== undefined) {
            total += detroitTotal;
        }
    }
    return total;
}

let tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    let total = data[d.properties['NAME']];
    if (total === undefined) {
        total = 0;
    }
    // total = addDetroit(d, total);
    let info = 'County: ' + d.properties['NAME'] + '<br>';
    info += 'Total: ' + total + '<br>';
    return info
});

let color;
// = d3.scaleQuantize([1, 10],
//     d3.schemeOranges[9])
//     .domain(d3.range(1, 10))
// ;

function colorFunction(d, data) {
    let total = data[d.properties['NAME']];
    if (total === undefined) {
       return '#FFFFFF';
    } else {
        total = data[d.properties['NAME']];
    }
    // total = addDetroit(d, total);
    return color(total);
}

let legend_a;

function setLegend(data) {
    let dataValues = Object.values(data);
    let newSet = new Set;
    for (let i = 0; i < dataValues.length; i++) {
        newSet.add(parseInt(dataValues[i]));
    }
    console.log('dataValues', dataValues);
    console.log('newSet', newSet);
    let newDomain = Array.from(newSet).sort((a, b) => a - b);
    // let newDomain = d3.range(Math.min(...dataValues), Math.max(...dataValues));
    console.log('domain', newDomain);

    // color = d3.scaleLog([Math.log(Math.min(...dataValues)) + 1, Math.log(Math.max(...dataValues))],
    //     d3.schemeOranges[9])
    // ;

    let minVal = Math.min(...dataValues);
    let maxVal = Math.max(...dataValues);
    console.log(maxVal);

    let domainVals = [1];
    for (let i = 0; i < 6; i++) {
        domainVals[i + 1] = Math.round(maxVal / 9 + maxVal / 9 * i);
    }
    domainVals[7] = maxVal;
    console.log('domainVals', domainVals);
    color = d3.scaleThreshold(domainVals,
        d3.schemeOranges[9])
    ;

    // color = d3.scaleLog()
    //     .domain(d3.quantile(newDomain, 0.01), d3.quantile(newDomain, 0.99))
    //     .range(d3.schemeOranges[9])
    // ;

   var w = 140, h = 300;

		var key = svg.append("svg")
			.attr("width", w)
			.attr("height", h)
			.attr("class", "legend");

		var legend = key.append("defs")
			.append("svg:linearGradient")
			.attr("id", "gradient")
			.attr("x1", "100%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "100%")
			.attr("spreadMethod", "pad");

		legend.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", color(maxVal))
			.attr("stop-opacity", 1);

		legend.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", color(0))
			.attr("stop-opacity", 1);

		key.append("rect")
			.attr("width", w - 100)
			.attr("height", h)
			.style("fill", "url(#gradient)")
			.attr("transform", "translate(0,10)");

    legend_a = svg.selectAll('.legend')
        .data(domainVals)
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${width - 20}, ${i * 20})`)
    ;

    legend_a.exit().remove();

    legend_a.append('text').text(d => d)
        .attr('transform', 'translate(15, 5)')
        .attr('class', 'legend-text');

    legend_a.append('circle')
        .attr('fill', d => color(d))
        .attr('cx', 5)
        .attr('cy', 0)
        .attr('r', 5);
}

function createMap(topography, data){
    data['Wayne'] += data['Detroit'];

    caseInfo = data;
    console.log('topography', topography);
    console.log('data', data);
    setLegend(data);
    let geojson = topojson.feature(topography, topography.objects['cb_2015_michigan_county_20m']);
    console.log("geojson", geojson);

    svg.call(tip);

    states = svg.append('g')
        .selectAll('path')
        .data(topojson.feature(topography, topography.objects['cb_2015_michigan_county_20m']).features)
        .enter().append('path')
        .attr('stroke', 'black')
        .attr('fill', d => colorFunction(d, data))
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

    // svg.append('path')
    //     .data(topojson.feature(topography, topography.objects['nation']).features)
    //     .attr('stroke', 'black')
    //     .attr('fill', 'none')
    //     .attr('d', path.projection(projection))
    // ;

    // //csv
    // d3.csv('state-earthquakes.csv').then(function(data) {
    //
    //     data.forEach(d => {
    //         d['2010'] = +d['2010'];
    //         d['2011'] = +d['2011'];
    //         d['2012'] = +d['2012'];
    //         d['2013'] = +d['2013'];
    //         d['2014'] = +d['2014'];
    //         d['2015'] = +d['2015'];
    //         d['Total Earthquakes'] = +d['Total Earthquakes'];
    //
    //     });
    //
    //     console.log('csv', data);
    //
    // });

}
//
// let color = d3.scaleLog()
//     .range(d3.schemeOranges[9])
//     .domain(d3.range(1, 10))
// ;
//
// function colorFunction(d) {
//     d.total = earthquakes.get(d.properties.name) || 0;
//     return color(d.total);
// }

slider.call(sliderParams);

function updateMap() {

}