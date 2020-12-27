
function createTopoChart() {
    $("#svgTopoChart svg").remove()

    // Set the dimensions of the canvas / graph
    var	margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = 600 - margin.left - margin.right,
        height = 280 - margin.top - margin.bottom;

    // Set the ranges
    var	x = d3.scaleLinear().range([0, width]);
    var	y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    var	xAxis = d3.axisBottom(x);

    var	yAxis = d3.axisLeft(y);

    // Define the line
    var	line_value = d3.line()
        .x(function(d) { return x(d.properties.distance); })
        .y(function(d) { return y(d.properties.elevation); })
        .curve(d3.curveCatmullRom);

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
    y.domain([d3.min(data, function(d) { return d.properties.elevation; }) - 5, d3.max(data, function(d) { return d.properties.elevation; }) + 5]);

    // Add the line_value path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", line_value(data))
        .style("fill", "none") // add a color
        .style("opacity", "unset") // add 0 to hide the path
        .style("stroke", "black")
        .style("stroke-width", "2")
        .style("overflow", "overlay")

     // Add the valueline path.
     svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 3)
        .style("stroke", "none")
        .style("stroke-width", 20)
        .attr("pointer-events", "all")
        .style("cursor", "pointer")
      .attr("cx", function(d) {
        return x(d.properties.distance)
      })
      .attr("cy", function(d) {
        return y(d.properties.elevation)
      })
        .on("mouseover", function(d) {
            d3.select(this).attr("r", 6)

            // Define the div for the tooltip
            var tooltip_div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
            tooltip_div.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip_div.html("<p>Altitude: " + d.properties.elevation + " mètres<br>Distance: " + Math.round(d.properties.distance, 1)  + " mètres</p>")
                .style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY - 25) + "px");

            var circleOnMap = d3.selectAll(".waypoints_SvgPathBuildAnimated").filter(function(feat, i) {return feat.LatLng === d.LatLng;});
             circleOnMap
                .attr("r", 8)
                .style("opacity", "1")
                .style("fill", "red")
            })
        .on("mouseout", function(d) {
            d3.select(this).attr("r", 3)
            $(".tooltip").remove() //.style("opacity", 0);

            var circleOnMap = d3.selectAll(".waypoints_SvgPathBuildAnimated").filter(function(feat, i) {return feat.LatLng === d.LatLng;});
             circleOnMap
                .attr("r", 8)
                .style("opacity", "0")
                .style("fill", "red")
        })

    // Add X axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // text label x axis
    svg.append("text")
      .attr("transform",
            "translate(" + (width/2) + " ," + (height + margin.top) + ")")
      .style("text-anchor", "middle")
      .text("Distance parcourue (mètre)");

    // Add Y axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // text label y axis
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Altitude (mètres)");

};

