// 生成uid
function guid() {
    let res = "";
    for (let i = 1; i <= 8; i++) {
        let n = Math.floor(Math.random() * 16.0).toString(16);
        res += n;
    }
    return res;
}

module.exports = {
    guid
}