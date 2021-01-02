
function createTopoChart() {
    $("#svgTopoChart svg").remove()

    // Set the dimensions of the canvas / graph
    var	margin = {top: 30, right: 20, bottom: 30, left: 50},
        width = $("#results-bar").width() - margin.left - margin.right,
        height = $("#right-bar").height() - $("#title-bar").height() - $("#controler-bar").height() - $("#results-bar").height() - margin.top - margin.bottom;

    // Set the ranges
    var	x = d3.scaleLinear().range([0, width]);
    var	y = d3.scaleLinear().range([height, 0]);

    // Define the axes
    var	xAxis = d3.axisBottom(x);

    var	yAxis = d3.axisLeft(y);

    // Define the line
    var	line_value = d3.line()
        .x(function(d) { return x(d.properties.distance); })
        .y(function(d) { return y(d.properties.height); })
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
    y.domain([
        d3.min(data, function(d) { return d.properties.height; }) - 5,
        d3.max(data, function(d) { return d.properties.height; }) + 5]
    );

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
        return y(d.properties.height)
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
            tooltip_div.html("<p>Altitude: " + d.properties.height + " mètres<br>Distance: " + Math.round(d.properties.distance, 1)  + " mètres</p>")
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
        .on("mousemove", function(d) {
            place_popup()
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
      .style("font-size", "10px")
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
      .style("font-size", "10px")
      .text("Altitude (mètres)");

};

function place_popup() {
    // always only 1 popup
    let current_popup = d3.select('.tooltip')

    // do not change with let or you'll have value issue
    var popup_width = $(".tooltip").width()
    var popup_height = $(".tooltip").height()

    current_popup
    .style('left', function () {
        if (d3.event.pageX + popup_width + 20 > $(window).width()) {
            return d3.event.pageX - popup_width - 15 + 'px'
        } else {
            return d3.event.pageX + 15 + 'px'
        }
    })
    .style('top', function () {
        if (d3.event.pageY + popup_height + 20 > $(window).height()) {
            return d3.event.pageY - popup_height - 15 + 'px'
        } else {
            return d3.event.pageY + 15 + 'px'
        }
    })
}