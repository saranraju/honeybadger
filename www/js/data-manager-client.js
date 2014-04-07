var ts;
var socket;
var host = "ws://"+location.hostname+":8090/";

var events = {
	onsave: function(res){
	},
	onlist: function(res){
	},
	onload: function(res){
	},
	ondestroy: function(res){
	}
};

function update(element,data)
{
	var connectionStatus = function(d) {
		if (d.online && d.online === true) {
			$('#connection').addClass('online').removeClass('offline');
			$('#connection .status').text('Online');
		}
		else {
			$('#connection').addClass('offline').removeClass('online');
			$('#connection .status').text('Offline');
		}
	};

	var sourceLists = function(d) {
		$('#activeSources > tbody').html('');
		$('#inactiveSources > tbody').html('');
		$('#sourceList > tbody').html('');
		$(d).each(function(index, item){
			$('#sourceList > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>'+item.value.status+'</td></tr>')
			if (item.value.status === 'active') $('#activeSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>--</td></tr>');
			else $('#inactiveSources > tbody').append('<tr><td>'+item.key+'</td><td>'+item.value.type+'</td><td>--</td></tr>') ;
		});
	};

	switch(element)
	{
		case "connectionStatus":
			connectionStatus(data);
		break;
		case "sourceLists":
			sourceLists(data);
		break;
	}
}

function connect()
{
	if (ts) clearInterval(ts);
	socket = new WebSocket(host);
	socket.onopen = function(){
		update('connectionStatus',{online:true});
		DataManager.list();
		DataManager.alert('Connected to server.');
		if (ts) clearInterval(ts);
	};

	socket.onclose = function(){
		update('connectionStatus',{online:false});
		DataManager.alert('Connection to server lost. Trying to restablish connection with the server.',{type:'danger'});
		ts = setInterval(connect, 1000);
	};

	DataManager.bind(socket);
}

var DataManager = new (function(){

	var __cbqueue = {},
		sources = [],
		pages = {
			dashboard: $('#dashboard').hide(),
			sourceManager: $('#sourceManager').hide()
		};


	var receive = function(e) {
		// console.log(e.data);
		var d = JSON.parse(e.data);
		var e = d.event;
		var msig = d.msig || null;
		if (msig && __cbqueue[msig]) {
			__cbqueue[msig](d);
			delete __cbqueue[msig];
		}
	}

	var send = function(method, args, callback){
		var args = args || [];
		msig = (callback) ? (new Date().getTime()).toString(36) : null;
		if (msig) { __cbqueue[msig] = callback }
		socket.send(JSON.stringify({method:method,msig:msig,args:args}));
	};

	this.bind = function(socket) {
		socket.onmessage = receive;
	};

	this.alert = function(msg, opts){
		if (arguments.length == 1) {
			var opts = (typeof msg === 'string') ? {
					msg: msg,
				} : msg;
		}

		var opts = opts || {};
		opts.type = opts.type || 'info';
		opts.msg = opts.msg || msg;
		opts.hide = opts.hide || 3;

		$('#alerts').prepend($('<div class="alert alert-'+opts.type+' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+opts.msg+'</div>').slideDown().delay( opts.hide * 1000 ).fadeOut(function(){
			$(this).remove();
		}));
	};

	this.reset = function(){
	};

	this.list = function(id){
		send('list',null,function(e){
			if (!e.err) {
				sources = e.body;
				update('sourceLists',sources);
			}
		});
	};

	this.load = function(id){
		socket.send(JSON.stringify({method:'load',args:[id]}));
	};

	this.destroy = function(id,rev){
		if (confirm('Are you sure?')) socket.send(JSON.stringify({method:'destroy',args:[id,rev]}));
	};

	this.save = function(){
	};

	this.navigate = function(page, callback){
		if (typeof pages[page] == 'undefined') return false;

		$('#bs-example-navbar-collapse-1 li.active').removeClass('active');
		$('[data-target="'+page+'"]').closest('.nav-item').addClass('active');
		$('#bodyContent > *').hide();
		pages[page].show();
	};

	$('[data-toggle="page"]').each(function(index,item){
		$(item).click(function(){
			DataManager.navigate($(this).attr('data-target'));
		});
	})

})();

connect();
if (document.location.hash) DataManager.navigate(document.location.hash.replace('#',''));
else DataManager.navigate('dashboard');
