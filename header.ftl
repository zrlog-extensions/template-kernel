<#include "components.ftl">
<#assign terminalUser=textOr(_res.terminalUser!'', _res.defaultTerminalUser!'user')>
<#assign terminalHost=textOr(_res.terminalHost!'', 'blog')>
<!DOCTYPE html>
<html lang="${(lang!'en')?replace('_','-')?html}" data-theme="black">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title><#if (key!'')?has_content>${decodeSearch(title!webs.title!'Kernel')?html}<#else>${(title!webs.title!'Kernel')?html}</#if></title>
<meta name="description" content="${(description!webs.description!'')?html}">
<link rel="icon" href="${baseUrl}favicon.ico">
<script>try{var c=document.cookie.split(';').map(function(v){return v.trim();}).find(function(v){return v.indexOf('kernel-theme=')===0;});var k=c?decodeURIComponent(c.slice(13)):'';if(['black','amber','dracula','nord'].indexOf(k)!==-1)document.documentElement.dataset.theme=k;}catch(e){}</script>
<link rel="stylesheet" href="${baseUrl}assets/css/markdown.css">
<link rel="stylesheet" href="${baseUrl}assets/css/pretty-print.css">
<link rel="stylesheet" href="${baseUrl}assets/css/hljs/dark.css">
<link rel="stylesheet" href="${url}/css/katex.min.css">
<link rel="stylesheet" href="${url}/css/style.css?v=394cfe1db4a2">
<script defer src="${url}/js/kernel.js?v=3eb1a326c32f"></script>
</head>
<body data-home-url="${baseUrl?html}" data-copy-label="${(_res.copyCode!'Copy')?html}" data-copied-label="${(_res.codeCopied!'Copied')?html}" data-copy-failed="${(_res.copyFailed!'Unable to copy. Select the code manually.')?html}" data-terminal-help-label="${(_res.terminalHelp!'help / ls / cat 01 / search Java / theme / cd ~ / clear')?html}" data-terminal-not-found="${(_res.terminalNotFound!'No entry: {index}')?html}" data-terminal-empty="${(_res.terminalEmpty!'No entries on this page.')?html}" data-terminal-boundary="${(_res.terminalBoundary!'No further pages.')?html}" data-theme-changed="${(_res.themeChanged!'Theme: ')?html}">
<a class="skip-link" href="#main-content">${_res.skipContent!'Skip to content'}</a>
<div class="terminal-window">
<header class="terminal-chrome"><span class="window-controls" aria-hidden="true"><i></i><i></i><i></i></span><a class="session-title" href="${baseUrl}">${terminalUser?html}@${terminalHost?html}<span>: ~</span></a><div class="terminal-chrome-actions"><label class="theme-picker"><span>${_res.themeLabel!'theme'}</span><select data-theme-select aria-label="${(_res.themeLabel!'Terminal colors')?html}"><option value="black">Black</option><option value="amber">Amber</option><option value="dracula">Dracula</option><option value="nord">Nord</option></select></label><button type="button" data-command-open aria-label="${(_res.search!'Search')?html}">[/]</button></div></header>
<div class="reading-progress" data-reading-progress aria-hidden="true"></div>
<main id="main-content" class="terminal-screen" data-terminal-scroll tabindex="-1">
