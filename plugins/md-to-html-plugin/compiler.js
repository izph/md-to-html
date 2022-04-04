const { guid } = require('./util');

const { basename } = require('path');

const {
  REG_MARK,
  REG_TITLE,
  REG_ORDER,
  REG_DISORDER,
  REG_LINK,
  REG_IMG,
  TAGTYPE_SIMPLE,
  TAGTYPE_NESTING,
  REG_LINK_STYLE
} = require('./constant');

function createTree(tplArr) {
  // 存放结果
  let _htmlTree = {};

  // 上一个标识符
  let _lastMark = '';

  let _key = 0;

  // 字符串相关的东西最好不要做封装，老老实实的写最好，不同的标签有不同的处理方法
  tplArr.forEach((tplItem) => {
    // 去掉\r回车的影响
    tplItem = tplItem.replace(/\r/, '');
    // console.log(tplItem)

    // 正则
    const matched_mark = tplItem.match(REG_MARK);
    const matched_link = tplItem.match(REG_LINK);
    const matched_img = tplItem.match(REG_IMG);
    // 匹配到md语法，不为空
    if (matched_mark) {
      // matched_mark[1]就是去掉空格的 md标识
      const mark = matched_mark[1];

      // input就是匹配到的md语法，input: '# h1标题\r'
      const input = matched_mark['input'];
      // console.log(input)

      // 匹配到#号的
      if (REG_TITLE.test(mark)) {
        // console.log(matched_mark);

        // 根据#号的个数  判断是h几
        const tag = `h${mark.length}`;

        //将'# h1标题\r'中的'# '干掉，最终得到'h1标题\r'
        const tagContent = input.replace(REG_MARK, '')

        // console.log(tag, tagContent);

        // REG_TITLE.test(_lastMark)
        if ((_lastMark === mark)) {
          _htmlTree[tag].children = [..._htmlTree[`${tag}-${_key}`], `<${tag}>${tagContent}</${tag}>`]
        } else {
          _lastMark = mark;
          _key = guid();
          _htmlTree[`${tag}-${_key}`] = {
            type: TAGTYPE_SIMPLE,
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }

      }

      // 无序列表
      if (REG_DISORDER.test(mark)) {
        //将'- ul第一项\r'中的'- '干掉，最终得到'ul第一项\r'
        const tagContent = input.replace(REG_MARK, '');
        // console.log(tagContent);
        const tag = `li`;
        // 上一个是不是`-`
        if (REG_DISORDER.test(_lastMark)) {
          // '- ul第i项\r' 放到一起

          _htmlTree[`ul-${_key}`].children = [..._htmlTree[`ul-${_key}`].children, `<${tag}>${tagContent}</${tag}>`]
        } else {
          _key = guid();
          _lastMark = mark;
          // 加一个随机后缀key
          _htmlTree[`ul-${_key}`] = {
            type: TAGTYPE_NESTING, // 外层需要一个ul
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }
      }

      // 有序列表  是不是以数字开头的，如果是数字开头，没有.呢？
      if (REG_ORDER.test(mark)) {
        const tagContent = input.replace(REG_MARK, '');
        const tag = `li`;
        if (REG_ORDER.test(_lastMark)) {
          _htmlTree[`ol-${_key}`].children = [..._htmlTree[`ol-${_key}`].children, `<${tag}>${tagContent}</${tag}>`]
        } else {
          // console.log(_lastMark,mark);
          _lastMark = mark;
          _key = guid();
          _htmlTree[`ol-${_key}`] = {
            type: TAGTYPE_NESTING,
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }
      }
    } else if (matched_link) { // 超链接的处理
      // console.log(matched_link)
      // '百度'
      const link_title = matched_link[1];
      // 'http://www.baidu.com'
      const link_href = matched_link[2];
      // '[百度](http://www.baidu.com)'
      const input = matched_link['input'];

      const tag = `a`;

      _key = guid();
      _htmlTree[`${tag}-${_key}`] = {
        type: TAGTYPE_SIMPLE,
        children: [`<${tag} href="${link_href}" target="_blank" style="${REG_LINK_STYLE}">${link_title}</${tag}>`]
      }
    } else if (matched_img) { // 图片的处理
      // console.log(matched_img)
      const tag = `img`;

      // '图片'
      const img_title = matched_img[1];
      // 'public/testimages.png'
      const img_src = matched_img[2];
      // '![图片](./testimages.png)'
      const input = matched_img['input'];
      // 'testimages'
      const img_file = basename(img_src);
      // const img_filename = basename(img_src).split('.')[0]

      _key = guid();
      _htmlTree[`${tag}-${_key}`] = {
        type: TAGTYPE_SIMPLE,
        staticSource: {
          filename: img_file,
          staticPath: img_src
        },
        children: [`<${tag} src="./${img_file}"  alt="${img_title}"></${tag}>`]
      }
    }


  })

  // console.log(_htmlTree);
  return _htmlTree;
}

// 转成树形结构 或者AST
function compileHTML(_templateContentArr) { // _templateContentArr数组内容
  // console.log(_templateContentArr)

  // 转成树形结构
  const _htmlTree = createTree(_templateContentArr)
  // console.log(_htmlTree);

  // static资源
  const _staticSource = [];


  // 拼接结果
  let _htmlStr = '';

  // 保存当前遍历到的 key
  let currItem;
  for (let key in _htmlTree) {
    // console.log(key, _htmlTree[key]);
    currItem = _htmlTree[key];
    _htmlTree[key]?.staticSource && _staticSource.push(_htmlTree[key]?.staticSource)
    // 等于single，直接拼接
    if (currItem.type === TAGTYPE_SIMPLE) {
      currItem.children.forEach(tag => {
        _htmlStr += tag;
      });
    } else if (currItem.type === TAGTYPE_NESTING) { // 外层要套一个标签的，不能直接拼接
      const outerTag = `<${key.split('-')[0]}>`; // 获取外层的标签，就是_htmlTree的key
      let currStr = "" + outerTag;
      currItem.children.forEach(tag => {
        currStr += tag;
      })
      // 结束标签
      currStr += outerTag;

      _htmlStr += currStr;
    }

  }
  // console.log(_htmlStr);
  return { _htmlStr, _staticSource };

}

module.exports = {
  compileHTML
}