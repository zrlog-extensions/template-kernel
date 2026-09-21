<#function textOr value fallback><#if value?trim?has_content><#return value><#else><#return fallback></#if></#function>
<#function plainTitle value><#return value?replace('<font color="#CC0000">', '')?replace('</font>', '')></#function>
<#function decodeSearch value><#return value?replace('&lt;', '<')?replace('&gt;', '>')?replace('&quot;', '"')?replace('&#39;', "'")?replace('&amp;', '&')></#function>
<#function hasAdjacent candidate article>
<#local candidateUrl=candidate.url!'' candidateAlias=candidate.alias!''>
<#if !candidateUrl?has_content || candidateUrl == (article.url!'')><#return false></#if>
<#if candidateAlias?matches('[0-9]+') && article.logId?? && candidateAlias?number == article.logId><#return false></#if>
<#return true>
</#function>
<#macro icon kind='file'>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><#if kind == 'folder'><path d="M3 7V4h7l2 3h9v13H3z"/><path d="M3 10h18"/><#elseif kind == 'search'><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/><#elseif kind == 'arrow'><path d="M5 12h14m-6-6 6 6-6 6"/><#else><path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h5"/></#if></svg>
</#macro>
<#macro date post><#if (post.releaseTime!'')?has_content><#local day=post.releaseTime?string?split('T')[0]?split(' ')[0]><time datetime="${day?html}">${day?html}</time></#if></#macro>
<#macro category post><#if (post.typeName!'')?has_content><#if (post.typeUrl!'')?has_content><a class="entry-category" href="${post.typeUrl?html}">${post.typeName?html}</a><#else><span class="entry-category">${post.typeName?html}</span></#if></#if></#macro>
<#macro entry post number>
<article class="entry" data-entry-index="${number?string('00')}"><span class="entry-number">${number?string('00')}</span><span class="entry-date"><@date post=post/></span><h2><a href="${post.url?html}" data-entry-link>${plainTitle(post.title!_res.untitled!'Untitled')?html}<span class="file-extension" aria-hidden="true">.md</span></a></h2><div class="entry-type"><@category post=post/></div></article>
</#macro>
