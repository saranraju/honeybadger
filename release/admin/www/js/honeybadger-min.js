/*! honeybadger 2014-11-20 */
var Promise=function(a,b){this.then=function(a,b){return this.next=new Promise(a,b),this.next},this.run=function(){a.promise=this,a.apply(b)},this.complete=function(){this.next&&this.next.run()}};Promise.create=function(a){return a.hasOwnProperty("promise")?a.promise:new Promise};var Emitter=function(a){var b=[];a.on=function(c,d){var e=b.map(function(b){return b.event!==c&&b.context!==a&&b.callback!==d?b:void 0});e.length||b.push({event:c,context:a,callback:d})};var c=function(a,c){for(var d=0;d<b.length;d++)b[d].event===a&&b[d].context&&b[d].callback(c)};return function(b,d){c(b,d,a)}},Modular=function(a,b){var c={},d=[],e=function(a){return d.push(a),b()};this.init=function(){for(var a=0;a<d.length;a++)d[a]()},this.register=function(a,b){void 0!=typeof a.name&&void 0!=typeof a.instance&&(void 0==typeof c[a.name]&&(c[a.name]=a.instance),b&&b(e))}},Extend=function(a,b){var c={};for(var d in a)if(a.hasOwnProperty(d)){var e=a[d];c[d]=function(){e.apply(c,arguments)}}for(var d in b)b.hasOwnProperty(d)&&(c[d]=b[d]);return c},HoneyBadger=function(){var a,b,c,d="ws://"+location.host+"/admin/",e={},f=!1,g="localhost:8090"==window.location.host||window.location.host.indexOf("192.168")>-1?!0:!1,h={},i={},j=new Emitter(i),k=new Modular(this,function(){return Extend(h,i)});console.log("HoneyBadger starting up");var l=function(){console.log("HoneyBadger initializing"),m(),console.log("HoneyBadger initializing submodules"),k.init(),console.log("HoneyBadger initializing complete!")},m=function(){return a&&clearInterval(a),b&&clearInterval(b),c=new WebSocket(d),c.onopen=function(){a&&clearInterval(a),b=setInterval(function(){c.send("ping")},15e3),j("readyStateChange",1)},c.onclose=function(){b&&clearInterval(b),a=setInterval(m,1e3)},c.onmessage=o,c},n=function(a,b,d){var b=b||[],h=d?((new Date).getTime()*Math.random(1e3)).toString(36):null;h&&(e[h]=d),g&&f&&(console.trace(),console.dir({method:a,msig:h,args:b})),c.send(JSON.stringify({method:a,msig:h,args:b}))},o=function(a){if("pong"!==a.data){g&&f&&console.dir(a);var b=JSON.parse(a.data),c=b.msig||null;return c&&e[c]?(e[c](b),void delete e[c]):void("log-stream"==b.event)}};return h.init=l,h.module={register:k.register},i.exec=function(a,b,c){n(a,b,c)},h}(HoneyBadger||{});+function(a){var b=this,c=[],d=[],e=[],f=[],g=function(){console.log("DataManager constructor"),a.on("readyStateChange",function(a){1===a&&(i("ready",!0),b.refresh())})},h=function(){console.log("DataManager initialized")};a.module.register({name:"DataManager",instance:this},function(b){a=b(h),g()});var i=new Emitter(this);HoneyBadger.DataManager=this,this.loadSources=function(d){var e=Promise.create(b.loadSources);return a.exec("list",null,function(a){a.err||(c=a.body),d&&d(a),i("sources",c),e.complete()}),e},this.loadExtractors=function(c){var e=Promise.create(b.loadExtractors);return a.exec("getExtractorList",null,function(a){a.err||(d=a.body),c&&c(a),i("extractors",d),e.complete()}),e},this.loadTransformers=function(c){var d=Promise.create(b.loadTransformers);return a.exec("getTransformerList",null,function(a){a.err||(e=a.body),c&&c(a),i("transformers",e),d.complete()}),d},this.loadLoaders=function(c){var d=Promise.create(b.loadLoaders);return a.exec("getLoaderList",null,function(a){a.err||(f=a.body),c&&c(a),i("loaders",f),d.complete()}),d},this.refresh=function(a){this.loadSources().then(this.loadExtractors).then(this.loadTransformers).then(this.loadLoaders).then(function(){a&&a(),i("refresh",{sources:c,extractors:d,transformers:e,loaders:f})})},this.getSources=function(){return c},this.getExtractors=function(){return d},this.getTransformers=function(){return e},this.getLoaders=function(){return f},this.getSource=function(a){return b.getSources().filter(function(b){return b.id==a?b:null}).pop()},this.getExtractor=function(a){return b.getExtractors().filter(function(b){return b.id==a?b:null}).pop()},this.getTransformer=function(a){return b.getTransformers().filter(function(b){return b.id==a?b:null}).pop()},this.getLoader=function(a){return b.getLoaders().filter(function(b){return b.id==a?b:null}).pop()},this.source=function(){},this.extractor={},this.extractor.validate=function(){},this.extractor.save=function(b){a.exec("saveExtractor",[b],function(a){console.log(a)})},this.extractor.sample=function(b,c){a.exec("testExtractor",[b],function(a){c(a)})},this.transformer={},this.transformer.validate=function(){},this.transformer.save=function(b){a.exec("saveTransformer",[b],function(a){console.log(a)})},this.transformer.sample=function(b,c){a.exec("testTransformer",[b],function(a){c(a)})},this.loader={},this.loader.validate=function(){},this.loader.validateConnection=function(b,c){a.exec("validateLoaderConnection",[b],function(a){c(a)})},this.loader.createSchema=function(b,c){a.exec("createLoaderSchema",[b],function(a){c(a)})},this.loader.save=function(b){a.exec("saveLoader",[b],function(a){cb(a)})},this.loader.sample=function(b,c){a.exec("testLoader",[b],function(a){c(a)})}}(HoneyBadger||{}),+function(a){return a.source=function(){return{create:function(){},read:function(){},update:function(){},"delete":function(){}}},a}(HoneyBadger||{});