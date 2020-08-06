
function createTopoChart() {


    var label = d3.select(".label");
    // Set the dimensions of the canvas / graph
    var	margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

    // Parse the date / time
    // var	parseDate = d3.time.format("%d-%b-%y").parse;

    // Set the ranges
    var	x = d3.scaleLinear().range([0, width]);
    var	y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    var	xAxis = d3.axisBottom(x);

    var	yAxis = d3.axisLeft(y);

    // Define the line
    var	valueline = d3.line()
        .x(function(d) { return x(d.properties.distance); })
        .y(function(d) { return y(d.properties.elevation); });

    // Adds the svg canvas
    var	svg = d3.select("#svgTopoChart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var data = PointPathData.features
    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.properties.distance; }));
    y.domain([d3.min(data, function(d) { return d.properties.elevation; }), d3.max(data, function(d) { return d.properties.elevation; })]);

    // Add the valueline path.
    svg.append("path")		// Add the valueline path.
        .attr("class", "line")
        .attr("d", valueline(data))
        .style("fill", "none") // add a color
        .style("opacity", "unset") // add 0 to hide the path
        .style("stroke", "black")
        .style("stroke-width", "2")
        .style("overflow", "overlay")

        // Add the valueline path.
    svg		// Add the valueline path.
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 2)
      .attr("cx", function(d) {
        return x(d.properties.distance)
      })
      .attr("cy", function(d) {
        return y(d.properties.elevation)
      })
      .on("mouseover", function(d,i) {

        label.style("transform", "translate("+ x(d.properties.distance) +"px," + (y(d.properties.elevation)) +"px)")
        label.text(d.close)

    })
    // Add the X Axis
    svg.append("g")			// Add the X Axis
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    svg.append("g")			// Add the Y Axis
        .attr("class", "y axis")
        .call(yAxis);

};

