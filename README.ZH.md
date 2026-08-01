# Grille Accords SVG

[English](README.EN.md) · [Español](README.ES.md) · [Português](README.PT.md) · [العربية](README.AR.md) · [Brezhoneg](README.BR.md) · [中文](README.ZH.md) · [Français](README.FR.md) · [हिन्दी](README.HI.md) · [Kurdî](README.KU.md)

将简洁的文本描述转换为清晰、可演奏的和弦表，可用于排练、打印、试听和导出。

## 功能

- 带行号、光标位置和当前行高亮的编辑器
- 阻止错误渲染的诊断，显示错误所在行、位置和符号
- SVG 预览、移调和带节拍器的 Web Audio 播放
- 导出文本、SVG、PNG、WebP、MIDI 和 MusicXML
- 打印、全屏、可调整面板以及浅色/深色模式
- 界面和帮助支持九种语言

## 安装

请先安装 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/installation)，然后依次执行：

```sh
git clone https://github.com/jt291/grille-accords-svg.git
cd grille-accords-svg
pnpm install
pnpm dev
```

应用会自动在 `http://localhost:4317/` 打开。

## 常用命令

```sh
pnpm test
pnpm check
pnpm run docs
pnpm build
pnpm preview
```

[打开应用](https://grille-accords-svg.jtisseau.chatgpt.site/)

[浏览 TypeScript API 文档](https://jt291.github.io/grille-accords-svg/)
