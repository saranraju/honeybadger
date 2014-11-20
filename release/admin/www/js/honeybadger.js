var HoneyBadger = (function($this){

	var ts,tp,socket,host = "ws://"+location.host+"/admin/";
	// var Emit = Emitter(this);

	var self = this;
	var __cbqueue = {},
		__modules = {},
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [],
		localDev = ( window.location.host == "localhost:8090" ) ? true : false;

	function connect()
	{
		if (ts) clearInterval(ts);
		if (tp) clearInterval(tp);

		socket = new WebSocket(host);
		socket.onopen = function(){
			// update('connectionStatus',{online:true});
			if (ts) clearInterval(ts);
			tp = setInterval(function(){
				socket.send('ping');
			}, 15000);
		};

		socket.onclose = function(){
			if (tp) clearInterval(tp);
			ts = setInterval(connect, 1000);
		};

		return socket;
	}


	var receive = function(e) {
		if (e.data === 'pong') return;

		var d = JSON.parse(e.data);
		if( localDev ){ console.dir( d ); }
		var msig = d.msig || null;
		if (msig && __cbqueue[msig]) {
			__cbqueue[msig](d);
			delete __cbqueue[msig];
			return;
		}
		if (d.event == 'log-stream') {
			// $('#'+d.target).append(d.body);
		}
	};

	var send = function(method, args, callback){
		var args = args || [];
		msig = (callback) ? (new Date().getTime() * Math.random(1000)).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
		if( localDev ){ console.trace(); console.dir({method:method,msig:msig,args:args}); }
		socket.send(JSON.stringify({method:method,msig:msig,args:args}));
	};


	var _exec = function(method, args, callback){
		send(method, args, callback);
	}

	var _private = function(message){
		console.log(self, message);
	}

	var _unsealed = function(){
		var hb = _sealed();
		hb.exec = _exec;
		hb.pm = _private;
		return hb;
	};

	var _sealed = function(){
		return {
			DataManager:{},
			module:{
				register:function(module, init) {
					if (typeof module.name == undefined || typeof module.instance == undefined) return;
					if (typeof __modules[module.name] == undefined) __modules[module.name] = module.instance
					if (init) init(_unsealed());
				}
			}
		};
	}

	return _sealed();
}(HoneyBadger||{}));
+(function($this){
	$this.module.register({
		name: 'DataManager',
		access: 'public',
		instance: this
	},function(_unsealed){ $this = _unsealed });

	var self = this,
		sources = [],
		extractors = [],
		transformers = [],
		loaders = [];

	this.list = function(id, callback){
		$this.exec('list',null,callback);
	};

	this.getExtractorList = function(){
		$this.exec('getExtractorList',null,function(e){
			if(!e.err) {
				extractors = e.body;
				// update('extractorLists', extractors);
			}
		});
	};

	this.getTransformerList = function(){
		$this.exec('getTransformerList',null,function(e){
			if(!e.err) {
				transformers = e.body;
				// update('transformerLists', transformers);
			}
		});
	};

	this.getLoaderList = function(){
		$this.exec('getLoaderList',null,function(e){
			if(!e.err) {
				loaders = e.body;
				// update('loaderLists', loaders);
			}
		});
	};

	this.refresh = function(){
		this.list();
		this.getExtractorList();
		this.getTransformerList();
		this.getLoaderList();
	};

	this.getSource = function(id){
		return DataManager.getSources().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getExtractor = function(id){
		return DataManager.getExtractors().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getTransformer = function(id){
		return DataManager.getTransformers().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getLoader = function(id){
		return DataManager.getLoaders().filter(function(e){
			if (e.id == id) return e;
			else return null;
		}).pop();
	};

	this.getSources = function(){
		return sources;
	};

	this.getExtractors = function(){
		return extractors;
	};

	this.getTransformers = function(){
		return transformers;
	};

	this.getLoaders = function(){
		return loaders;
	};

	this.source = function(name, type, properties){

	};

	this.extractor = {};
	this.extractor.validate = function(){

	};

	this.extractor.save = function(ext){
		$this.exec('saveExtractor', [ext], function(e){
			console.log(e);
		});
	};

	this.extractor.sample = function(ext, cb){
		$this.exec('testExtractor', [ext], function(e){
			cb(e);
		});
	};

	this.transformer = {};
	this.transformer.validate = function(){

	};

	this.transformer.save = function(trn){
		$this.exec('saveTransformer', [trn], function(e){
			console.log(e);
		});
	};

	this.transformer.sample = function(trn, cb){
		$this.exec('testTransformer', [trn], function(e){
			cb(e);
		});
	};

	this.loader = {};
	this.loader.validate = function(){

	};

	this.loader.validateConnection = function(ldr, cb){
		$this.exec('validateLoaderConnection', [ldr], function(e){
			cb(e);
		});
	};

	this.loader.createSchema = function(ldr, cb){
		$this.exec('createLoaderSchema', [ldr], function(e){
			cb(e);
		});
	};

	this.loader.save = function(ldr){
		$this.exec('saveLoader', [ldr], function(e){
			// console.log(e);
			cb(e);
		});
	};

	this.loader.sample = function(ldr, cb){
		$this.exec('testLoader', [ldr], function(e){
			// console.log(e);
			cb(e);
		});
	};

	$this.pm('a message from me');
}(HoneyBadger||{}));
+(function($this){

	var $hb;

	var __init = function(_unsealed) {
		$hb = _unsealed;
	};

	$this.source = function(id){
		return {
			create:function(){},
			read:function(){},
			update:function(){},
			delete:function(){}
		};
	};
	return $this;
}(HoneyBadger||{}));
/**
 * quick lifted promises
 * https://gist.github.com/softwaredoug/9044640
 */
var Promise = function(wrappedFn, wrappedThis) {
  this.then = function(wrappedFn, wrappedThis) {
    this.next = new Promise(wrappedFn, wrappedThis);
    return this.next;
  };
    
  this.run = function() {
    wrappedFn.promise = this;
    wrappedFn.apply(wrappedThis);
  };
    
  this.complete = function() {
    if (this.next) {
      this.next.run();
    }
  };
};
 
Promise.create = function(func) { 
  if (func.hasOwnProperty('promise')) { 
    return func.promise;
  } else { 
    return new Promise();
  } 
};

/**
 * This little guy might help organize things later
 * @param {object} context
 */
var Emitter = function (context){

  var _register = [];
  context.on = function(event, callback) {
    var s = _register.map(function(i){
      if (i.event !== event && i.context !== context && i.callback !== callback) return i;
    });
    if (!s.length) _register.push({
      event: event,
      context: context,
      callback: callback
    });
  };

  var _emit = function(event, data, context){
    for (var i=0; i<_register.length; i++) {
      if (_register[i].event === event && _register[i].context) _register[i].callback(data)
    }
  };

  return function Emit(event, data){
    _emit(event,data,context);
  }
};
