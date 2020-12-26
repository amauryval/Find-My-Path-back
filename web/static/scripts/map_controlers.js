function ViewSetterHandler() {
    var controler = $(
        '<form class="col-sm-12">' +
          '<div class="form-group">' +
            '<label for="location_value">Secteur géographique</label>' +
            '<input type="text" class="form-control" id="location_value" aria-describedby="location_value_help" placeholder="blabla">' +
          '</div>' +
          '<button id="view_setter_validation" type="submit" class="btn btn-primary">Valider</button>' +
        '</form>'
    )
    $("#study_area").append(controler)
}


function PathSetterHandler() {
    var controler = $(
        '<form class="col-sm-12">' +

            '<fieldset class="form-group">' +
                '<div class="row">' +
                  '<legend class="col-form-label col-sm-2 pt-0">Modes</legend>' +
                  '<div class="col-sm-10">' +
                    '<div class="form-check">' +
                        '<input type="radio" id="mode_pedestrian" name="mode_options" value="pedestrian">' +
                        '<label for="mode_pedestrian">Marche à pied</label><br>' +
                    '</div>' +
                    '<div class="form-check">' +
                        '<input type="radio" id="mode_vehicle" name="mode_options" value="vehicle">' +
                        '<label for="mode_vehicle">Véhicules</label><br>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
            '</fieldset>' +

            '<fieldset class="form-group">' +
                '<div class="row">' +
                  '<legend class="col-form-label col-sm-4 pt-0">Edition</legend>' +
                  '<div class="col-sm-8">' +
                    '<div class="form-check">' +
                        '<input class="form-check-input" type="checkbox" value="" id="edition_mode">' +
                        '<label class="form-check-label" for="edition_mode">Activer le mode édition</label>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
            '</fieldset>' +

            '<fieldset class="form-group">' +
                '<div class="row">' +
                  '<legend class="col-form-label col-sm-4 pt-0">Elevation</legend>' +
                  '<div class="col-sm-8">' +
                    '<div class="form-check">' +
                        '<input class="form-check-input" type="checkbox" value="" id="elevation_mode">' +
                        '<label class="form-check-label" for="elevation_mode">Calcul de la courbe topographique</label>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
            '</fieldset>' +

            '<button id="path_setter_validation" type="submit" class="btn btn-primary">Valider</button>' +
        '</form>'
    )
    $("#nodes_builder").append(controler)
}

function NodesPart() {
    var nodes_content = $(
        '<div class="col-sm-12">' +
            '<ol id="path_coords_list"></ol>' +
        '</div>'
    )
    $("#nodes_results").append(nodes_content)
}



function DownloadSetterHandler() {
    var controler = $(
        '<div class="col-sm-6">' +
            '<button class="btn btn-secondary" onclick="downloadNodesPath()">Noeuds</button>' +
        '</div>' +
        '<div class="col-sm-6">' +
            '<button class="btn btn-secondary" onclick="downloadPath()">Chemin</button>' +
        '</div>'
    )
    $("#outputs").append(controler)
}


ViewSetterHandler()
PathSetterHandler()
NodesPart()
DownloadSetterHandler()


// to disable click map on map divs
$(".legend").each(function () {
    L.DomEvent.disableClickPropagation(this)
})


$("#path_coords_list").on('click', '.remove a', function(){
    $(this).closest('li').remove()
    MapPathNodes()
})

$("#path_coords_list").on('click', '.up a', function(){
    var a = $(this).closest('li')
    a.prev().before(a);
    MapPathNodes()
});

$("#path_coords_list").on('click', '.down a', function(){
    var a = $(this).closest('li')
    a.next().after(a);
    MapPathNodes()
});

function GetCoordinatesOnClick(e) {
    var edition_mode_status = $("#edition_mode")
    if ( edition_mode_status.is(':checked') ) {

        var coord_data = $(
            '<div class="coords_element">' +
                '<div class="input-group coordinate_content">' +
                    '<span class="centered">Noeud ' + ($("#path_coords_list li").length + 1) + '</span>' +
                    '<input type="text" class="centered" aria-label="With textarea">' +
                    '<span class="remove"><a href="#"><i class="svg-icon fas fa-trash"></i></a></span>' +
                    '<span class="up"><a href="#"><i class="svg-icon fas fa-arrow-up"></i></a></span>' +
                    '<span class="down"><a href="#"><i class="svg-icon fas fa-arrow-down"></i></a></span>' +
                '</div>' +
            '</div>'
        )

        coord_data.attr("data-x", e.latlng.lng)
        coord_data.attr("data-y", e.latlng.lat)


        // to activate keyboard event because we have to wait the page... tricky...
        $(document).ready(function() {
            $(".coords_element").keyup(function (e) {
                MapPathNodes()
            });
        })

        $("#path_coords_list").append(
            $('<li>').append(coord_data)
        )

        $('#path_coords_list li').on("mouseover", function (d) {
            var svgCircle = $($("#SvgPathNodes circle")[$(this).index()])[0]
            animationNode(svgCircle)
        });
        $('#path_coords_list li').on("mouseout", function (d) {
            var svgCircle = $($("#SvgPathNodes circle")[$(this).index()])[0]
            $(svgCircle).find("animate").remove()
        });

    }
    MapPathNodes()
}
map.on('click', GetCoordinatesOnClick)

