const fs = require("fs");
const { TEMP_DIR } = require("./constants");

const AdministrativeTree = JSON.parse(
  fs.readFileSync("config/administrative-tree-amap.json", "utf8")
);

const tree2list = (tree, list = [], parent = null) => {
  for (let index = 0; index < tree.length; index++) {
    const item = tree[index];
    const { districts, level, center } = item;
    const adcode = Number(item.adcode);
    const coordinates = center.split(",").map(Number);
    let name = item.name;
    let childrenNum = districts.length;

    // 过滤街道数据
    if (level === "street") {
      continue;
    }

    // 城市 北京天津上海 城区名称修改
    if ([110100, 120100, 310100].includes(adcode)) {
      if (adcode === 110100) {
        name = "北京市";
      } else if (adcode === 120100) {
        name = "天津市";
      } else if (adcode === 310100) {
        name = "上海市";
      }
    }

    // 合并重庆城区 500100 重庆郊县 500200
    if (adcode === 500000) {
      childrenNum = 1;
    }
    if ([500100, 500200].includes(adcode)) {
      if (500100 === adcode) {
        list.push({
          level,
          adcode: 500100,
          lng: 106.550483,
          lat: 29.563707,
          childrenNum: 38,
          parent: parent,
          name: "重庆市",
          // acroutes: [],
        });
      }
      tree2list(districts, list, 500100);
      continue;
    }

    list.push({
      name,
      level,
      adcode,
      lng: coordinates[0],
      lat: coordinates[1],
      childrenNum,
      parent,
      // acroutes: [],
    });
    if (districts.length) {
      tree2list(districts, list, adcode);
    }
  }

  return list;
};

const AdministrativeList = tree2list(AdministrativeTree);

// 填补城市行政级别区域空白(省份行政级别)
// 台湾省 710000 香港特别行政区 810000 澳门特别行政区 820000
const SpecialProvinceCityCodes = [710000, 810000, 820000];
const SpecialProvinceCity = AdministrativeList.filter(({ adcode }) =>
  SpecialProvinceCityCodes.includes(adcode)
).map((item) =>
  Object.assign({}, item, { level: "city", parent: item.adcode })
);
AdministrativeList.push(...SpecialProvinceCity);

// 行政编码从小到大排序
AdministrativeList.sort((current, next) => current.adcode - next.adcode);

// country
const AllWorldCountry = JSON.parse(
  fs.readFileSync("config/all_world_country.json", "utf8")
);
const CountryList = AllWorldCountry.features
  .map(({ properties }) => {
    const { name, english, abbreviation, centroid, level } = properties;
    if (level !== "country") return;
    if (name === "中华人民共和国") return;
    const item = {
      name,
      level: "country",
      adcode: name,
      lng: centroid[0],
      lat: centroid[1],
      childrenNum: 0,
      parent: null,
    };

    return item;
  })
  .filter(Boolean);
AdministrativeList.push(...CountryList);

console.log(
  "province: ",
  AdministrativeList.filter(({ level }) => level === "province").length
);
console.log(
  "city: ",
  AdministrativeList.filter(({ level }) => level === "city").length
);
console.log(
  "district: ",
  AdministrativeList.filter(({ level }) => level === "district").length
);

fs.writeFile(
  `${TEMP_DIR}/administrative-list.json`,
  JSON.stringify(AdministrativeList, null, 2),
  (err) => {
    if (err) {
      console.log(`文件写入失败(${err})`);
    } else {
      console.log(`写入成功！`);
    }
  }
);
