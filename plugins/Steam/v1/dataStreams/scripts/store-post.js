const steamStoreList = data.response.apps;

const myStoreList = steamStoreList.map(obj => ({
    appid: obj.appid,
    name: obj.name,
    last_modified: obj.last_modified,
}));

result = myStoreList;
