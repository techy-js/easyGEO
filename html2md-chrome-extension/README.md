# HTML to Markdown Chrome Extension

一个Chrome浏览器扩展，能够将任何网页的完整HTML内容转换为美观的Markdown格式并下载。

## 功能特性

- ✅ **完整内容提取** - 提取网页的全部HTML内容，不进行任何过滤或筛选
- ✅ **高质量转换** - 使用高级转换算法，保持原始HTML结构
- ✅ **美观格式** - 生成格式良好的Markdown文件
- ✅ **多种使用方式** - 支持弹窗点击、右键菜单、键盘快捷键
- ✅ **自动下载** - 转换完成后自动下载Markdown文件
- ✅ **智能命名** - 使用网页标题作为文件名

## 支持的HTML元素

### 文本格式
- 标题 (H1-H6) → `# ## ### #### ##### ######`
- 段落 (P) → 段落格式
- 粗体 (Strong/B) → `**text**`
- 斜体 (Em/I) → `*text*`
- 下划线 (U) → `<u>text</u>`
- 删除线 (Del/S) → `~~text~~`
- 高亮 (Mark) → `==text==`
- 上标 (Sup) → `^text^`
- 下标 (Sub) → `~text~`

### 代码
- 行内代码 (Code) → `` `code` ``
- 代码块 (Pre) → ` ```language\ncode\n``` `
- 键盘输入 (Kbd) → `<kbd>key</kbd>`

### 列表
- 无序列表 (UL/LI) → `- item`
- 有序列表 (OL/LI) → `1. item`
- 描述列表 (DL/DT/DD) → `**term**: definition`

### 链接和媒体
- 链接 (A) → `[text](url)`
- 图片 (Img) → `![alt](src)`
- 图片说明 (Figure/Figcaption) → 带说明的图片

### 表格
- 完整表格支持 → Markdown表格格式
- 表头和表体正确转换
- 单元格内容保持格式

### 引用
- 块引用 (Blockquote) → `> quoted text`
- 行内引用 (Q) → `"quoted text"`
- 引用来源 (Cite) → `*citation*`

### 结构元素
- 分隔线 (HR) → `---`
- 换行 (BR) → 换行
- 详情展开 (Details/Summary) → `<details><summary>title</summary>content</details>`

## 使用方法

### 方法一：弹窗操作
1. 点击浏览器工具栏中的扩展图标
2. 在弹出的窗口中点击"Convert Current Page"按钮
3. 等待转换完成，文件将自动下载

### 方法二：右键菜单
1. 在任意网页上右键点击
2. 选择"Convert page to Markdown"选项
3. 等待转换完成，文件将自动下载

### 方法三：键盘快捷键
- **Windows/Linux**: `Ctrl + Shift + M`
- **macOS**: `Cmd + Shift + M`

## 安装方法

### 开发者模式安装
1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 扩展安装完成

### 文件结构
```
html2md/
├── manifest.json          # 扩展清单文件
├── popup.html             # 弹窗界面
├── popup.js               # 弹窗逻辑
├── background.js          # 后台脚本
├── content.js             # 内容脚本
├── html2markdown.js       # HTML到Markdown转换器
├── package.json           # 项目配置
├── icons/                 # 图标文件夹
│   ├── icon.svg
│   └── icon48.png
└── README.md              # 说明文档
```

## 技术特性

### 高级转换引擎
- 使用自定义的HTML2Markdown转换器
- 递归解析DOM树结构
- 智能处理各种HTML元素
- 保持原始文档结构

### 内容保护
- 不插入任何多余的中文内容
- 保持原始HTML的层次结构
- 准确转换所有支持的元素类型
- 智能处理特殊字符和格式

### 用户体验
- 现代化的弹窗界面设计
- 实时转换状态显示
- 错误处理和用户反馈
- 多种触发方式选择

## 权限说明

扩展需要以下权限：
- `activeTab` - 访问当前活动标签页
- `scripting` - 在页面中执行脚本
- `storage` - 存储扩展设置
- `contextMenus` - 创建右键菜单
- `downloads` - 下载生成的文件

## 兼容性

- Chrome 88+
- Edge 88+
- 其他基于Chromium的浏览器

## 开发信息

### 技术栈
- Manifest V3
- 原生JavaScript
- Chrome Extension APIs
- 自定义HTML解析器

### 项目结构
- 使用模块化设计
- 分离关注点
- 清晰的代码组织
- 完整的错误处理

## 常见问题

### Q: 为什么某些页面转换后内容不完整？
A: 某些网页使用动态加载内容，扩展只能获取当前DOM中的内容。建议等页面完全加载后再进行转换。

### Q: 转换的Markdown文件在哪里？
A: 文件会下载到浏览器的默认下载文件夹中，文件名基于网页标题。

### Q: 支持自定义转换规则吗？
A: 当前版本提供标准的HTML到Markdown转换，未来版本可能会加入自定义规则。

### Q: 如何处理复杂的表格？
A: 扩展支持基本的表格转换，复杂的表格可能需要手动调整。

## 更新日志

### v1.0.0 (2024-12-xx)
- 初始版本发布
- 完整的HTML到Markdown转换功能
- 支持多种触发方式
- 现代化用户界面
- 完整的元素类型支持

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展。

---

**注意**: 此扩展设计用于将网页内容转换为Markdown格式，请确保遵守网站的使用条款和版权规定。
