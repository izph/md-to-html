const { readFileSync } = require('fs')

const { resolve } = require('path')

// const {compileHTML} = require('./compiler');

const INNER_MARK = '<!--inner-->'

class MdToHtmlPlugin {
    constructor({template, filename}) {
        // 没传template
        if (!template){
          throw new Error('the config for "Template must be configured" ')
        }
        this.template = template;
        // 没传filename 默认为 md.html
        this.filename = filename ? filename : 'md.html';
    }
    // 编译的时候都是在apply里执行
    // webpack会提供一个apply方法，接受一个编译器compiler
    // compiler会有钩子hooks，钩子hooks会有一个发布器emit（类型node的EmitterEvent发布订阅）
    apply(compiler){
        // tap第一个参数是插件的名字，第二个参数是回调函数，回调函数的参数是一个compilation
        compiler.hooks.emit.tap('md-to-html-plugin', (compilation)=>{

          // _assets 打包的资源详情
          const _assets = compilation.assets;
          // console.log(_assets)

          // fs的api readFileSync 同步读取文件 readFile是异步的
          const _mdContent = readFileSync(this.template, 'utf-8') // 目录文件，编码方式
          // console.log(_mdContent)

          // 找到当前目录下的template.html
          const _templateHtml = readFileSync(resolve(__dirname, "template.html"), 'utf-8');

          // 将_mdContent（md文件的内容） 变为数组
          const _mdContentArr = _mdContent.split('\n');
          // console.log(_mdContentArr)

          // 核心方法： 将数组内容 编译为 html标签   
          const _htmlStr = compileHTML(_mdContentArr);
          //   console.log(_htmlStr)
          const _fileHtml = _templateHtml.replace(INNER_MARK, _htmlStr)
    
          // _assets增加资源，this.filename 就是_assets的一个属性
          _assets[this.filename] = {
            //  source不是一个普通的函数，它会把放到_assets[this.filename]对象中
            //  将资源放到 我们定义filename的html文件中
            source(){
              return _fileHtml;
            },
            // 资源的长度        
            size(){
              return _fileHtml.length;
            }
          }
    
          //
          // console.log(_mdContent)
          // console.log(_templateHtml)
          // console.log(_mdContentArr)
        })
      }
}


module.exports = MdToHtmlPlugin;