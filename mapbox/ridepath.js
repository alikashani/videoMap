// Array of coordinates
var a = [];

// GeoJSON of route we'll call ride
var ride = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 0,
    properties: {
      name: 'Team MapBox'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-122.48369693756104, 37.83381888486939 ],
        [-122.48348236083984, 37.83317489144141 ],
        [-122.48339653015138, 37.83270036637107 ],
        [-122.48356819152832, 37.832056363179625],
        [-122.48404026031496, 37.83114119107971 ],
        [-122.48404026031496, 37.83049717427869 ],
        [-122.48348236083984, 37.829920943955045],
        [-122.48356819152832, 37.82954808664175 ],
        [-122.48507022857666, 37.82944639795659 ],
        [-122.48610019683838, 37.82880236636284 ],
        [-122.48695850372314, 37.82931081282506 ],
        [-122.48700141906738, 37.83080223556934 ],
        [-122.48751640319824, 37.83168351665737 ],
        [-122.48803138732912, 37.832158048267786],
        [-122.48888969421387, 37.83297152392784 ],
        [-122.48987674713133, 37.83263257682617 ],
        [-122.49043464660643, 37.832937629287755],
        [-122.49125003814696, 37.832429207817725],
        [-122.49163627624512, 37.832564787218985],
        [-122.49223709106445, 37.83337825839438 ],
        [-122.49378204345702, 37.83368330777276 ],
      ]
    }
  }]
}

// ---------------------------- Mapbox API Token ---------------------------- //
L.mapbox.accessToken = 'pk.eyJ1IjoiYWxpa2FzaGFuaSIsImEiOiJjaXJoaTVhYzAwMThxZzhreDliMmhqbGZ5In0.Sz16R2pFi6nTy0crgqwzFw';

// ----------------------------- Initialize Map ----------------------------- //
var map = L.mapbox.map('map', 'mapbox.streets', {
  closePopupOnClick:false,
  scrollWheelZoom:false
}).setView([37.833, -122.4912], 15);

// ------------------------------ Map Styling ------------------------------- //
function style(feature) {
  return {
    weight: 7,
    opacity: 1,
    color: '#0d8709',
    opacity: 0.7
  };
}

function newStyle(feature) {
  return {
    weight: 20,
    opacity: 1,
    color: '#ff0000',
    opacity: 0.7
  };
}

// --------------------- Initialize Route with GPS Data --------------------- //
var line = L.geoJson(ride, {
  style: style
}).addTo(map);

// ------------------------ Markers showing location ------------------------ //
var marker = L.marker([0, 0], {
  icon: L.mapbox.marker.icon({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-77, 37.9]
    },
    properties: {
      'marker-symbol': 'star'
    }
  })
}).addTo(map)

var newMarker = L.marker([0, 0], {
  icon: L.mapbox.marker.icon({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [33.694452, -117.847805]
    },
    properties: {
      'marker-symbol': 'star'
    }
  })
}).addTo(map);

// ---------------------- Store coordinates from ride ----------------------- //
var coords = ride.features[0].geometry.coordinates,
    x = 0;

// ----------------------- Handles moving of marker ------------------------- //
function tick() {
  if (marker) {
    try {
      marker.setLatLng([ coords[x][1], coords[x][0] ])
      // ensure the marker doesn't fall off the end of
      // the list of coordinates
      // 1000 ms is the time interval between points
      if (++x < coords.length) setTimeout(tick, 1000);
    } catch (TypeError) {
      console.log('`tick()` interrupted');
      console.log(TypeError)
    }
  }
}
tick();

// -------------------------- Bind video to marker -------------------------- //
marker.bindPopup('<iframe src="https://player.vimeo.com/video/69426498?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1" width="200" height="150" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>',
  {
    keepInView  : false,
    autoPan     : true,
    closeButton : false,
    maxWidth    : 1000
  }
).openPopup();

// -------------------------- Update video position-------------------------- //
marker._popup.setLatLng = function(latlng) {
  this._latlng = L.latLng(latlng);
  this._updatePosition();
  this._adjustPan();
}

// ---------------------- Check browser's file support ---------------------- //
if (window.File && window.FileReader && window.FileList && window.Blob) {}

// ---------------------- GeoJSON route to be plotted ----------------------- //
var irvineRide = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 0,
    geometry: {
      type: 'LineString',
      coordinates: []
    }
  }]
}

function readSingleFile(e) {
  var file = e.target.files[0];
  if (!file) { return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    displayContents(contents);
  };
  reader.readAsText(file);
}

// ---------------- Handles reading of file and updating map  --------------- //
myCoords = irvineRide.features[0].geometry.coordinates

function displayContents(contents) {
  var element = document.getElementById('file-content');
  element.innerHTML = contents;
  // Ali added:
  dataAsObject = JSON.parse(contents);
  coordOne = dataAsObject.coordinates;
  for (var i = 0; i < coordOne.length; i++) {
    a[i] = coordOne[i].map( x => Number(x) );
    a[i].shift();
    myCoords.push(a[i]);
  }

  console.log('Here is the coordinates from file: \n', myCoords);
  // var newLine = L.geoJson(irvineRide, {
  //   style: newStyle
  // }).addTo(map);
  var myLayer = L.mapbox.featureLayer()
    // .setGeoJSON({
    //   type: "FeatureCollection",
    //   features: [{
    //       type: "Feature",
    //       geometry: {
    //           type: "Point",
    //           coordinates: myCoords[0]
    //       },
    //       properties: { }
    //   }]
    // })
    .loadURL('a.geojson')
    .addTo(map);

  map.removeLayer(marker).setView(myCoords[0], 15);

  newMarker.setLatLng(myCoords[0]);
}

document.getElementById('file-input')
  .addEventListener('change', readSingleFile, false);

// TODO possible jQuery / AJAX call method ?
// var json = (function () {
//     var json = null;
//     $.ajax({
//         'async': false,
//         'global': false,
//         'url': my_url,
//         'dataType': "json",
//         'success': function (data) {
//             json = data;
//         }
//     });
//     return json;
// })();
