const fs = require("fs");

const copyFile = (form, to) => {
  fs.readFile(form, "utf8", (err, data) => {
    if (err) {
      console.log(`文件读取失败(${(form, err)})`);
      return;
    }
    fs.writeFile(to, JSON.stringify(JSON.parse(data)), (err) => {
      if (err) {
        console.log(`文件写入失败(${(to, err)})`);
      }
    });
  });
};

copyFile(
  ".temp/administrative-list.json",
  "geo-data/administrative-data/area-list.json"
);
copyFile(
  ".temp/administrative-tree.json",
  "geo-data/administrative-data/area-tree.json"
);
