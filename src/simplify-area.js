const mapshaper = require("mapshaper");
const { TEMP_DIR } = require("./constants");

mapshaper.runCommands(
  `-i ${TEMP_DIR}/area/*.json -simplify visvalingam  30% -o ${TEMP_DIR}/simplify-area/ format=geojson`
);
