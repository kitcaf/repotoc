<div align="center">

# @kitcaf/tocgen

[![NPM Version](https://img.shields.io/npm/v/@kitcaf/tocgen)](https://www.npmjs.com/package/@kitcaf/tocgen)

<p align="center">
  <span>English</span> | <a href="./README.md">简体中文</a>
</p>

</div>

## Introduction

> **Automated Table of Contents Generator for GitHub Documentation Libraries.**

When maintaining large Knowledge Bases or multi-chapter documentation on GitHub, the biggest headache is often manually maintaining the index in the `README.md`. Every time you add a new file or adjust the order of chapters, you have to manually update the links.

`@kitcaf/tocgen` solves this problem perfectly. It understands your filenames like a human (supporting mixed Chinese and Roman numerals), automatically scans the entire repository, generates a structured directory tree, and injects it directly into your homepage documentation.

**If you find `@kitcaf/tocgen` helpful, please give it a Star ⭐️. Your support is my greatest motivation!**

## The Problem

If you have ever maintained repositories like "Learning Notes," "Technical Documentation," or "E-books" on GitHub, you must have encountered these issues:

1.  **Manual Maintenance Hell**: You added `docs/Chapter10/1.md` but forgot to add a link in the root `README`, making it impossible for readers to find.
2.  **Counter-intuitive Sorting**: GitHub sorts by ASCII code by default, causing `10.md` to appear before `2.md`; or causing a chaotic order between `Chapter 1` and `Chapter 2`.
3.  **Lack of Global View**: GitHub only allows viewing single files, lacking a global, hierarchical "Book Directory" view.

## Features

* **GitHub Friendly**: Generated links are perfectly compatible with GitHub Markdown rendering rules—click to jump.
* **Smart Mixed Sorting**: Automatically identifies and sorts numbers within filenames.
    * ✅ Arabic Numerals: `1.`, `2.`, `10.`
    * ✅ Chinese Numerals: `第一章`, `十二`, `第三节`
    * ✅ Roman Numerals: `I`, `IV`, `X`
* **Multi-source Metadata Support**: Supports flexible control of titles and sorting via filenames, Frontmatter, or configuration files.
* **Non-destructive Injection**: Simply use the `` marker to automatically update the corresponding directory region.
    * Only requires maintaining a single marker: ``.
    * Whether it's an in-place update, location migration, or cleanup of deprecated markers, it **builds a precise "delete-insert" operation chain**, achieving zero-intrusion modification of your document content.
* **Zero Configuration Start**: Default settings satisfy 90% of needs, while also supporting deep customization via `toc.config.ts`.

## Installation

```bash
# Global installation (Recommended for use in any project)
npm install -g @kitcaf/tocgen

# Or using pnpm
pnpm add -g @kitcaf/tocgen

```

## Usage

> 💡 **Tip**: By default, the tool scans the **`docs`** folder under the project root.
> If your documentation is located elsewhere (e.g., project root `.`), please refer to the [Configuration](https://www.google.com/search?q=%23configuration) section below.

### 1. Mark

Add the marker `` to the `README.md` where you want the table of contents to appear: **Please ensure it occupies its own line with no other characters.**

```markdown
# My Knowledge Base

Welcome to my learning notes...

Here is the footer...

```

### 2. Generate

Run in the terminal:

```bash
toc

```

## Configuration

The tool supports customization via `toc.config.ts` and in-file Markdown configuration.

### In-file Configuration (Frontmatter)

You can directly control individual files using YAML Frontmatter at the top of the Markdown file.

The following fields are supported:

* **`title`** (string): Custom title displayed in the TOC (Priority: Config > Frontmatter > H1 > Filename).
* **`order`** (number): Manually specify sorting weight. Smaller numbers appear first.
* **`ignore`** (boolean): Set to `true` to force hide this file.

**Example:**

At the top of `docs/guide/intro.md`:

```markdown
---
title: 🚀 Quick Start Guide
order: 1
ignore: false
---

# Content starts here...

```

### `toc.config.ts` Basic Configuration

```typescript
import { defineConfig } from '@kitcaf/tocgen';

export default defineConfig({
  // Root directory to scan (default: 'docs')
  baseDir: 'docs',
  
  // Target file - location of the marker (default: 'README.md')
  outDir: 'README.md',

  // Global physical ignore (supports glob patterns)
  ignore: ['**/node_modules/**', '**/*.test.md'],
  
  // Maximum scan depth (default: 3)
  maxDepth: 3,
});

```

### `toc.config.ts` Mapping Rules

The `mapping` field is used to modify the generated directory structure, supporting the following **three types of rules**.

Note: All reserved fields (such as `$name`, `$order`, `$ignore`) use the `$` prefix to avoid conflict with filenames.

* `$name`: Modify the title displayed in the directory.
* `$order`: Smaller numbers appear first.
* `$ignore`: Whether to hide this node (**and its children**) in the directory.

**A. Global Match**

Use the `**/` prefix to match all file or directory names in the repository that share the same Key, ignoring their hierarchy depth.

```typescript
export default defineConfig({
  mapping: {
    // Object mode to configure multiple properties
    '**/faq.md': {
      $name: 'FAQ Summary',
      $order: 11,
      ignore: true
    },
    // String mode only represents the corresponding title
    '**/faq.md': 'FAQ Summary',
  }
})

```

**B. Nested Config**

Matches specific folders under the `baseDir` and supports recursive configuration of their internal structure.

Note:
(1) Do not use `/`: Key must be a single-level folder name.
(2) Do not write the scan root directory: If your `baseDir` is `docs`, write the first-level directory name under `docs` directly (e.g., write `guide` instead of `docs/guide`).

```typescript
export default defineConfig({
  baseDir: 'docs', // Assuming scanning the 'docs' directory
  
  mapping: {
    // docs/guide
    'guide': {
      $name: 'Beginner Guide', 
      $order: 1,
    
      // docs/guide/installation.md
      'installation.md': {
        $name: 'Installation Steps',
        $order: 1
      },

      // docs/guide/advanced
      'advanced': {
        $name: 'Advanced Config',
        // docs/guide/advanced/secret.md
        'secret.md': { $ignore: true } 
      }
    }
  }
});

```

**C. Exact Path Match**

Precisely locate and configure specific files or directories under a specified path.

Note:
(1) The path is relative to `baseDir`.

```typescript
export default defineConfig({
  baseDir: 'docs',
  
  mapping: {
    // Corresponding path: docs/Ai/MCP.md
    'Ai/MCP.md': {
      $name: 'Introduction to MCP',
      $ignore: false
    },

    // Or string mode - directly represents the title name
    'Ai/MCP.md': 'Introduction to MCP'
  }
});

```

## Roadmap

Future plans include:

* [ ] **Custom Templates**
* [ ] **Multi-Repo / Monorepo Support**
* [ ] **GitHub Actions Integration (CI/CD)**
* [ ] **Watch Mode**

## Contribution & Support

You are very welcome to ask questions or make suggestions. Whether it's a bug report or a feature request, **feel free to submit an Issue anytime**. Your feedback is the driving force behind the project's progress.

## License

MIT © [Kitcaf](https://github.com/kitcaf)