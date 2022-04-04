// 以空字符串开头，以空格结尾，找到里边的所有字符
const REG_MARK = /^(.+?)\s/;
// 以#号开头的，最终转化成h标签，有可能是1个、2个、3个。。。
const REG_TITLE = /^\#/;

// 以数字开头 有序列表
const REG_ORDER = /^\d/;

// 以-开头的  最终转化成li
const REG_DISORDER = /^\-/;

// 匹配 []() 超链接
const REG_LINK = /^\[(.+?)\]\((.+?)\)$/;

// 匹配 []() 超链接
const REG_IMG = /^\!\[(.+?)\]\((.+?)\)$/;

// 简单类型
const TAGTYPE_SIMPLE = 'simple';

// 需要嵌套包裹
const TAGTYPE_NESTING = 'nesting';

// 超链接默认样式
const REG_LINK_STYLE = `color: #3489fd;font-weight: 500;text-decoration: none;`

// 需要替换 模板html文件里的字符串
const TEMPLATE_MARK = '<!--templateString-->';

// 插件名称
const PLUGIN_NAME = 'md-to-html-plugin';

module.exports = {
    REG_MARK,
    REG_TITLE,
    REG_ORDER,
    REG_DISORDER,
    REG_LINK,
    REG_IMG,
    TAGTYPE_SIMPLE,
    TAGTYPE_NESTING,
    REG_LINK_STYLE,
    TEMPLATE_MARK,
    PLUGIN_NAME
}