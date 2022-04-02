const { guid } = require('./util');

const { basename } = require('path');

// 以空字符串开头，以空格结尾，找到里边的所有字符
const reg_mark = /^(.+?)\s/;
// 以#号开头的，最终转化成h标签，有可能是1个、2个、3个。。。
const reg_sharp = /^\#/;

// 以-开头的  最终转化成li
const reg_crossbar = /^\-/;

// 以数字开头 有序列表
const reg_number = /^\d/;

// 匹配 []() 超链接
const reg_link = /^\[(.+?)\]\((.+?)\)$/;

// 匹配 []() 超链接
const reg_img = /^\!\[(.+?)\]\((.+?)\)$/;

function createTree(mdArr) {
  // 存放结果
  let _htmlPool = {};

  // 上一个标识符
  let _lastMark = '';

  let _key = 0;

  // 字符串相关的东西最好不要做封装，老老实实的写最好，不同的标签有不同的处理方法
  mdArr.forEach((mdFragment) => {
    // 去掉\r回车的影响
    mdFragment = mdFragment.replace(/\r/, '');
    // console.log(mdFragment)

    // 正则
    const matched = mdFragment.match(reg_mark);
    const matched_link = mdFragment.match(reg_link);
    const matched_img = mdFragment.match(reg_img);
    // 匹配到md语法，不为空
    if (matched) {
      // matched[1]就是去掉空格的 md标识
      const mark = matched[1]

      //input就是匹配到的md语法，input: '# h1标题\r'
      const input = matched['input']
      // console.log(input)

      // 匹配到#号的
      if (reg_sharp.test(mark)) {
        // console.log(matched);

        // 根据#号的个数  判断是h几
        const tag = `h${mark.length}`;

        //将'# h1标题\r'中的'# '干掉，最终得到'h1标题\r'
        const tagContent = input.replace(reg_mark, '')

        // console.log(tag, tagContent);

        // reg_sharp.test(_lastMark)
        if ((_lastMark === mark)) {
          _htmlPool[tag].tags = [..._htmlPool[`${tag}-${_key}`], `<${tag}>${tagContent}</${tag}>`]
        } else {
          _lastMark = mark;
          _key = guid();
          _htmlPool[`${tag}-${_key}`] = {
            type: 'single',
            tags: [`<${tag}>${tagContent}</${tag}>`]
          }
        }

      }

      // 无序列表
      if (reg_crossbar.test(mark)) {
        //将'- ul第一项\r'中的'- '干掉，最终得到'ul第一项\r'
        const tagContent = input.replace(reg_mark, '');
        // console.log(tagContent);
        const tag = `li`;
        // 上一个是不是`-`
        if (reg_crossbar.test(_lastMark)) {
          // '- ul第i项\r' 放到一起

          _htmlPool[`ul-${_key}`].tags = [..._htmlPool[`ul-${_key}`].tags, `<${tag}>${tagContent}</${tag}>`]
        } else {
          _key = guid();
          _lastMark = mark;
          // 加一个随机后缀key
          _htmlPool[`ul-${_key}`] = {
            type: 'wrap', // 外层需要一个ul
            tags: [`<${tag}>${tagContent}</${tag}>`]
          }
        }
      }

      // 有序列表  是不是以数字开头的，如果是数字开头，没有.呢？
      if (reg_number.test(mark)) {
        const tagContent = input.replace(reg_mark, '');
        const tag = `li`;
        if (reg_number.test(_lastMark)) {
          _htmlPool[`ol-${_key}`].tags = [..._htmlPool[`ol-${_key}`].tags, `<${tag}>${tagContent}</${tag}>`]
        } else {
          // console.log(_lastMark,mark);
          _lastMark = mark;
          _key = guid();
          _htmlPool[`ol-${_key}`] = {
            type: 'wrap',
            tags: [`<${tag}>${tagContent}</${tag}>`]
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

      const link_style = `color: #3489fd;font-weight: 500;text-decoration: none;`
      _key = guid();
      _htmlPool[`a-${_key}`] = {
        type: 'single',
        tags: [`<a href="${link_href}" target="_blank" style="${link_style}">${link_title}</a>`]
      }
    } else if (matched_img) { // 超链接的处理
      console.log(matched_img)
      // '图片'
      const img_title = matched_img[1];
      // 'public/testimages.png'
      const img_src = matched_img[2];
      // '![图片](./testimages.png)'
      const input = matched_img['input'];
      // 'testimages'
      const img_file = basename(img_src);
      // const img_filename = basename(img_src).split('.')[0]
      //const link_style = `color: #3489fd;font-weight: 500;text-decoration: none;`
      _key = guid();
      _htmlPool[`img-${_key}`] = {
        type: 'single',
        staticSource: {
          filename: img_file,
          staticPath: img_src
        },
        tags: [`<img src="./${img_file}"  alt="${img_title}"></img>`]
      }
    }


  })

  // console.log(_htmlPool);
  return _htmlPool;
}

// 转成树形结构 或者AST
function compileHTML(_templateContentArr) { // _templateContentArr数组内容
  // console.log(_templateContentArr)
  // 转成树形结构
  const _htmlPool = createTree(_templateContentArr)

  // static资源
  const _staticSource = [];

  // console.log(_htmlPool);
  // 拼接结果
  let _htmlStr = '';
  // 保存当前遍历到的 key
  let item;
  for (let k in _htmlPool) {
    // console.log(k, _htmlPool[k]);
    item = _htmlPool[k];
    _htmlPool[k]?.staticSource && _staticSource.push(_htmlPool[k]?.staticSource)
    // 等于single，直接拼接
    if (item.type === 'single') {
      item.tags.forEach(tag => {
        _htmlStr += tag;
      });
    } else if (item.type === 'wrap') { // 外层要套一个标签的，不能直接拼接
      let _list = `<${k.split('-')[0]}>`; // 获取外层的标签，就是_htmlPool的key
      item.tags.forEach(tag => {
        _list += tag;
      })
      // 结束标签
      _list += `</${k.split('-')[0]}>`;

      _htmlStr += _list;
    }

  }
  // console.log(_htmlStr);
  return { _htmlStr, _staticSource };

}

module.exports = {
  compileHTML
}