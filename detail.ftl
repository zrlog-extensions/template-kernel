<#include "header.ftl">
<#if log??>
<article class="article-document"><header class="article-heading"><p class="prompt"><span>${terminalUser?html}@${terminalHost?html}</span><b>:~$</b><span class="prompt-command">less ${(log.alias!'article')?html}.md</span></p><div class="reader-meta"><@date post=log/><span>/</span><@category post=log/><span>/</span><span>@${(log.userName!webs.author!terminalUser)?html}</span></div><h1>${log.title?html}</h1><details class="reader-outline" data-toc hidden><summary>${_res.toc!'Contents'}</summary><nav aria-label="${(_res.toc!'Contents')?html}"><ol data-toc-list></ol></nav></details></header><#include "article.ftl"><#include "comment.ftl"><p class="reader-end">(END) <a href="${baseUrl}">[q] ${_res.backToList!'Back to entries'}</a></p></article>
<#else><#include "not-found-content.ftl"></#if>
<#include "footer.ftl">
