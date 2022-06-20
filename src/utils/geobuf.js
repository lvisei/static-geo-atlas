const Pbf = require("pbf");
const geobuf = require("geobuf");

function json2geobuf(geojson) {
  const buffer = geobuf.encode(geojson, new Pbf());
  return buffer;
}

function geobuf2json(buf) {
  const geojson = geobuf.decode(new Pbf(buf));
  const data = JSON.stringify(geojson);
  return data;
}

module.exports = { json2geobuf, geobuf2json };
