function ViewSetterHandler() {
    var controler = $(
        '<div id="view_setter" class="legend container leaflet-control">' +
            '<div id="view-setter-container" class="row">' +
                '<div class="setter-title col-sm-12">Afficher un territoire</div>' +
                '<div class="setter-elements col-sm-12">' +
                    '<div class="row">' +
                        '<div class="col-sm-8">' +
                            '<input class="input-xlarge" id="focusedInput" type="text" value="Saisir votre territoire...">' +
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
        '<div id="path_setter" class="legend container leaflet-control">' +
            '<div id="path-setter-container" class="row">' +
                '<div class="setter-title col-sm-12">Définisser votre chemin</div>' +
                '<div class="setter-elements col-sm-12">' +
                    '<div class="row">' +
                        '<div class="col-sm-6">' +
                            '<label class="btn btn-secondary active">' +
                                '<input id="node_activation" type="checkbox" unchecked autocomplete="off">Edition' +
                            '</label>' +
                        '</div>' +
                        '<div class="col-sm-6">' +
                            '<button class="btn btn-secondary" onclick="downloadNodesPath()">Download File</button>' +
                        '</div>' +
                        '<div class="setter-sub-title col-sm-12">Noeuds définis</div>' +
                            '<ol id="path_coords_list" class="col-sm-12">' +
                            '</ol>' +
                        '</div>' +
                        '<div class="col-sm-6">' +
                            '<button id="path_setter_validation" type="button" class="btn btn-primary">Valider</button>' +
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
    var node_activation_status = $("#node_activation")
    if ( node_activation_status.is(':checked') ) {

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
    download("nodes_path.geojson",pathNodesData)
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

    var url_build = `http://127.0.0.1:5000/api/v1/data?geojson=${JSON.stringify(pathNodesData)}`;

    $.ajax({
        url: url_build,
        async: true,
        success: function (result) {

            console.log("ah!")
            d3.selectAll("#SvgPathBuildAnimated").remove()
            d3.selectAll("#SvgPathBuild").remove()
                        map._onResize()

            mapLine(result["path"]["data"], "SvgPathBuild")
            animatePointOnLine(result["path"]["data"], "SvgPathBuildAnimated")
        },
    })
})