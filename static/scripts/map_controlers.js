function ViewSetterHandler() {
    var controler = $(
        '<div id="view_setter" class="container leaflet-control legend-object">' +
            '<div id="view-setter-container-title-container" class="row legend-title">' +
                '<div class="setter-title col-sm-12">Afficher un territoire</div>' +
            '</div>' +
            '<div id="view-setter-container" class="row">' +
                '<div class="setter-elements col-sm-1"></div>' +
                '<div class="setter-elements col-sm-11 legend">' +
                    '<div class="row">' +
                        '<div class="col-sm-8">' +
                            '<input class="input-xlarge" id="location_value" type="text" value="">' +
                        '</div>' +
                        '<div class="col-sm-4">' +
                            '<button id="view_setter_validation" type="button" class="btn btn-primary">Valider</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    )
    $(".leaflet-bottom.leaflet-left").append(controler)
}


function PathSetterHandler() {
    var controler = $(
        '<div id="path_setter" class="container leaflet-control legend-object">' +
            '<div id="path-setter-container-title-container" class="row legend-title">' +
                '<div class="setter-title col-sm-12">Définir un chemin</div>' +
            '</div>' +

            '<div id="view-setter-container" class="row">' +
                 '<div class="setter-elements col-sm-1"></div>' +
                 '<div class="setter-elements col-sm-11 legend">' +
                    '<div class="row">' +
                        '<div class="setter-elements col-sm-8">' +
                            '<div class="setter-elements col-sm-12">' +
                                 '<div class="setter-sub-title col-sm-12">Choisissez le mode</div>' +
                                 '<div class="btn-group btn-group-toggle" data-toggle="buttons">' +
                                    '<label class="btn btn-secondary active">' +
                                        '<input type="radio" name="mode_options" value="pedestrian" id="mode_pedestrian" autocomplete="off" checked>pedestrian' +
                                    '</label>' +
                                    '<label class="btn btn-secondary">' +
                                        '<input type="radio" name="mode_options" id="mode_vehicle" value="vehicle" autocomplete="off">vehicle' +
                                    '</label>' +
                                 '</div>' +
                            '</div>' +
                            '<div class="setter-elements col-sm-12">' +
                                '<div class="setter-sub-title col-sm-12">Activer le mode édition</div>' +
                                '<div class=" btn-group btn-group-toggle" data-toggle="buttons">' +
                                    '<label class="btn btn-secondary active">' +
                                        '<input id="edition_mode" type="checkbox" unchecked autocomplete="off">Edition' +
                                    '</label>' +
                                '</div>' +
                            '</div>' +
                            '<div class="setter-elements col-sm-12">' +
                                '<div class="setter-sub-title col-sm-12">Activer le mode élevation</div>' +
                                '<div class=" btn-group btn-group-toggle" data-toggle="buttons">' +
                                    '<label class="btn btn-secondary active">' +
                                        '<input id="elevation_mode" type="checkbox" unchecked autocomplete="off">Elevation' +
                                    '</label>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="setter-elements col-sm-4">' +
                            '<button id="path_setter_validation" type="button" class="btn btn-primary">Valider</button>' +
                        '</div>' +

                        '<div class="setter-elements col-sm-12">' +
                            '<div class="setter-sub-title col-sm-12">Noeuds définis</div>' +
                            '<ol id="path_coords_list" class="col-sm-12"></ol>' +
                        '</div>' +
                    '</div>' +
                 '</div>' +
            '</div>' +
        '</div>'
    )
    $(".leaflet-bottom.leaflet-left").append(controler)
}

function DownloadSetterHandler() {
    var controler = $(
        '<div id="download_setter" class="container leaflet-control legend-object">' +
            '<div id="view-setter-container-title-container" class="row legend-title">' +
                '<div class="setter-title col-sm-12">Exporter les résultats</div>' +
            '</div>' +
            '<div id="view-setter-container" class="row">' +
                '<div class="setter-elements col-sm-1"></div>' +
                '<div class="setter-elements col-sm-11 legend">' +
                    '<div class="row">' +
                        '<div class="setter-elements col-sm-6">' +
                            '<button class="btn btn-secondary" onclick="downloadNodesPath()">Export des noeuds</button>' +
                        '</div>' +
                        '<div class="setter-elements col-sm-6">' +
                            '<button class="btn btn-secondary" onclick="downloadPath()">Export du chemin</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>'
    )
    $(".leaflet-bottom.leaflet-left").append(controler)
}

ViewSetterHandler()
PathSetterHandler()
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

        var coord_data = $('<div class="col-sm-9 input-group coordinate_content">' +
          // '<div class="input-group-prepend">' +
            '<span class="centered">Point N°' + ($("#path_coords_list li").length + 1) + '</span>' +
          // '</div>' +
          '<textarea class="centered" aria-label="With textarea"></textarea>' +
        '</div>')

        coord_data.attr("data-x", e.latlng.lng)
        coord_data.attr("data-y", e.latlng.lat)

        var coord_info = $(
            '<div class="row coords_element">' +
                coord_data[0].outerHTML +
                '<span class="centered right remove"><a href="#"><i class="svg-icon fas fa-trash"></i></a></span>' +
                '<span class="centered right up"><a href="#"><i class="svg-icon fas fa-arrow-up"></i></a></span>' +
                '<span class="centered right down"><a href="#"><i class="svg-icon fas fa-arrow-down"></i></a></span>' +
            '</div>'
        )

        // to activate keyboard event because we have to wait the page... tricky...
        $(document).ready(function() {
            $("textarea").keyup(function (e) {
                MapPathNodes()
            });
        })

        $("#path_coords_list").append(
            $('<li>').append(coord_info)
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
    $(".coordinate_content").each(function(i) {
        pathNodesData.features.push(
            {
                "type": "Feature",
                "properties": {
                    "position": i + 1,
                    "topo_uuid": i,
                    "id": i,
                    "name":  $(this).find("textarea")[0].value
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

    // var url_build = `http://localhost:5000/api/v1/data?geojson=${JSON.stringify(pathNodesData)}`;
    var url_build = `https://test-animated-path.herokuapp.com/api/v1/path?elevation_mode=${elevation_mode}&mode=${mode}&geojson=${JSON.stringify(pathNodesData)}`;

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
            }

        },
    })
})


$("#view_setter_validation").on("click", function() {
    // mode selection
    var location = $('#location_value').val()

    // var url_build = `http://localhost:5000/api/v1/data?geojson=${JSON.stringify(pathNodesData)}`;
    var url_build = `https://test-animated-path.herokuapp.com/api/v1/location?name=${location}`;

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