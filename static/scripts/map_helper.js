function mapPoints(geojson_nodes, idxToSelect, id) {
    var featuresdata = geojson_nodes.features

    featuresdata.forEach(function (feature, i) {
        feature.LatLng = new L.LatLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
        )
    })

    var new_svg = L.svg().addTo(map);
    var svg = d3.select(new_svg._container).attr("id", id).attr("pointer-events", "auto");
    var g = svg.select("g").attr("class", "leaflet-zoom-hide path");


    var transform = d3.geoTransform({
        point: projectPoint
    });

    //d3.geoPath translates GeoJSON to SVG path codes.
    //essentially a path generator. In this case it's
    // a path generator referencing our custom "projection"
    // which is the Leaflet method latLngToLayerPoint inside
    // our function called projectPoint
    var d3path = d3.geoPath().projection(transform);

    var pointsFound = featuresdata

    var PathPointsCircles = g.selectAll(".PathNodes")
        .data(pointsFound)
        .enter()
        .append("circle", ".PathNodes")
        .attr("class", "PathNodes")
        .attr("r", "10")
        // .append('text')
        //     .attr("class", "PathNodes")
        //     .text(function(d) { return '\uf3c5'; })

        .on('mouseover', function () {
            map.dragging.disable();
        })
        .on('mouseout', function () {
            map.dragging.enable();
        })
        .call(
            d3.drag()

                .on("drag", function() {
                    d3.select(this)
                        .attr("r", "15")
                        .attr("transform", function (d) {
                        return "translate(" +
                            d3.event.x + "," +
                            d3.event.y + ")";
                        })
                })
                .on("end", function(d) {
                    console.log("done")
                    d3.select(this).attr("transform", function (d) {
                        var new_coordinates = applyLayerToLatLng([d3.event.x, d3.event.y])
                        $('#path_coords_list li:nth-of-type(' + d.properties.position + ') .coordinate_content').attr("data-x", new_coordinates.lng)
                        $('#path_coords_list li:nth-of-type(' + d.properties.position + ') .coordinate_content').attr("data-y", new_coordinates.lat)
                        MapPathNodes()
                    })
                }
            )
        )

    var textPoints = g.selectAll(".PathNodesText")
        .data(pointsFound)
        .enter()
        .append("text")
        .text(function(d) {
            let name = d.properties.name
            let position = d.properties.position

            if (name.length > 0) {
                return name
            } else {
                return position
            }
        })
        .attr("text-anchor", "middle")
        .attr("y", 0)
        .attr("class", "PathNodesText")

    // when the user zooms in or out you need to reset
    // the view
    map.on("zoom", reset);
    // this puts stuff on the map!
    reset();

    // Reposition the SVG to cover the features.
    function reset() {

        textPoints.attr("transform",
            function (d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
        });


        // for the points we need to convert from latlong
        // to map units
        PathPointsCircles.attr("transform",
            function (d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
            });
    }

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
}


