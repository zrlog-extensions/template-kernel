# 第三方资源

## KaTeX 0.16.22

- 项目：https://katex.org/
- 上游源码：https://github.com/KaTeX/KaTeX/tree/v0.16.22
- 发布来源：npm 包 `katex@0.16.22`。本主题复用 `template-open-journal` 中已整理的同版本资源；最初从工程中已安装的 `zrlog-editor/node_modules/katex/` 复制。
- 主题文件：`css/katex.min.css` 与 `fonts/KaTeX_*.woff2`（20 个字体文件）。
- 用途：为文章中现有的 KaTeX HTML 提供匹配的数学排版与字体，不加载 KaTeX JavaScript，不重新渲染正文。
- 改动：保留上游全部 20 组字体及其字重、样式，移除 WOFF/TTF 回退，仅保留现代浏览器支持的 WOFF2；字体 URL 调整为 `../fonts/`。其余上游 CSS 规则保持不变。
- 许可证：MIT。下方完整内容复制自该版本包内 `LICENSE`；同一声明也保留在 CSS 文件头，以随主题安装包分发。

```text
The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
