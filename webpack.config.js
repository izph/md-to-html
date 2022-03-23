const {resolve} = require('path')
const MdToHtmlPlugin = require('./plugins/md-to-html-plugin')

const config = {
    // 模式
    mode: "development",
    // 入口文件
    entry: resolve(__dirname, 'src/app.js'),
    output: {
        path: resolve(__dirname, 'dist'),
        filename: "app.js"
    },
    // 配置自定义插件
    plugins: [
        new MdToHtmlPlugin({
            template: resolve(__dirname,'test.md'), // 我们需要解析的文件
            filename: 'test.html' // 解析后的文件名
        })
    ]
}

module.exports = config;