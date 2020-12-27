// node removing
$("#path_coords_list").on('click', '.remove a', function(){
    $(this).closest('li').remove()
    MapPathNodes()
})
// node up
$("#path_coords_list").on('click', '.up a', function(){
    var a = $(this).closest('li')
    a.prev().before(a);
    MapPathNodes()
});
// node down
$("#path_coords_list").on('click', '.down a', function(){
    var a = $(this).closest('li')
    a.next().after(a);
    MapPathNodes()
});

function GetCoordinatesOnClick(e) {
    var edition_mode_status = $("#edition_mode")
    if ( edition_mode_status.is(':checked') ) {
        let node_id = "node-" + ($("#path_coords_list li").length)
        var coord_data = $(
            '<div class="coords_element" id='+ node_id + '>' + // coordinates stored here
                '<div class="input-group coordinate_content">' +
                    '<span class="centered">Noeud ' + ($("#path_coords_list li").length) + '</span>' +
                    '<input type="text" class="centered" aria-label="With textarea">' +
                    '<span class="remove"><a href="#"><i class="svg-icon fas fa-trash"></i></a></span>' +
                    '<span class="up"><a href="#"><i class="svg-icon fas fa-arrow-up"></i></a></span>' +
                    '<span class="down"><a href="#"><i class="svg-icon fas fa-arrow-down"></i></a></span>' +
                '</div>' +
            '</div>'
        )

        coord_data.data("data-x", e.latlng.lng)
        coord_data.data("data-y", e.latlng.lat)


        // to activate keyboard event because we have to wait the page... tricky...
        $(document).ready(function() {
            $(".coords_element").keyup(function (e) {
                MapPathNodes()
            });
        })


        coord_data.on("mouseover", function (d) {
            console.log($(this).attr("id"))
            // var svgCircle = $()

            let circle_to_animate = d3.select("#SvgPathNodes #" + $(this).attr("id"))
            circle_bounce(circle_to_animate, 5, "factor")
            // animationNode(svgCircle)
        });
        coord_data.on("mouseout", function (d) {
            console.log($(this).index())
            // very important to interrupt the animation if the mouseout occured when animation is not finished
            let circle_to_animated = d3.select("#SvgPathNodes #" + $(this).attr("id"))
            circle_to_animated.interrupt();

            var svgCircle = $("#SvgPathNodes #" + $(this).attr("id"))[0]
            $(svgCircle).attr("r", "15")

        });

        $("#path_coords_list").append(
            $('<li>').append(coord_data)
        )


    }
    MapPathNodes()


}
map.on('click', GetCoordinatesOnClick)


var pathNodesData = {
    "type": "FeatureCollection",
    "features": []
};
var linePathData;
var PointPathData;

function MapPathNodes() {
    pathNodesData = null
    pathNodesData = {
        "type": "FeatureCollection",
        "features": []
    }
    $(".coords_element").each(function(pos) {
        pathNodesData.features.push(
            {
                "type": "Feature",
                "properties": {
                    "position": pos + 1,
                    "topo_uuid": pos,
                    "id": "node-" + pos,
                    "name":  $(this).find("input")[0].value
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        parseFloat($(this).data("data-x")),
                        parseFloat($(this).data("data-y"))
                    ]
                }
            }
        )
    })

    $("#SvgPathNodes").remove()
    // var geojson_data = Object.create(pathNodesData);
    mapPoints(pathNodesData, [0, 100], "SvgPathNodes")

}

$("#export_nodes").on("click", function() {
    if (pathNodesData.type === "FeatureCollection") {
        download("nodes_path.geojson", pathNodesData)
    }
})

$("#export_path").on("click", function() {
    if (linePathData.type === "FeatureCollection") {
        download("path.geojson", linePathData)
    }
})


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(text)))
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


$("#path_setter_validation").on("click", function() {
    // mode selection
    let mode_vehicle = $('#mode_vehicle')
    let mode_pedestrian = $('#mode_pedestrian')
    if ( mode_vehicle.is(':checked') ) {
        var mode = mode_vehicle.attr("value")
    } else if ( mode_pedestrian.is(':checked') ) {
        var mode = mode_pedestrian.attr("value")
    } else {
        alert("Séléctionnez un mode")
        return
    }

    if ( pathNodesData.features.length <= 1 ) {
        alert("Saisir au minimum 2 noeuds sur la carte")
        return
    }

    let elevation_status = $("#elevation_mode")
    var elevation_mode = "disabled"
    if ( elevation_status.is(':checked') ) {
        var elevation_mode = "enabled"
    }

     // var url_build = `http://localhost:5000/api/v1/path?elevation_mode=${elevation_mode}&mode=${mode}&geojson=${JSON.stringify(pathNodesData)}`;
   var url_build = `https://find-my-path.herokuapp.com/api/v1/path?elevation_mode=${elevation_mode}&mode=${mode}&geojson=${JSON.stringify(pathNodesData)}`;

    $.ajax({
        url: url_build,
        async: true,
        success: function (result) {
            if (typeof result["points_path"] === 'string' || result["points_path"] instanceof String) {
                alert("Reduce your working area (max 10km). Overpass api and heroku could be very angry ;)")
            } else {
                d3.selectAll("#SvgPathBuildAnimated").remove()
                d3.selectAll("#SvgPathBuild").remove()
                map._onResize()
                linePathData = result["line_path"]
                PointPathData = result["points_path"]

                map.fitBounds(L.geoJson(PointPathData).getBounds());

                animatePointOnLine(PointPathData, "SvgPathBuildAnimated")
                $("#svgTopoChart svg").remove()

                if ( elevation_mode === "enabled" ) {
                    createTopoChart()
                }

            }

        },
    })
})



$("#view_setter_validation").on("click", function() {
    // mode selection
    let location = $('#location_value').val()
    if ( location.length === 0 ) {
        alert("Définissez une zone d'étude avant de valider.")
        return
    }

     // let url_build = `http://localhost:5000/api/v1/location?name=${location}`;
   let url_build = `https://find-my-path.herokuapp.com/api/v1/location?name=${location}`;

    $.ajax({
        url: url_build,
        // async: true,
        success: function (result) {
            if ( result["bbox"] === 'Not found') {
                alert("Zone d'étude non trouvée")
            } else {

                map.fitBounds([
                    [result["bbox"][0], result["bbox"][2]],
                    [result["bbox"][1], result["bbox"][3]]
                ]);
            }

        },
    })
})


function circle_bounce(object, r_scale, op) {
  object
      .transition()
      .duration(1000)
      .ease(d3.easeElastic)
      .attr("r", function (d) {
          if ( op === "factor") {
              return $(this).attr("r") * r_scale
          } else if ( op === "divisor") {
              return $(this).attr("r") / r_scale
          }

      })
}