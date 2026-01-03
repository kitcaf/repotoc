## 项目介绍 (project introduction)

> **专门为 GitHub 知识库和文档库打造的自动化目录生成工具。**
> *Automated Table of Contents Generator for GitHub Documentation Libraries.*

在 GitHub 上维护大型知识库（Knowledge Base）或多章节文档时，最令人头疼的就是手动维护 `README.md` 里的目录索引。每当你新增一个文件或调整章节顺序，都需要手动更新链接。

`@kitcaf/tocgen` 完美解决了这个问题。它能像人类一样理解你的文件名（支持中文、罗马数字混排），自动扫描整个仓库，生成结构清晰的目录树，并直接注入到你的主页文档中。

## 痛点 (The Problem)

如果你在 GitHub 上维护过类似《学习笔记》、《技术文档》或《电子书》这样的仓库，你一定遇到过：

1. **手动维护地狱**：新增了 `docs/第十章/1.md`，却忘了在根目录 `README` 加链接，读者根本找不到。
2. **排序反直觉**：GitHub 默认按 ASCII 码排序，导致 `10.md` 排在 `2.md` 前面；或者 `第一章` 和 `第二章` 顺序错乱。
3. **缺乏全局视图**：GitHub 只能看单文件，缺乏一个全局的、层级分明的“书本目录”视图。


## 核心特性 (Features)

* **GitHub 友好**：生成的链接完美兼容 GitHub Markdown 渲染规则，点击即跳转。
* **智能混合排序**：可以自动识别文件名中的数字排序。
 - * ✅ 阿拉伯数字：`1.`, `2.`, `10.`
 - * ✅ 中文数字：`第一章`, `十二`, `第三节`
 - * ✅ 罗马数字：`I`, `IV`, `X`
* **无损注入**：使用 `<!--toc-->` 标记，只更新目录区域，不破坏你精心写的项目介绍。
* **零配置起步**：默认配置即可满足 90% 的需求，也支持 `toc.config.ts` 自定义。

## 安装 (Installation)

```bash
# 全局安装 (推荐，方便在任何项目使用)
npm install -g @kitcaf/tocgen

# 或者使用 pnpm
pnpm add -g @kitcaf/tocgen

```

## 快速开始 (Usage)

> 💡 **提示**：工具默认会扫描项目根目录下的 **`docs`** 文件夹。
> 如果你的文档在其他位置（例如项目根目录 `.`），请参考下方的 [配置 (Configuration)](https://www.google.com/search?q=%23%E9%85%8D%E7%BD%AE-configuration) 章节。

### 1. 标记

在需要构建目录的 `README.md` 中加入标记`<!--toc-->`：

```markdown
# 我的知识库

欢迎来到我的学习笔记...

<!--toc-->

这里是页脚...

```

### 2. 生成

在终端运行：

```bash
toc

```

## 配置 (Configuration)

```typescript
import { defineConfig } from '@kitcaf/tocgen';

export default defineConfig({
  // 扫描文档的根目录 (默认为 'docs')
  // 如果你想扫描当前根目录下的所有文件，可以设为 '.'
  baseDir: 'docs',
  
  // 排除不想展示的文件或目录 (支持 glob 模式)
  exclude: ['node_modules', 'public', 'assets', 'dist'],
  
  // 目录注入的目标文件 (默认为 'README.md')
  outDir: 'README.md'
});

```

## 未来计划 (Roadmap)

未来计划包括：

* [ ] **自定义模板 (Custom Templates)**
* [ ] **多文档库支持 (Multi-Repo / Monorepo Support)**
* [ ] **自定义映射配置 (Mapping & Override)**
* [ ] **自动监听 (Watch Mode)**
* [ ] **GitHub Actions 集成 (CI/CD)**

## License

ISC © [Kitcaf](https://github.com/kitcaf)