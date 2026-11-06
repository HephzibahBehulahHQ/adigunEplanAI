function e(e){return`﻿`+e.map(e=>e.map(e=>{let t=e===null?``:String(e);return typeof e==`string`&&/^\s*[=+@-]/.test(t)&&(t=`'`+t),`"`+t.replace(/"/g,`""`)+`"`}).join(`,`)).join(`\r
`)+`\r
`}export{e as t};