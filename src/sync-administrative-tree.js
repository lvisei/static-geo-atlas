const fs = require("fs");
const { TEMP_DIR } = require("./constants");
const { generateOrganizationTree } = require("./utils/index");

const AdministrativeList = JSON.parse(
  fs.readFileSync(`${TEMP_DIR}/administrative-list.json`, "utf8")
);

const areaTree = generateOrganizationTree(AdministrativeList, {
  id: "adcode",
  pid: "parent",
  lable: "name",
});

fs.writeFile(
  `${TEMP_DIR}/administrative-tree.json`,
  JSON.stringify(areaTree, null, 2),
  (err) => {
    if (err) {
      console.log(`文件写入失败(${err})`);
    } else {
      console.log(`写入成功！`);
    }
  }
);
