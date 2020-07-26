var background_map = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
	maxZoom: 20,
    minZoom: 8,
    maxNativeZoom: 15,
	ext: 'png'
});

var map = L.map(
    'map',
     {
     	zoom: 6,
        zoomControl: false
     }
).addLayer(background_map).setView(
	[44.896741, 4.932861],
	8,
);

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