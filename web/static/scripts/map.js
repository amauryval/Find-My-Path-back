
var max_zoom = 17
var min_zoom = 9

var background_map = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: max_zoom,
    minZoom: min_zoom,
    maxNativeZoom: max_zoom,
	ext: 'png'
});

var map = L.map(
    'map',
     {
     	// zoom: min_zoom,
        zoomControl: true
     }
).addLayer(background_map).setView(
	[45.754649, 4.858618],
	10,
);
setTimeout(() => {
    map.invalidateSize()
}, 100)
$('.leaflet-bottom.leaflet-right').insertAfter('.leaflet-top.leaflet-right');

// disableMapInteractivity(map);


function activateMapInteractivity(map) {
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
	map.dragging.enable();
};

function disableMapInteractivity(map) {
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
	map.dragging.disable();
};

function setMapView(latLngObject, zoom) {
    var LatLng = new L.LatLng(
        latLngObject.geometry.coordinates[1],
        latLngObject.geometry.coordinates[0]
    );
    map.setView(
        [LatLng.lat, LatLng.lng],
        zoom,
        {
            animate: false
        }
    );
};