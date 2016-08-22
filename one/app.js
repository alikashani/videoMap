google.maps.visualRefresh = true;
function getInputCoordinates() {
  var value=$('#input-coordinates').val();
  if (value) value=value.replace(/\r\n/g,'\n').replace(/\n\r/g,'\n').replace(/\r/g,'\n');

  return $.trim(value);
}

var renderMarker,
    renderMarkers,
    clearMarkers,
    posFromLatlng,
    addSearchMarker = false,
    renderAutofitmap = true;

var geocoder = new google.maps.Geocoder();

$(document).ready(function() {
  var bounds = new google.maps.LatLngBounds();
  var markers = [],
      mapMain = new google.maps.Map(document.getElementById('map-canvas'), {
        center: new google.maps.LatLng(40.783333, -73.950000),
        zoom: 15,
        disableDoubleClickZoom: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        noClear:true,
        panControl:true,
        zoomControl:true,
        scaleControl:true,
        scaleControlOptions:{position:google.maps.ControlPosition.BOTTOM_RIGHT},
        streetViewControl: false,
        minZoom:4
      });

  $('#input-coordinates').focus(function(){
    $(this).addClass('selected');
  });

  $('#input-coordinates').blur(function(){
    $(this).removeClass('selected');
  });

  function finalizeRenderMarkers () {
    if (renderAutofitmap)	{
      var count = markers.length;
      if (count > 1)
        mapMain.fitBounds(bounds);
      else if (count == 1)
        mapMain.setCenter(markers[0].getPosition());
    }
  };

  clearMarkers = function () {
    var l = markers.length;
    for(var i = 0; i < l; i++)
      markers[i].setMap(null);

    bounds = new google.maps.LatLngBounds();
  };

  posFromLatlng = function(latlng) {
    var temp = latlng.split(',');

    if (temp.length != 2 || isNaN(temp[0]) || isNaN(temp[1])) {temp = latlng.split('\t');}
    if (temp.length != 2 || isNaN(temp[0]) || isNaN(temp[1])) {temp = latlng.split(' ');}
    if (temp.length != 2 || isNaN(temp[0]) || isNaN(temp[1])) return false;

    var lat = parseFloat(temp[0]);
    var lng = parseFloat(temp[1]);
    return new google.maps.LatLng(lat, lng);
  };

  renderMarker = function (latlng, callback) {
    var position = posFromLatlng(latlng);
    if (!position) {if (callback) callback(); return;}
    bounds.extend(position);

    var marker = new google.maps.Marker({
      position : position,
      icon     : new google.maps.MarkerImage ('img/minireddot.png'),
      map      : mapMain,
      title    : latlng
    });

    markers.push(marker);
    if (callback) callback(marker);
  };

  renderMarkers = function () {
    clearMarkers();
    var coords = getInputCoordinates();
    if (coords == '') return;

    coords = coords.split('\n');
    var i = 0,
        l = coords.length,
        rendered = 0;

    for(i = 0; i < l; i++)
      eval("setTimeout(function(){renderMarker('" + coords[i] + "',function(marker){rendered++;if (rendered==l) finalizeRenderMarkers();});},0);");
  };

  var searchinput = document.getElementById('searchinput');

  $(searchinput).keypress(function (evt) {
    var charCode = evt.charCode || evt.keyCode;
    if (charCode  == 13) { //Enter key's keycode
      return false;
    }
  });

  var searchAuto = new google.maps.places.Autocomplete(searchinput);

  google.maps.event.addListener(searchAuto, 'place_changed', function() {
    var place = searchAuto.getPlace();
    var pos = place.geometry.location;
    $(searchinput).attr('data-location', pos.lat() + ',' + pos.lng());
    $(searchinput).attr('data-value', $(searchinput).val());
  });
  searchAuto.bindTo('bounds', mapMain);

  $(searchinput).blur(function() {
    var value = $(this).val();
    if ($(this).attr('data-value') !== value) {
      $(this).attr('data-value', value);
      $(searchinput).removeAttr('data-location');
    }
  });

  $('#searchbutton').click(function() {
    var latlng = $(searchinput).attr('data-location');
    if (latlng && latlng != '') {
      if (!addSearchMarker) {
        var postion = posFromLatlng(latlng);
        if (postion) mapMain.setCenter(postion);
      }
      else {
        renderMarker(latlng, function(marker){
          var coords = getInputCoordinates();
          coords = coords.split('\n');
          coords.push(latlng);

          $('#input-coordinates').val(coords.join('\n'));

          mapMain.setCenter(marker.getPosition());
        });
      }
    }
    else {
      var value = $(searchinput).val();
      if (value != '') {
        value = $.trim(value);
        if (value != '') {
          geocoder.geocode( { 'address': value}, function(results, status) {
            if (status != google.maps.GeocoderStatus.OK) return;
            var postion = results[0].geometry.location;
            if (!addSearchMarker)
              mapMain.setCenter(postion);
            else {
              latlng=postion.lat()+','+postion.lng();
              renderMarker(latlng,function(marker){
                var coords = getInputCoordinates();
                coords = coords.split('\n');
                coords.push(latlng);
                $('#input-coordinates').val(coords.join('\n'));
                mapMain.setCenter(marker.getPosition());
              });
            }
          });
        }
      }
    }
  });

  $('#input-coordinates').blur();
  renderMarkers();
});
