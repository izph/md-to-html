const { readFileSync } = require('fs');

const { resolve, dirname, join } = require('path');

const { compileHTML } = require('./compiler');

const TEMPLATE_MARK = '<!--templateString-->';

const pluginName = 'md-to-html-plugin';

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
    compiler.hooks.emit.tap(pluginName, (compilation) => {

      // _assets 打包的资源详情
      const _assets = compilation.assets;
      console.log("_assets:", _assets)

      // fs的api readFileSync 同步读取文件 readFile是异步的
      const _templateContent = readFileSync(this.template, 'utf-8') // 目录文件，编码方式

      // console.log(_templateContent)

      // 找到当前目录下的template.html
      const _templateHtml = readFileSync(resolve(__dirname, "template.html"), 'utf-8');

      // 将_templateContent（md文件的内容） 变为数组
      const _templateContentArr = _templateContent.split('\n');
      // console.log(_templateContentArr)

      // 核心方法： 将数组内容 编译为 html标签   
      const { _htmlStr, _staticSource } = compileHTML(_templateContentArr);
      // console.log(_htmlStr)
      const _fileHtml = _templateHtml.replace(TEMPLATE_MARK, _htmlStr)

      // _assets增加资源，this.filename 就是_assets的一个属性

      _assets[this.filename] = {
        //  source不是一个普通的函数，它会把放到_assets[this.filename]对象中
        //  将资源放到 我们定义filename的html文件中
        source() {
          return _fileHtml;
        },
        // 资源的长度        
        size() {
          return _fileHtml.length;
        }
      }
      // console.log(this.template.split('.')[0])
      // console.log(dirname(this.template.split('.')[0]))

      const _dirname = dirname(this.template);
      _staticSource.map((staticSource) => {
        const { filename, staticPath } = staticSource;
        const staticsourcepath = join(_dirname, staticPath);
        const statics = readFileSync(staticsourcepath)
        _assets[`${filename}`] = {
          //  source不是一个普通的函数，它会把放到_assets[this.filename]对象中
          //  将资源放到 我们定义filename的html文件中
          source() {
            return statics;
          },
          // 资源的长度        
          size() {
            return statics.length;
          }
        }
      })

    })
  }
}


module.exports = MdToHtmlPlugin;