const fs = require("fs");
const { TEMP_DIR } = require("./constants");

const AdministrativeList = JSON.parse(
  fs.readFileSync(`${TEMP_DIR}/administrative-list.json`, "utf8")
);

const provinceList = AdministrativeList.filter(
  ({ level }) => level === "province"
);
const cityList = AdministrativeList.filter(({ level }) => level === "city");
const districtList = AdministrativeList.filter(
  ({ level }) => level === "district"
);

const Map = {};

/**
 * country
 **/
Map["100000_country_country"] = [100000];
// 100000_country_province: ['101000']
Map["100000_country_province"] = provinceList.map(({ adcode }) => adcode);
// 100000_country_city: []
Map["100000_country_city"] = cityList.map(({ adcode }) => adcode);
// 100000_country_district: []
Map["100000_country_district"] = districtList.map(({ adcode }) => adcode);

/**
 * province
 **/
provinceList.forEach(({ adcode }) => {
  //  xxx_province_province
  Map[`${adcode}_province_province`] = [adcode];

  //  xxx_province_city
  Map[`${adcode}_province_city`] = cityList
    .filter(({ parent }) => parent === adcode)
    .map(({ adcode }) => adcode);

  //  xxx_province_district
  const citys = cityList
    .filter(({ parent }) => parent === adcode)
    .map(({ adcode }) => adcode);
  Map[`${adcode}_province_district`] = districtList
    .filter(({ parent }) => citys.includes(parent))
    .map(({ adcode }) => adcode);
});

/**
 * city
 **/
cityList.forEach(({ adcode }) => {
  //  xxx_city_city
  Map[`${adcode}_city_city`] = [adcode];
  //  xxx_city_district
  Map[`${adcode}_city_district`] = districtList
    .filter(({ parent }) => parent === adcode)
    .map(({ adcode }) => adcode);
});

/**
 * district
 **/
//  xxx_district_district
districtList.forEach(({ adcode }) => {
  Map[`${adcode}_district_district`] = [adcode];
});

fs.writeFile(
  `${TEMP_DIR}/choropleth-granularity.json`,
  JSON.stringify(Map, null, 2),
  (err) => {
    if (err) {
      console.log(`文件写入失败(${err})`);
    } else {
      console.log(`写入成功！`);
    }
  }
);
