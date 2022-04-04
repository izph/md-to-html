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
  let htmlTree = {};

  // 上一个标识符
  let lastMark = '';

  let uid = 0;

  // 字符串相关的东西最好不要做封装，老老实实的写最好，不同的标签有不同的处理方法
  tplArr.forEach((tplItem) => {
    // 去掉\r回车的影响
    tplItem = tplItem.replace(/\r/, '');

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

      // 匹配到#号的
      if (REG_TITLE.test(mark)) {

        // 根据#号的个数  判断是h几
        const tag = `h${mark.length}`;

        //将'# h1标题\r'中的'# '干掉，最终得到'h1标题\r'
        const tagContent = input.replace(REG_MARK, '')

        // REG_TITLE.test(lastMark)
        if ((lastMark === mark)) {
          htmlTree[tag].children = [...htmlTree[`${tag}-${uid}`], `<${tag}>${tagContent}</${tag}>`]
        } else {
          lastMark = mark;
          uid = guid();
          htmlTree[`${tag}-${uid}`] = {
            type: TAGTYPE_SIMPLE,
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }

      }

      // 无序列表
      if (REG_DISORDER.test(mark)) {
        //将'- ul第一项\r'中的'- '干掉，最终得到'ul第一项\r'
        const tagContent = input.replace(REG_MARK, '');

        const tag = `li`;
        // 上一个是不是`-`
        if (REG_DISORDER.test(lastMark)) {
          // '- ul第i项\r' 放到一起

          htmlTree[`ul-${uid}`].children = [...htmlTree[`ul-${uid}`].children, `<${tag}>${tagContent}</${tag}>`]
        } else {
          uid = guid();
          lastMark = mark;
          // 加一个随机后缀key
          htmlTree[`ul-${uid}`] = {
            type: TAGTYPE_NESTING, // 外层需要一个ul
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }
      }

      // 有序列表  是不是以数字开头的，如果是数字开头，没有.呢？
      if (REG_ORDER.test(mark)) {
        const tagContent = input.replace(REG_MARK, '');
        const tag = `li`;
        if (REG_ORDER.test(lastMark)) {
          htmlTree[`ol-${uid}`].children = [...htmlTree[`ol-${uid}`].children, `<${tag}>${tagContent}</${tag}>`]
        } else {
          lastMark = mark;
          uid = guid();
          htmlTree[`ol-${uid}`] = {
            type: TAGTYPE_NESTING,
            children: [`<${tag}>${tagContent}</${tag}>`]
          }
        }
      }
    } else if (matched_link) { // 超链接的处理

      // '百度'
      const link_title = matched_link[1];
      // 'http://www.baidu.com'
      const link_href = matched_link[2];
      // '[百度](http://www.baidu.com)'
      const input = matched_link['input'];

      const tag = `a`;

      uid = guid();
      htmlTree[`${tag}-${uid}`] = {
        type: TAGTYPE_SIMPLE,
        children: [`<${tag} href="${link_href}" target="_blank" style="${REG_LINK_STYLE}">${link_title}</${tag}>`]
      }
    } else if (matched_img) { // 图片的处理

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

      uid = guid();
      htmlTree[`${tag}-${uid}`] = {
        type: TAGTYPE_SIMPLE,
        staticResources: {
          filename: img_file,
          staticPath: img_src
        },
        children: [`<${tag} src="./${img_file}"  alt="${img_title}"></${tag}>`]
      }
    }


  })

  return htmlTree;
}

// 转成树形结构 或者AST
function compileHTML(templateContentArr) { // templateContentArr数组内容

  // 转成树形结构
  const htmlTree = createTree(templateContentArr)

  // static资源
  const staticSource = [];


  // 拼接结果
  let htmlStr = '';

  // 保存当前遍历到的 key
  let currItem;
  for (let key in htmlTree) {
    currItem = htmlTree[key];
    htmlTree[key]?.staticResources && staticSource.push(htmlTree[key]?.staticResources)
    // 等于single，直接拼接
    if (currItem.type === TAGTYPE_SIMPLE) {
      currItem.children.forEach(tag => {
        htmlStr += tag;
      });
    } else if (currItem.type === TAGTYPE_NESTING) { // 外层要套一个标签的，不能直接拼接
      const outerTag = `<${key.split('-')[0]}>`; // 获取外层的标签，就是htmlTree的key
      let currStr = "" + outerTag;
      currItem.children.forEach(tag => {
        currStr += tag;
      })
      // 结束标签
      currStr += outerTag;

      htmlStr += currStr;
    }

  }

  return { htmlStr, staticSource };

}

module.exports = {
  compileHTML
}