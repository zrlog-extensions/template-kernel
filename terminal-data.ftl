<#-- Escape less-than as well as JSON syntax so content can never close this script element. -->
<#function jsonText value><#return value?string?json_string?replace('<', r'\u003c')></#function>
<script type="application/json" id="kernel-data">
{"schemaVersion":1,"articleScope":"current-page","homeUrl":"${jsonText(baseUrl)}","searchUrl":"${jsonText(searchUrl)}",
"articles":[<#list ((data.rows)![]) as post>{"index":"${post?counter?string('00')}","title":"${jsonText(plainTitle(post.title!_res.untitled!'Untitled'))}","url":"${jsonText(post.url)}"}<#sep>,</#list>],
"categories":[<#list (init.types![]) as item>{"title":"${jsonText(item.typeName)}","url":"${jsonText(item.url)}"}<#sep>,</#list>],
"tags":[<#list (init.tags![]) as item>{"title":"${jsonText(item.text)}","url":"${jsonText(item.url)}"}<#sep>,</#list>],
"archives":[<#list (init.archiveList![]) as item>{"title":"${jsonText(item.text)}","url":"${jsonText(item.url)}"}<#sep>,</#list>],
"links":[<#list (init.links![]) as item>{"title":"${jsonText(item.linkName)}","url":"${jsonText(item.url)}"}<#sep>,</#list>]}
</script>