var pathNodesData;
var linePathData;
var PointPathData;

function MapPathNodes() {
    pathNodesData = null
    pathNodesData = {
        "type": "FeatureCollection",
        "features": []
    }
    $(".coords_element").each(function(i) {
        pathNodesData.features.push(
            {
                "type": "Feature",
                "properties": {
                    "position": i + 1,
                    "topo_uuid": i,
                    "id": i,
                    "name":  $(this).find("input")[0].value
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        parseFloat($(this).attr("data-x")), parseFloat($(this).attr("data-y"))
                    ]
                }
            }
        )
    })

    $("#SvgPathNodes").remove()
    var geojson_data = Object.create(pathNodesData);
    mapPoints(geojson_data, [0, 100], "SvgPathNodes")
}

function downloadNodesPath() {
    if (pathNodesData.type === "FeatureCollection") {
        download("nodes_path.geojson", pathNodesData)
    }
}

function downloadPath() {
    if (linePathData.type === "FeatureCollection") {
        download("path.geojson", linePathData)
    }

}


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(text)))
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function animationNode(node) {
    var rAnim = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
    rAnim.setAttribute("attributeName", "r");
    rAnim.setAttribute("from", node.r.baseVal.value);
    rAnim.setAttribute("to", node.r.baseVal.value * 4);
    rAnim.setAttribute("dur", "1.5s");
    rAnim.setAttribute("begin", "0s");
    rAnim.setAttribute("repeatCount", "indefinite");
    node.append(rAnim)

    var opacityAnim = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
    opacityAnim.setAttribute("attributeName", "opacity");
    opacityAnim.setAttribute("from", "1");
    opacityAnim.setAttribute("to", "0");
    opacityAnim.setAttribute("dur", "1.5s");
    opacityAnim.setAttribute("begin", "0s");
    opacityAnim.setAttribute("repeatCount", "indefinite");
    node.append(opacityAnim)
}



$("#path_setter_validation").on("click", function() {
    // mode selection
    var mode_vehicle = $('#mode_vehicle')
    var mode_pedestrian = $('#mode_pedestrian')
    if ( mode_vehicle.is(':checked') ) {
        var mode = mode_vehicle.attr("value")
    } else if ( mode_pedestrian.is(':checked') ) {
        var mode = mode_pedestrian.attr("value")
    } else {
        alert("Choose a mode please")
        return
    }

    var elevation_status = $("#elevation_mode")

    if ( elevation_status.is(':checked') ) {
        var elevation_mode = "enabled"
    } else {
        var elevation_mode = "disabled"
    }

     var url_build = `http://localhost:5000/api/v1/path?elevation_mode=${elevation_mode}&mode=${mode}&geojson=${JSON.stringify(pathNodesData)}`;
//    var url_build = `https://find-my-path.herokuapp.com/api/v1/path?elevation_mode=${elevation_mode}&mode=${mode}&geojson=${JSON.stringify(pathNodesData)}`;

    $.ajax({
        url: url_build,
        async: true,
        success: function (result) {
            if (typeof result["points_path"] === 'string' || result["points_path"] instanceof String) {
                alert("Reduce your working area (max 10km). Overpass api and heroku could be very angry ;)")
            } else {
                console.log("ah!")
                d3.selectAll("#SvgPathBuildAnimated").remove()
                d3.selectAll("#SvgPathBuild").remove()
                map._onResize()
                linePathData = result["line_path"]
                PointPathData = result["points_path"]

                // mapLine(result["path"]["data"], "SvgPathBuild")

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
    var location = $('#location_value').val()

     var url_build = `http://localhost:5000/api/v1/location?name=${JSON.stringify(pathNodesData)}`;
//    var url_build = `https://find-my-path.herokuapp.com/api/v1/location?name=${location}`;

    $.ajax({
        url: url_build,
        async: true,
        success: function (result) {
            if ( result["bbox"] === 'Not found') {
                alert("Location not found")
            } else {

                map.fitBounds([
                    [result["bbox"][0], result["bbox"][2]],
                    [result["bbox"][1], result["bbox"][3]]
                ]);
            }

        },
    })
})