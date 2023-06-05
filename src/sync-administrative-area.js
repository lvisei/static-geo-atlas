const fs = require("fs");
const https = require("https");
const turf = require("@turf/turf");
const { AMAP_KEY, TEMP_DIR } = require("./constants");

const AdministrativeList = JSON.parse(
  fs.readFileSync(`${TEMP_DIR}/administrative-list.json`, "utf8")
);

function httpRequest(params, postData) {
  return new Promise(function (resolve, reject) {
    const req = https.request(params, function (res) {
      // reject on bad status
      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.log("res: ", res);
        return reject(new Error("statusCode=" + res.statusCode));
      }
      // cumulate data
      let body = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      // resolve on end
      res.on("end", function () {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });
    // reject on request error
    req.on("error", function (err) {
      // This is not a "Second reject", just a different sort of failure
      reject(err);
    });
    if (postData) {
      req.write(postData);
    }
    // IMPORTANT
    req.end();
  });
}

function requestArea(code) {
  return httpRequest({
    hostname: "restapi.amap.com",
    method: "GET",
    port: 443,
    path:
      "/v3/config/district?" +
      `key=${AMAP_KEY}&keywords=${code}&subdistrict=0&extensions=all`,
  });
}

const areaList = AdministrativeList.filter(({ level }) => level === "district");

function saveArea(areaList) {
  for (let index = 0; index < areaList.length; index++) {
    const { adcode, level, name, parent, childrenNum } = areaList[index];
    let reuestAdcode = adcode;
    // 重庆城区(500100)、重庆郊县(500200) 合并到 重庆市(500100)
    if (adcode === 500100) {
      reuestAdcode = 500000;
    }
    requestArea(reuestAdcode)
      .then(function (body) {
        const [district] = body.districts;
        const { center, polyline } = district;
        const coordinates = polyline.split("|").map((line) => {
          const coordinate = line
            .split(";")
            .map((lonlat) => lonlat.split(",").map(Number));
          return [coordinate];
        });
        const multiPoly = turf.multiPolygon(coordinates, {
          adcode,
          level,
          name,
          parent: { adcode: parent },
          childrenNum,
          center: center.split(",").map(Number),
          centroid: center.split(",").map(Number),
        });
        const featureCollection = turf.featureCollection([multiPoly]);
        const fileName = `${TEMP_DIR}/area/${adcode}.json`;
        fs.writeFile(fileName, JSON.stringify(featureCollection), (err) => {
          if (err) {
            console.log(`文件写入失败(${(adcode, err)})`);
          }
        });
      })
      .catch((err) => {
        console.log("err: ", err, adcode, level, name);
      });
  }
}

function chunk(list, num = 1) {
  const result = [];
  list.forEach(function (item, index) {
    if (index % num === 0) {
      result.push([]);
    }
    result[result.length - 1].push(item);
  });
  return result;
}

const chunkList = chunk(areaList, 50);

for (let index = 0; index < chunkList.length; index++) {
  const list = chunkList[index];
  setTimeout(() => {
    saveArea(list);
  }, 1000 * 1 * index);
}
