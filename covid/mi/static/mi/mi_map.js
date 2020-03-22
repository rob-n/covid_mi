let margin = ({top: 70, right: 30, bottom: 30, left: 50});
let height = 500 - margin.top - margin.bottom;
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

let projection = d3.geoAlbersUsa()
    .translate([width / 20 - margin.right - margin.left, height + margin.top + margin.bottom])
    .scale([3000])
;

let states;

let color = d3.scaleOrdinal()
    .range(d3.schemeOranges[9])
    .domain(d3.range(0, 1000))
;

function colorFunction(d, data) {
    let total = data[d.properties['NAME']];
    if (total === undefined) {
       return '#FFFFFF';
    } else {
        total = data[d.properties['NAME']];
    }
    return color(total);
}

function createMap(topography, data){

    console.log('topography', topography);
    console.log('data', data);
    let geojson = topojson.feature(topography, topography.objects['cb_2015_michigan_county_20m']);
    console.log("geojson", geojson);

    states = svg.append('g')
        .selectAll('path')
        .data(topojson.feature(topography, topography.objects['cb_2015_michigan_county_20m']).features)
        .enter().append('path')
        .attr('stroke', 'black')
        .attr('fill', d => colorFunction(d, data))
        .attr('d', path.projection(projection))
        // .on('mouseover', tip.show)
        // .on('mouseout', tip.hide)
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