<#include "header.ftl">
<#assign isFiltered=(tipsType!'')?has_content posts=(data.rows)![] firstPage=(data.page!1) == 1 filterTitle=textOr(tipsName!'', tipsType!'')>
<#if (key!'')?has_content><#assign filterTitle=decodeSearch(filterTitle)></#if>
<#if !isFiltered && firstPage>
<div class="boot-line">Kernel <span>/ a personal terminal on the web</span></div>
<pre class="ascii-banner" aria-label="Kernel"> _  __                    _
| |/ /___ _ __ _ __   ___| |
| ' // _ \ '__| '_ \ / _ \ |
| . \  __/ |  | | | |  __/ |
|_|\_\___|_|  |_| |_|\___|_|</pre>
<section class="readme" aria-labelledby="readme-title"><p class="prompt"><span>${terminalUser?html}@${terminalHost?html}</span><b>:~$</b><span class="prompt-command">cat README.md</span></p><div class="command-result"><h1 id="readme-title">${textOr(_res.introTitle!'', webs.title!'Kernel')?html}</h1><p class="intro-text">${textOr(_res.introText!'', textOr(webs.second_title!'', textOr(webs.description!'', _res.defaultIntroText!'Notes on code and life.')))?html}</p><#if (_res.profileText!'')?trim?has_content><p class="profile-text">${_res.profileText?html}</p></#if><nav class="terminal-nav" aria-label="${(_res.navigation!'Navigation')?html}"><#list (init.logNavs![]) as item><a href="${item.url?html}">[${item.navName?html}]</a></#list><#if (_res.githubUrl!'')?starts_with('https://')><a href="${_res.githubUrl?html}" rel="me noreferrer" target="_blank">[GitHub ↗]</a></#if></nav></div></section>
<#else>
<section class="filtered-output"><p class="prompt"><span>${terminalUser?html}@${terminalHost?html}</span><b>:~$</b><span class="prompt-command"><#if (key!'')?has_content>grep -i "${filterTitle?html}" ./posts/*<#else>ls ./posts/</#if></span></p><h1><#if isFiltered>${filterTitle?html}<#else>${_res.entryList!'Entries'}</#if></h1></section>
</#if>
<section class="files" id="entries" aria-labelledby="files-title"><p class="prompt"><span>${terminalUser?html}@${terminalHost?html}</span><b>:~$</b><span class="prompt-command">ls -lt ./posts/</span></p><h2 id="files-title" class="sr-only">${_res.entryList!'Entries'}</h2><#if posts?has_content><div class="file-columns" aria-hidden="true"><span>#</span><span>${_res.listDate!'modified'}</span><span>${_res.fileName!'file'}</span><span>${_res.categories!'directory'}</span></div><div class="entry-list"><#list posts as post><@entry post=post number=post?index+1/></#list></div><#include "pager.ftl"><#else><#include "empty.ftl"></#if></section>
<#include "footer.ftl">