function animatePointOnLine(geojson_nodes, id) {

    var featuresdata = geojson_nodes.features

    featuresdata.forEach(function (feature, i) {
        feature.LatLng = new L.LatLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
        )
    })

    // leaflet-zoom-hide needed to avoid the phantom original SVG
    var new_svg = L.svg().addTo(map);
    var svg = d3.select(new_svg._container).attr("id", id);
    var g = svg.append("g").attr("class", "leaflet-zoom-hide path_" + id);


    //stream transform. transforms geometry before passing it to
    // listener. Can be used in conjunction with d3.geoPath
    // to implement the transform.
    var transform = d3.geoTransform({
        point: projectPoint
    });

    //d3.geoPath translates GeoJSON to SVG path codes.
    //essentially a path generator. In this case it's
    // a path generator referencing our custom "projection"
    // which is the Leaflet method latLngToLayerPoint inside
    // our function called projectPoint
    var d3path = d3.geoPath().projection(transform);


    // Here we're creating a FUNCTION to generate a line
    // from input points. Since input points will be in
    // Lat/Long they need to be converted to map units
    // with applyLatLngToLayer
    var toLine = d3.line()
        // .interpolate("linear")
        .x(function (d) {
            return applyLatLngToLayer(d).x
        })
        .y(function (d) {
            return applyLatLngToLayer(d).y
        })
        .curve(d3.curveLinear)


    // From now on we are essentially appending our features to the
    // group element. We're adding a class with the line name
    // and we're making them invisible

    // these are the points that make up the path
    // they are unnecessary so I've make them
    // transparent for now
    var ptFeatures = g.selectAll("circle")
        .data(featuresdata)
        .enter()
        .append("circle")
        .attr("r", 3)
        .attr("class", "waypoints_" + id)
        .style("opacity", "0");

    // Here we will make the points into a single
    // line/path. Note that we surround the featuresdata
    // with [] to tell d3 to treat all the points as a
    // single line. For now these are basically points
    // but below we set the "d" attribute using the
    // line creator function from above.
    var linePath = g.selectAll(".lineConnect_" + id)
        .data([featuresdata])
        .enter()
        .append("path")
        .attr("class", "lineConnect_" + id)
        .style("fill", "none") // add a color
        .style("opacity", "unset") // add 0 to hide the path
        .attr("d", toLine)
        .style("stroke", "black")
        // .style("stroke", "white")
        .style("stroke-width", "2")

    // This will be our traveling circle it will
    // travel along our path
    var marker = g.append("circle")
        .attr("r", 10)
        .attr("id", "marker_" + id)
        .attr("class", "travelMarker_" + id)
        .style("fill", "yellow")

    // TODO should be optional and add argument
    var textmarker = g.append("text")
        .attr("font-family", "'Font Awesome 5 Free'")
        .attr("font-weight", 900)
        .text("\uf238")
        .attr("x", -5)
        .attr("y", 5)
        .attr("id", "markerText_" + id)
        .attr("class", "travelMarkerText_" + id)
        // https://fontawesome.com/cheatsheet


    // when the user zooms in or out you need to reset
    // the view
    map.on("zoom", reset);

    // this puts stuff on the map!
    reset();
    transition();

    // Reposition the SVG to cover the features.
    function reset() {
        // WARNING disabled after add svg with leaflet method...
        // var bounds = d3path.bounds(geojson_nodes),
        //     topLeft = bounds[0],
        //     bottomRight = bounds[1];


        // here you're setting some styles, width, heigh etc
        // to the SVG. Note that we're adding a little height and
        // width because otherwise the bounding box would perfectly
        // cover our features BUT... since you might be using a big
        // circle to represent a 1 dimensional point, the circle
        // might get cut off.
        ptFeatures.attr("transform",
            function (d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
            });

        // again, not best practice, but I'm harding coding
        // the starting point

        marker.attr("transform",
            function () {
                var y = featuresdata[0].geometry.coordinates[1]
                var x = featuresdata[0].geometry.coordinates[0]
                return "translate(" +
                    map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
                    map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")";
            });

        textmarker.attr("transform",
            function () {
                var y = featuresdata[0].geometry.coordinates[1]
                var x = featuresdata[0].geometry.coordinates[0]
                return "translate(" +
                    map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
                    map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")";
            });

        // WARNING disabled after add svg with leaflet method...
        // size and location of the overall SVG container
        // svg.attr("width", bottomRight[0] - topLeft[0] + 120)
        //     .attr("height", bottomRight[1] - topLeft[1] + 120)
        //     .style("left", topLeft[0] - 50 + "px")
        //     .style("top", topLeft[1] - 50 + "px");

        linePath.attr("d", toLine)
        // WARNING disabled after add svg with leaflet method...
        // g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

    }

    function transition() {
        linePath.transition()
            .duration(7500)
            .attrTween("stroke-dasharray", tweenDash)
            // .on("end", function () {
            //     d3.select(this).call(transition);// infinite loop
            // });
    }

    // this function feeds the attrTween operator above with the
    // stroke and dash lengths
    function tweenDash() {
        return function (t) {
            //total length of path (single value)
            var l = linePath.node().getTotalLength();

            interpolate = d3.interpolateString("0," + l, l + "," + l);
            //t is fraction of time 0-1 since transition began
            var marker = d3.select("#marker_" + id);
            var textmarker = d3.select("#markerText_" + id);

            var p = linePath.node().getPointAtLength(t * l);

            //Move the marker to that point
            marker.attr("transform", "translate(" + p.x + "," + p.y + ")"); //move marker
            textmarker.attr("transform", "translate(" + p.x + "," + p.y + ")"); //move marker

            return interpolate(t);
        }
    }

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
}

function applyLatLngToLayer(d) {
    var y = d.geometry.coordinates[1]
    var x = d.geometry.coordinates[0]
    return map.latLngToLayerPoint(new L.LatLng(y, x))
}

function applyLayerToLatLng(coordinates) {
    return map.layerPointToLatLng(coordinates)

}

