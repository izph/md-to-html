const { readFileSync } = require('fs');

const { resolve, dirname, join } = require('path');

const { compileHTML } = require('./compiler');

const { TEMPLATE_MARK, PLUGIN_NAME } = require('./constant');

class MdToHtmlPlugin {
  constructor({ template, filename }) {
    // 没传template
    if (!template) {
      throw new Error('Please input the markdown template file')
    }
    this.template = template;
    // 没传filename 默认为 index.html
    this.filename = filename ? filename : 'index.html';
  }
  // 编译的时候都是在apply里执行
  // webpack会提供一个apply方法，接受一个编译器compiler
  // compiler会有钩子hooks，钩子hooks会有一个发布器emit（类型node的EmitterEvent发布订阅）
  apply(compiler) {
    // tap第一个参数是插件的名字，第二个参数是回调函数，回调函数的参数是一个compilation
    compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {

      // _assets 打包的资源详情
      const _assets = compilation.assets;

      // fs的api readFileSync 同步读取文件 readFile是异步的
      const templateContent = readFileSync(this.template, 'utf-8') // 目录文件，编码方式

      // 找到当前目录下的template.html
      const templateHtml = readFileSync(resolve(__dirname, "template.html"), 'utf-8');

      // 将templateContent（md文件的内容） 变为数组
      const templateContentArr = templateContent.split('\n');

      // 核心方法： 将数组内容 编译为 html标签   
      const { htmlStr, staticSource } = compileHTML(templateContentArr);

      // 将template.html的模板字符串替换
      const fileHtml = templateHtml.replace(TEMPLATE_MARK, htmlStr)

      // _assets增加资源，this.filename 就是_assets的一个属性
      _assets[this.filename] = {
        //  source不是一个普通的函数，它会把放到_assets[this.filename]对象中
        //  将资源放到我们定义filename的html文件中
        source() {
          return fileHtml;
        },
        // 资源的长度        
        size() {
          return fileHtml.length;
        }
      }

      // 获取md文件所在的目录
      const tplDirName = dirname(this.template);
      staticSource.map((staticItem) => {
        const { filename, staticPath } = staticItem;
        // 拼接md文件引用的静态资源路径
        const staticsourcepath = join(tplDirName, staticPath);
        // 读取静态资源
        const statics = readFileSync(staticsourcepath);
        // _assets增加资源
        _assets[`${filename}`] = {
          source() {
            return statics;
          },
          size() {
            return statics.length;
          }
        }
      })

    })
  }
}


module.exports = MdToHtmlPlugin;