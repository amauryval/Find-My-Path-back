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
                                '<input id="node_activation" type="checkbox" unchecked autocomplete="off">Activer la saisie' +
                            '</label>' +
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


        var coord_data = $('<a class="col-sm-6 coordinate_found">Point N°' + ($("#path_coords_list li").length + 1) + '</a>')
        coord_data.attr("data-x", e.latlng.lng)
        coord_data.attr("data-y", e.latlng.lat)

        var coord_info = $(
            '<div class="row">' +
                coord_data[0].outerHTML +
                '<span class="right remove"><a href="#"><i class="svg-icon fas fa-trash"></i></a></span>' +
                '<span class="right up"><a href="#"><i class="svg-icon fas fa-arrow-up"></i></a></span>' +
                '<span class="right down"><a href="#"><i class="svg-icon fas fa-arrow-down"></i></a></span>' +
            '</div>'
        )

        $("#path_coords_list").append(
            $('<li>').append(coord_info)
        )
    }
    MapPathNodes()
}
map.on('click', GetCoordinatesOnClick)

function MapPathNodes() {
    var pathNodesData = {
        "type": "FeatureCollection",
        "features": []
    }
    $(".coordinate_found").each(function(i) {
        var coords = $(this).text().split(" ")
        pathNodesData.features.push(
            {
                "type": "Feature",
                "properties": {"position": i + 1, "id": i},
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        $(this).attr("data-x"), $(this).attr("data-y")
                    ]
                }
            }
        )
    })

    $("#SvgPathNodes").remove()
    mapPoints(pathNodesData, [0, 100], "SvgPathNodes")
}