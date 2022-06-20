const fs = require("fs");
const mvdir = require("mvdir");
const mapshaper = require("mapshaper");
const { json2geobuf } = require("./utils/geobuf");
const { TEMP_DIR } = require("./constants");

const AreaGranularity = JSON.parse(
  fs.readFileSync(`${TEMP_DIR}/choropleth-granularity.json`, "utf8")
);

const FeatureCollection = { type: "FeatureCollection", features: [] };

const simplifyGeoJson = (geojson, percentage = 15) => {
  // mapshaper input.json -simplify 15% -o simplified.json
  const input = { json: geojson };
  const cmd = `-i json -simplify visvalingam  ${percentage}% -o format=geojson  simplified.json`;
  return mapshaper.applyCommands(cmd, input).then((result) => {
    return result["simplified.json"];
  });
};

const topologyGeoJson = (geojson) => {
  // mapshaper input.json -o format=topojson topo.json
  const input = { json: geojson };
  const cmd = "-i json name=json -o format=topojson  topo.json";
  return mapshaper.applyCommands(cmd, input).then((result) => {
    return result["topo.json"];
  });
};

for (const key in AreaGranularity) {
  if (!Object.hasOwnProperty.call(AreaGranularity, key)) continue;
  const level = key.split("_")[1];
  // if (level !== "country") {
  //   continue;
  // }
  const codes = AreaGranularity[key];
  if (codes.length === 0) {
    const filePath = `geo-data/choropleth-data/${level}/${key}`;
    fs.writeFile(
      `${filePath}.json`,
      JSON.stringify(FeatureCollection),
      (err) => {
        err && console.log(`json 文件写入失败, ${key}, (${err})`);
      }
    );
    topologyGeoJson(JSON.stringify(FeatureCollection)).then((topo) => {
      fs.writeFile(`${filePath}.topo.json`, topo, (err) => {
        err && console.log(`topo 文件写入失败, ${key}, (${err})`);
      });
    });
    // fs.writeFile(`${filePath}.pbf`, json2geobuf(FeatureCollection), (err) => {
    //   err && console.log(`pbf 文件写入失败, ${key}, (${err})`);
    // });
  } else {
    const featureList = [];
    for (let index = 0; index < codes.length; index++) {
      const code = codes[index];
      const { features } = JSON.parse(
        fs.readFileSync(`${TEMP_DIR}/area/${code}.json`, "utf8")
      );
      featureList.push(...features);
    }
    const geojson = { ...FeatureCollection, features: featureList };
    const filePath = `geo-data/choropleth-data/${level}/${key}`;

    // fs.writeFile(`${filePath}.json`, JSON.stringify(geojson), (err) => {
    //   err && console.log(`json 文件写入失败, ${key}, (${err})`);
    // });

    const simplifyPercent = level === "country" ? 4 : 15;
    simplifyGeoJson(JSON.stringify(geojson), simplifyPercent).then((output) => {
      fs.writeFile(`${filePath}.json`, output, (err) => {
        err && console.log(`json 文件写入失败, ${key}, (${err})`);
      });

      topologyGeoJson(output).then((topo) => {
        fs.writeFile(`${filePath}.topo.json`, topo, (err) => {
          err && console.log(`topo 文件写入失败, ${key}, (${err})`);
        });
      });

      //   // fs.writeFile(`${filePath}.pbf`, json2geobuf(geojson), (err) => {
      //   //   err && console.log(`pbf 文件写入失败, ${key}, (${err})`);
      //   // });
    });
  }
}

const specialChoroplethData = () => {
  // 100000_country_boundary
  mvdir(
    "config/100000_country_boundary.json",
    "geo-data/choropleth-data/country/100000_country_boundary.json",
    { copy: true }
  );
  mapshaper.runCommands(
    `-i config/100000_country_boundary.json name=json -o geo-data/choropleth-data/country/100000_country_boundary.topo.json format=topojson`
  );

  // all_world_country
  mapshaper.runCommands(
    `-i config/all_world_country.json -simplify visvalingam  50% -o geo-data/choropleth-data/world/all_world_country.json format=geojson`
  );
  mapshaper.runCommands(
    `-i config/all_world_country.json name=json -simplify visvalingam  50% -o geo-data/choropleth-data/world/all_world_country.topo.json format=topojson`
  );
};

specialChoroplethData();
