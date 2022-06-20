const generateOrganizationTree = (list, config) => {
  const id = config.id || "id";
  const pid = config.pid || "pid";
  const children = config.children || "children";
  const lable = config.lable || "lable";
  const pConfig = config.pConfig || {};
  const pConfigKey = Object.keys(pConfig);
  const idMap = {};
  const jsonTree = [];
  list.forEach((v) => (idMap[v[id]] = v));
  list.forEach((v) => {
    const parent = idMap[v[pid]];
    if (parent) {
      !parent[children] && (parent[children] = []);
      v["title"] = v[lable];
      parent[children].push(v);
    } else {
      pConfigKey.forEach((key) => {
        v[key] = pConfig[key];
      });
      v["title"] = v[lable];
      jsonTree.push(v);
    }
  });

  return jsonTree;
};

module.exports = { generateOrganizationTree };
