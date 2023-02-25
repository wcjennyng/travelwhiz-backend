var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

mapboxgl.accessToken = 'pk.eyJ1Ijoid2NqZW5ueW5nIiwiYSI6ImNsMDQ4YjI2eTE3dGczam9kdmo5cTZoYzMifQ.0OarcZH_ocP258XKrZ2Xvg';
var map = new mapboxgl.Map({
  container: 'YOUR_CONTAINER_ELEMENT_ID',
  style: 'mapbox://styles/mapbox/streets-v11'
});
