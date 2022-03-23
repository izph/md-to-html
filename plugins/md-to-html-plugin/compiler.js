

function compileHTML(_mdArr) { // _mdArr数组内容
    // console.log(_mdArr)
    const _htmlPool = createTree(_mdArr)
    // console.log(_htmlPool);
    let _htmlStr = '';
    let item;
    for (let k in _htmlPool) {
      console.log(k, _htmlPool[k]);
      item = _htmlPool[k];
  
      if (item.type === 'single') {
        item.tags.forEach(tag => {
          _htmlStr += tag;
        });
      } else if (item.type === 'wrap') {
        let _list = `<${k.split('-')[0]}>`;
        item.tags.forEach(tag => {
          _list += tag;
        })
        _list += `</${k.split('-')[0]}>`;
  
        _htmlStr += _list
      }
    }
  
    return _htmlStr;
  
  }
  
  module.exports = {
    compileHTML
  }