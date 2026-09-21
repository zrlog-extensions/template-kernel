# Kernel 工作约定

- 独立 ZrLog FreeMarker 主题，运行文件位于仓库根目录；不将源码复制回 `templates` 索引。
- 修改前阅读 `docs/design.md`；数据遵循公共主题契约与锁定的官方 3.9.2 运行时，不猜测 DTO 字段。
- 维持深墨黑、磷绿与单一终端会话布局：首页是 `ls` 文件列表，详情是 `less` 单栏阅读。不要恢复常驻侧栏、传统博客头部、大幅导语区、文章卡片或 IDE 页签。
- 命令只处理博客导航、服务端搜索与本地配色偏好，不执行系统 shell 或任意脚本，不生成虚假在线状态、技能等级或系统指标。文章编号、`ls` 和边界提示遵守当前分页范围。
- 配色默认 `black`，提供 `amber`、`dracula`、`nord`；通过右上选择器或 `theme` 命令切换，以 `kernel-theme` Cookie 保存，`Path=/`、`Max-Age=31536000`、`SameSite=Lax`，HTTPS 时加 `Secure`。head 在加载样式前读取同一 Cookie，避免闪烁。无 JavaScript 时仍为黑色，不跟随操作系统自动切换。
- README 输出的小标题默认使用 `webs.title`，可由 `introTitle` 覆盖；不得重新加入默认营销口号或大幅标题区。说明继续优先使用站点副标题。
- 作者介绍、用户名、链接由配置或站点真实字段提供。普通文本与属性转义，正文保留服务端既有 HTML 语义。
- 正文可读性、手机布局和键盘操作优先；无封面、长标题、空数据与无 JavaScript 时基本导航仍可用。
- 桌面初始焦点落在主区，列表用 `↑↓`／`k j` 选择真实文稿并以 `Enter` 原生打开，不要求逐个 Tab 遍历。阅读用方向键／`k j` 滚动、Space／Shift+Space／PageUp／PageDown 翻屏、Home／End 首尾、`q` 返回。手机不自动弹软键盘。
- `/` 进入搜索、`:` 进入命令、Esc 取消输入并返回文稿选择。命令框内输入即显示补全候选；候选打开时 `↑↓` 选择，Enter 接受选中项，Tab 接受候选；Esc 先关闭候选，再按取消输入。候选关闭时 `↑↓` 是历史，空输入 Tab 与 Shift+Tab 仍为正常焦点导航。Ctrl+U 清空，Ctrl+K 删除光标后内容，Ctrl+C 仅在无选区时取消，选区复制保留。
- 输入控件与 IME 组合期间不抢全局单字快捷键；保留 Ctrl+A 和浏览器 Ctrl/Cmd+L、R、T、W。新增键盘行为需独立复验，旧终端交互通过记录不能代替本次键位验收。
- 公共 Java 工具负责构建、预览和发布。不引入 Python 构建脚本或另写模板引擎、路由、DTO。
- README、`toolkit.lock.json` 与 workflow 两处引用固定为同一个工具提交，更新时同步并验收。
- 完成后执行 descriptor-check、check、JS 语法检查、构建、目录和 ZIP 真实安装冒烟，以及桌面／手机浏览器检查；记录实际结果。
- 终端重做必须重新验收；旧两栏布局的通过记录不能作为当前实现通过的证据。交付前逐项核对 `docs/design.md` 中三条视觉审阅标准。
- 未实际验收时 `testedRuntime` 保持 `null`；未实际发布时 `latestRelease` 保持 `null`。
- 不提交 dist、下载缓存、本地数据库、环境文件或凭据。新增静态资源目录需同步 `staticResource`。
- 运行时会为静态文件发送一年 immutable 缓存。修改 `css/style.css` 或 `js/kernel.js` 后，将 `header.ftl` 中相应 `v` 参数更新为文件 SHA-256 的前 12 位；核对刷新后的资源 URL，不能只用空缓存浏览器验收。
