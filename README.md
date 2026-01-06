<div align="center">

# @kitcaf/tocgen

[![NPM Version](https://img.shields.io/npm/v/@kitcaf/tocgen)](https://www.npmjs.com/package/@kitcaf/tocgen)

<p align="center">
  <a href="./README_en.md">English</a> | <span>简体中文</span>
</p>

</div>


## 项目介绍 (project introduction)

> **专门为 GitHub 知识库和文档库打造的自动化目录生成工具。**
> *Automated Table of Contents Generator for GitHub Documentation Libraries.*

在 GitHub 上维护大型知识库（Knowledge Base）或多章节文档时，最令人头疼的就是手动维护 `README.md` 里的目录索引。每当你新增一个文件或调整章节顺序，都需要手动更新链接。

`@kitcaf/tocgen` 完美解决了这个问题。它能像人类一样理解你的文件名（支持中文、罗马数字混排），自动扫描整个仓库，生成结构清晰的目录树，并直接注入到你的主页文档中。

**如果您觉得 `@kitcaf/tocgen` 对您有帮助，麻烦您动动小手给我点个 Star ⭐️，这对我是莫大的鼓励！**

## 痛点 (The Problem)

如果你在 GitHub 上维护过类似《学习笔记》、《技术文档》或《电子书》这样的仓库，你一定遇到过：

1. **手动维护地狱**：新增了 `docs/第十章/1.md`，却忘了在根目录 `README` 加链接，读者根本找不到。
2. **排序反直觉**：GitHub 默认按 ASCII 码排序，导致 `10.md` 排在 `2.md` 前面；或者 `第一章` 和 `第二章` 顺序错乱。
3. **缺乏全局视图**：GitHub 只能看单文件，缺乏一个全局的、层级分明的“书本目录”视图。

## 核心特性 (Features)

* **GitHub 友好**：生成的链接完美兼容 GitHub Markdown 渲染规则，点击即跳转。
* **智能混合排序**：可以自动识别文件名中的数字排序。
  * ✅ 阿拉伯数字：`1.`, `2.`, `10.`
  * ✅ 中文数字：`第一章`, `十二`, `第三节`
  * ✅ 罗马数字：`I`, `IV`, `X`
* 多源元数据支持：支持通过文件名、Frontmatter或配置文件灵活控制标题与排序。
* **无损注入**：只需要要使用 `<!--toc-->` 标记，自动更新相应的目录区域
  * 仅需维护单一标记 `<!--toc-->`
  * 无论是原位更新、位置迁移还是废弃标记清理，都能**构建出精确的“删除-插入”操作链**，实现对文档内容的零侵入修改
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

在需要构建目录的 `README.md` 中加入标记`<!--toc-->`（输出toc加注释按键）：**请保持独立的一行并且无其他字符**

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

工具支持通过 toc.config.ts 和md文件内进行定制化配置

### 文件内配置 (Frontmatter)

可以直接在 Markdown 文件的头部使用 YAML Frontmatter 进行单文件控制

支持以下字段：

* **`title`** (string): 自定义在目录中显示的标题（优先级：Config > Frontmatter > H1 > 文件名）。
* **`order`** (number): 手动指定排序权重。数字越小，在同级目录中越靠前。
* **`ignore`** (boolean): 设置为 `true` 可强制隐藏该文件。

**示例：**

在 `docs/guide/intro.md` 文件头部：

```markdown
---
title: 快速入门指南
order: 1
ignore: false
---

# 正文内容...

### `toc.config.ts`基础配置

```typescript
import { defineConfig } from '@kitcaf/tocgen';

export default defineConfig({
  // 扫描根目录 (默认 'docs')
  baseDir: 'docs',
  
  // 目标文件-标记所在位置 (默认 'README.md')
  outDir: 'README.md',

  // 全局物理忽略 (支持 glob 模式)
  ignore: ['**/node_modules/**', '**/*.test.md'],
  
  // 最大扫描深度 (默认 3)
  maxDepth: 3,
});
```

### `toc.config.ts`映射规则 (Mapping)

mapping 字段用于修改生成的目录结构，支持以下**三类规则**。

注意：所有保留字段（如 $name, $order, $ignore）均使用 $ 前缀以避免与文件名冲突。

- $name：修改在目录中显示的标题
- $order：数字越小越靠前
- $ignore：是否在目录中隐藏此节点 (**及子节点**)

**A. 全局匹配 (Global Match)**

使用 **/ 前缀，匹配仓库内所有文件名或目录名与 Key 同名的节点，忽略其层级深度

```typescript
export default defineConfig({
  mapping: {
    // 对象模式配置多个属性
    '**/faq.md': {
      $name: '常见问题汇总',
      $order: 11
      ignore: true
    }
    // 字符串模式只表示对应标题
    '**/faq.md': '常见问题汇总',
  }
})
```
**B. 目录树嵌套配置 (Nested Config)**

匹配 baseDir 根目录下的特定文件夹，并支持递归配置其内部结构

注意：（1）不要写 /:Key 必须是单层文件夹名 （2）不要写扫描根目录：如果你的 baseDir 是 docs，配置时直接写 docs 下的一级目录名即可（例如写 guide 而不是 docs/guide）

```typescript
export default defineConfig({
  baseDir: 'docs', // 假设扫描 docs 目录
  
  mapping: {
    // docs/guide
    'guide': {
      $name: '新手指南', 
      $order: 1,
    
      // docs/guide/installation.md
      'installation.md': {
        $name: '安装步骤',
        $order: 1
      },

      // docs/guide/advanced
      'advanced': {
        $name: '进阶配置',
        // docs/guide/advanced/secret.md
        'secret.md': { $ignore: true } 
      }
    }
  }
});
```
**C. 精准路径匹配 (Exact Path)**

精准定位并配置指定路径下的特定文件或目录

注意：（1）路径是相对于 baseDir 的相对路径

```typescript
export default defineConfig({
  baseDir: 'docs',
  
  mapping: {
    // 对应路径: docs/Ai/MCP.md
    'Ai/MCP.md': {
      $name: 'MCP介绍',
      $ignore: false
    }

    //或字符串模式-直接表示标题名字
    'Ai/MCP.md': 'MCP介绍'
  }
});

```
## 未来计划 (Roadmap)

未来计划包括：

* [ ] **自定义模板 (Custom Templates)**
* [ ] **多文档库支持 (Multi-Repo / Monorepo Support)**
* [ ] **GitHub Actions 集成 (CI/CD)**
* [ ] **自动监听 (Watch Mode)**

## 贡献与支持

同时非常欢迎您提出问题或建议。无论是 Bug 报告还是功能请求，**欢迎随时提交 Issue**。您的每一个反馈都是项目进步的动力。

## License

MIT © [Kitcaf](https://github.com/kitcaf)