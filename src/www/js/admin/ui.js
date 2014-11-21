+(function($admin,$){

	var self = $admin.UI = this;
	var private = {}, protected = {}, pages = {};
	var $HB, $DM;

	var _construct = function() {
		console.log('Admin.UI constructor');
		$HB = $admin._parent;
		$DM = $HB.DataManager;
	};

	var _init = function() {
		// Our parent already listens for DOM ready
		
		/**************** UI Bindings ***************/
		/**
		 * This HUGE block handles all of the setup and bindings
		 * For latching onto buttons, initializing the UI, etc.
		 * This is essentially our root DOM ready handler
		 *
		 * If you're wondering, "Where the fuck is the handler
		 * for this stupid button?"; or "How is this UI event
		 * getting handled?" - this is your spot.
		 *
		 * If you're looking for where data is rendered into the
		 * UI, where DOM getting manipulated or updated; look at
		 * view.js
		 */

		pages = {
			dashboard: $('#dashboard').hide(),
			sourceManager: $('#sourceManager').hide(),
			extractorManager: $('#extractorManager').hide(),
			transformManager: $('#transformManager').hide(),
			loaderManager: $('#loaderManager').hide()
		};

		$('[data-toggle="page"]').each(function(index,item){
			$(item).click(function(){
				self.navigate($(this).attr('data-target'));
			});
		});

		/**
		 * Handle keep any log windows down to the bottom
		 */
		$('.logger').each(function(index, item){
			item.addEventListener("DOMNodeInserted", function(e){
				this.scrollTop = this.scrollHeight;
			});
		});

		/**
		 * Detect when source modal is activated 
		 */
		$('#sourceEditor').on('show.bs.modal', function(){
			resetWizard('sourceEditor');
		})

		/**
		 * Detect when extractor modal is activated 
		 */
		$('#extractorWizard').on('show.bs.modal', function(){
			resetWizard('extractorWizard');
		})

		/**
		 * Detect when transformer modal is activated 
		 */
		$('#transformWizard').on('show.bs.modal', function(){
			resetWizard('transformWizard');
		})

		/**
		 * Detect when loader modal is activated 
		 */
		$('#loaderWizard').on('show.bs.modal', function(){
			resetWizard('loaderWizard');
		})

		/**
		 * Reset our wizards
		 */
		resetWizard('extractorWizard');
		resetWizard('transformWizard');
		resetWizard('loaderWizard');
		// $('.wizard section.step').first().show();

		/**************** UI Bindings ***************/
		/**************** Sources ***************/

		$('#validateBtn').click(function(){
			Admin.Validator.source.validate();
		});

		$('#sourceEditor [am-Button~=save]').click(function(){
			Admin.Validator.source.save();
		});

		/**
		 * From the source Wizard; display source options based on selected source type
		 */
		$('#sourcetype').change(function(){
			sourceModalReset();
			if ($(this).val() == 'RETS') $('#source_RETS').show();
			else if ($(this).val() == 'FTP') $('#source_FTP').show();
			else if ($(this).val() == 'SOAP') $('#source_SOAP').show();
			else if ($(this).val() == 'REST') $('#source_REST').show();
			else if ($(this).val() == 'XML') $('#source_XML').show();
		}).change();

		/**************** UI Bindings ***************/
		/**************** Extractors ***************/

		/**
		 * From the extractor Wizard; if selected source is FTP, bind to the browse button
		 * to find a target from the FTP source
		 */
		$('#ext-ftp-browse').click(function(){
			$DM.ftpBrowse($DM.getSource($('#ext-source-select').val()), function(e){
				if(!e.err && e.body.success === true) {
					$('#ext-ftp-browser .files').empty();
					e.body.list.forEach(function(item, index){
						if (item.name) $('#ext-ftp-browser .files').append($('<li class="file">'+item.name+'</li>').click(function(){
							$('#ftpFileName').val(item.name);
							$('#ext-ftp-browser .files').empty();
							$('#extractionWizardNext').removeAttr("disabled");
						}));
					});
				}
			});
		});

		/**
		 * From the extractor wizard:
		 * When selecting a data source for an extractor let's do some logic
		 * based on the type of source they've chosen
		 */
		$('#extractorWizard .source-options').hide();
		$('#ext-source-select').change(function(){
			var s = $DM.getSource($(this).val());

			$('#ext-rets-options .rets-resource').hide();
			$('#ext-rets-options .rets-classification').hide();
			$('#extractorWizard .source-options').hide();
			if (s.value.source.type === 'FTP') {
				$('#ext-ftp-browser .files').empty();
				$('#ftpRootPath').val('');
				$('#ftpFileName').val('');
				$('#ext-ftp-options').show();
				$('#ext-rets-options').hide();
				$('#ext-step-2 > .ext-ftp-options').show();
				$('#ext-step-2 > .ext-rets-options').hide();
			}
			else if (s.value.source.type === 'RETS') {
				$('#ext-ftp-options').hide();
				$('#ext-rets-options').show();
				$('#ext-step-2 > .ext-ftp-options').hide();
				$('#ext-step-2 > .ext-rets-options').show();

				s.value.source.rets = { resource: $('#ext-rets-resource').val() };
				$DM.retsExplore(s.value, function(e){
					if (e.body.meta) {
						$('#ext-rets-resource').html('<option>-- Select a data resource --</option>');
						$.each(e.body.meta.data,function(index,item){
							// console.log(item);
							$('#ext-rets-resource').append('<option value="'+item.ResourceID[0]+'">'+item.VisibleName[0]+'</option>');
							$('#ext-rets-options .rets-resource').removeClass('hide').show();
						});
					}
				});
			}
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a resource
		 */
		$('#ext-rets-resource').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = { resource: $('#ext-rets-resource').val() };
			$DM.retsBrowse(s, function(e){
				if (e.body.meta) {
					$('#ext-rets-class').html('<option>-- Select a data class --</option>')
					$.each(e.body.meta.data,function(index,item){
						// console.log(item);
						$('#ext-rets-class').append('<option value="'+item.ClassName[0]+'">'+item.VisibleName[0] + ((item.StandardName[0]) ? ' : '+item.StandardName[0] : '') +'</option>');
						$('#ext-rets-options .rets-classification').removeClass('hide').show();
					});
				}
			});
		});

		/**
		 * From the extractor wizard; for RETS sources, when a user selects a class
		 */
		$('#ext-rets-class').change(function(){
			var s = $DM.getSource($('#ext-source-select').val()).value;
			s.source.rets = {
				resource: $('#ext-rets-resource').val(),
				classification: $('#ext-rets-class').val()
			};
			$DM.retsInspect(s, function(e){
				$('#ext-step-2 > .ext-rets-options .fields').html('');
				$.each(e.body.meta.data, function(index,item){
					// console.log(item);
					$('#ext-step-2 > .ext-rets-options .fields').append('<div class="item"><strong>'+item.LongName[0]+'</strong> <em>'+index+'</em> <small>'+item.StandardName[0]+'</small> '+((item.Searchable[0] == '1') ? '<span class="badge">Searchable</span>' : '')+'<div class="detail"><small><em>'+item.DataType[0]+'</em> </small></div></div>');
					// +item.ShortName[0]+' '+item.DBName[0]+' '
				});
			});
		});

		/**
		 * From the extractor wizard: bindings for the Next button
		 */
		$('#extractorWizardNext').click(function(){

			var finish = function(){
				$('#extractorWizard').modal('hide');
				$DM.extractor.validate(ext());
				$DM.extractor.save(ext());
			}

			if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) return finish();

			$('#extractorWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
			$('#extractorWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
			if (!$('#extractorWizard section.step.active').is($('#extractorWizard section.step').first())) $('#extractorWizardBack').removeAttr('disabled');
			if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) $('#extractorWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
		});

		/**
		 * From the extractor wizard: bindings for the Back button
		 */
		$('#extractorWizardBack').click(function(){
			$('#extractorWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
			$('#extractorWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
			if ($('#extractorWizard section.step.active').is($('#extractorWizard section.step').first())) $('#extractorWizardBack').attr('disabled','disabled');
			if (!$('#extractorWizard section.step.active').is($('#extractorWizard section.step').last())) $('#extractorWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
		});

		/**
		 * From the extractor wizard: bindings for unarchive options
		 */
		$('#ext-unarchive').change(function(){
			if ($('#ext-unarchive')[0].checked) $('#ext-archive-opts').removeAttr('disabled');
			else  $('#ext-archive-opts').attr('disabled','disabled');
		});

		/**
		 * From the extractor wizard: Run the extractor test
		 */
		$('#ext-test').click(function(){
			$('#extraction-result').html('');
			$DM.extractor.sample(ext(),function(e){
				if (!e.err) {
					$('#extraction-result').html('<p class="bg-success">Extractor Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#extractorWizardNext').removeAttr('disabled');
				} else {
					$('#extractorWizardNext').attr('disabled','disabled');
					$('#extraction-result').html('<p class="bg-danger">Extractor Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
				}
			});
		});

		/**
		 * Clear the log window
		 */
		$('#ext-test-clear').click(function(){
			$('#extraction-log-body').html('');
			$('#extraction-result').html('');
		});

		/**************** UI Bindings ***************/
		/**************** Transformer ***************/

		/**
		 * Transform Wizard next button
		 */
		$('#transformWizardNext').click(function(){

			var finish = function(){
				$('#transformWizard').modal('hide');
				$DM.transformer.validate(trn());
				$DM.transformer.save(trn());
			}

			if ($('#transformWizard section.step.active').is($('#transformWizard section.step').last())) return finish();

			$('#transformWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
			$('#transformWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
			if (!$('#transformWizard section.step.active').is($('#transformWizard section.step').first())) $('#transformWizardBack').removeAttr('disabled');
			if ($('#transformWizard section.step.active').is($('#transformWizard section.step').last())) $('#transformWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
		});

		/**
		 * Back button handling for the transform wizard
		 */
		$('#transformWizardBack').click(function(){
			$('#transformWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
			$('#transformWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
			if ($('#transformWizard section.step.active').is($('#transformWizard section.step').first())) $('#transformWizardBack').attr('disabled','disabled');
			if (!$('#transformWizard section.step.active').is($('#transformWizard section.step').last())) $('#transformWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
		});

		/**
		 * Input type selection for the transformer
		 * This should pretty much just be "bind to extractor" now
		 */
		$('#trn-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#trn-source-select').removeAttr('disabled');
			else $('#trn-source-select').attr('disabled','disabled');
		});

		/**
		 * When a user selects an extractor to feed into the transformer let's load
		 * some metadata
		 */
		$('#trn-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getExtractors().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();

			$DM.extractor.sample(s.value,function(e){
				console.log(e.body);
				if (!e.err) update('dataStructures',e.body);
			});
		});

		$('#transformNormalize').hide();
		$('#transformMapper').hide();

		/**
		 * When you choose a transformation type
		 */
		$('#trn-transform-type').change(function(){
			if ($(this).val() == 'normalize') {
				$('#transformNormalize').show();
				$('#transformMapper').hide();
			}
			if ($(this).val() == 'map') {
				$('#transformNormalize').hide();
				$('#transformMapper').show();
			}
		});

		/**
		 * Bind to the transformer test button
		 */
		$('#trn-test').click(function(){
			$('#transformer-result').html('');
			$DM.transformer.sample(trn(),function(e){
				if (!e.err) {
					$('#transformer-result').html('<p class="bg-success">Transform Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#transformWizardNext').removeAttr('disabled');
				} else {
					$('#transformer-result').html('<p class="bg-danger">Transform Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
					$('#transformWizardNext').attr('disabled','disabled');
				}
			});
		});

		/**
		 * Reset tranform test log
		 */
		$('#trn-test-clear').click(function(){
			$('#transformer-log-body').html('');
			$('#transformer-result').html('');
		});

		/**************** UI Bindings ***************/
		/****************  Loaders  ***************/


		/**
		 * Loader Wizard next button
		 */
		$('#loaderWizardNext').click(function(){

			var finish = function(){
				$('#loaderWizard').modal('hide');
				$DM.loader.validate(ldr());
				$DM.loader.save(ldr());
			}

			if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) return finish();

			$('#loaderWizard section.step.active').hide().removeClass('active').next().show().addClass('active');
			$('#loaderWizard .navigator .step.bg-primary').removeClass('bg-primary').next().addClass('bg-primary');
			if (!$('#loaderWizard section.step.active').is($('#loaderWizard section.step').first())) $('#loaderWizardBack').removeAttr('disabled');
			if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) $('#loaderWizardNext').text('Finish').removeClass('btn-primary').addClass('btn-success').attr('disabled','disabled');
		});

		/**
		 * Loader wizard back button
		 */
		$('#loaderWizardBack').click(function(){
			$('#loaderWizard section.step.active').hide().removeClass('active').prev().show().addClass('active');
			$('#loaderWizard .navigator .step.bg-primary').removeClass('bg-primary').prev().addClass('bg-primary');
			if ($('#loaderWizard section.step.active').is($('#loaderWizard section.step').first())) $('#loaderWizardBack').attr('disabled','disabled');
			if (!$('#loaderWizard section.step.active').is($('#loaderWizard section.step').last())) $('#loaderWizardNext').text('Next').removeClass('btn-success').addClass('btn-primary').removeAttr('disabled');
		});

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-toggle').change(function(){
			if ($(this).val() !== 'custom') $('#ldr-source-select').removeAttr('disabled');
			else $('#ldr-source-select').attr('disabled','disabled');
		});

		var trnSample = {};

		/**
		 * When choosing a transformer to feed the loader
		 */
		$('#ldr-source-select').change(function(){
			var v = $(this).val();
			var s = $DM.getTransformers().filter(function(e){
				if (e.id == v) return e;
				else return null;
			}).pop();

			$DM.transformer.sample(s.value,function(e){
				if (!e.err) {
					update('loaderDefinition',e.body);
					trnSample = e.body;
				} 
			});
		});

		$('#loaderMySQL').hide();
		$('#loaderCouchDB').hide();
		$('#loaderFTP').hide();
		$('#ldr-target-type').change(function(){
			switch($(this).val())
			{
				case "mysql":
					$('#loaderMySQL').show();
					$('#loaderCouchDB').hide();
					$('#loaderFTP').hide();
				break;
				case "couchdb":
					$('#loaderMySQL').hide();
					$('#loaderCouchDB').show();
					$('#loaderFTP').hide();
				break;
				case "ftp":
					$('#loaderMySQL').hide();
					$('#loaderCouchDB').hide();
					$('#loaderFTP').show();
				break;
			}
		});

		/**
		 * Bindings to validate the loader DSN, URI, whatever
		 */
		$('#loaderDSN button').click(function(){
			$DM.loader.validateConnection(ldr(),function(e){
				var t = $('#ldr-target-type').val();
				var btn = (t === 'mysql') ? '#ldr-mysql-validate' : '#ldr-couchdb-validate';
				$(btn).removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$(btn).removeClass('btn-primary').addClass('btn-success')
					$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
				} else {
					$(btn).removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
					$(btn+' .validation-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
				}

			});
		});

		/**
		 * Bindings to the create schema button for MySQL loaders
		 */
		$('#ldr-create-schema').click(function(){
			$DM.loader.createSchema(ldr(),function(e){
				$('#ldr-create-schema').removeClass('btn-danger btn-success').addClass('btn-primary');
				if (!e.err) {
					$('#ldr-create-schema').removeClass('btn-primary').addClass('btn-success')
					$('#ldr-create-schema .schema-status').removeClass('glyphicon-asterisk').addClass('glyphicon-ok-sign');
				} else {
					$('#ldr-create-schema').removeAttr('disabled').removeClass('btn-primary').addClass('btn-danger')
					$('#ldr-create-schema .schema-status').removeClass('glyphicon-asterisk').addClass('glyphicon-exclamation-sign');
				}

			});
		});

		$('#loaderSchemas .fields').hide();
		$('#ldr-new-schema').click(function(){
			$('#loaderSchemas .create').hide();
			$('#loaderSchemas .fields').show();
		});

		/**
		 * Binding for running loader tests
		 */
		$('#ldr-test').click(function(){
			$('#loader-result').html('');
			$DM.loader.sample(ldr(),function(e){
				if (!e.err) {
					$('#loader-result').html('<p class="bg-success">Loader Test Completed Successfully <span class="glyphicon glyphicon-ok-circle"></span></p>');
					$('#loaderWizardNext').removeAttr('disabled');
				} else {
					$('#loader-result').html('<p class="bg-danger">Loader Test Failed! Check your settings and try again. <span class="glyphicon glyphicon-warning-sign"></span></p>');
					$('#loaderWizardNext').attr('disabled','disabled');
				}
			});
		});

		/**
		 * Clear the loader test log
		 */
		$('#ldr-test-clear').click(function(){
			$('#loader-log-body').html('');
			$('#loader-result').html('');
		});


		/**
		 * Finish by navigating to a page
		 */

		if (document.location.hash) self.navigate(document.location.hash.replace('#',''));
		else self.navigate('dashboard');

		console.log('Admin.UI initialized');
	};

	$admin.module.register({
		name: 'UI',
		instance: this
	},function(_unsealed){
		// Initialize module
		$admin = _unsealed(_init); // fire constructor when DOM ready
		_construct();
	});

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

	/**
	 * Reset the UI - All of it if you dare
	 * 
	 * @return {[type]} [description]
	 */
	this.reset = function() {

	};

	this.navigate = function(page, callback){
		if (typeof pages[page] == 'undefined') return false;

		$('#bs-example-navbar-collapse-1 li.active').removeClass('active');
		$('[data-target="'+page+'"]').closest('.nav-item').addClass('active');
		$('#bodyContent > *').hide();
		pages[page].show();
	};

	/**
	 * Modal resets
	 */
	this.sourceModalReset = function(){
		$('#validateBtn').removeAttr('disabled').removeClass('btn-danger btn-success').addClass('btn-primary');
		$('#sourceValidationStatus').removeClass('glyphicon-ok-sign glyphicon-exclamation-sign');
		$('#sourceTypeOptions .option-group').hide();
		$('#sourceEditorSave').prop('disabled',false);
	};

	this.resetWizard = function(id){
		$('#'+id).attr({'data-id':'','data-rev':''});
		$('#'+id+' section.step').hide().first().show();
		$('#'+id+' .files').empty();
		$('input[type=text], input[type=password], select, textarea','#'+id).val('');
	};

	/**
	 * Populate the proper wizard with saved data
	 * @param  {[type]} id
	 * @param  {[type]} data
	 * @return {[type]}
	 */
	this.setupWizard = function(id, data){
		// ONLY EXECUTES ON EDIT NOT "NEW"
		console.log(data);
		resetWizard(id);
		switch(id)
		{
			case "sourceEditor":
				sourceModalReset();

				$('#sourceEditor').attr('data-id',data._id);
				$('#sourceEditor').attr('data-rev',data._rev);

				$('#sourcename').val(data.name);
				$('#sourcetype').val(data.source.type);
				if (data.source.type == 'RETS') {
					$('#sourceuri').val(data.source.uri);
					$('#sourceuser').val(data.source.auth.username);
					$('#sourcepassword').val(data.source.auth.password);
					$('#sourceua').val(data.source.auth.userAgentHeader);
					$('#sourceuapw').val(data.source.auth.userAgentPassword);
					$('#source_RETS').show();
				} else if (data.source.type == 'FTP') {
					$('#ftphost').val(data.source.uri);
					$('#ftpuser').val(data.source.auth.username);
					$('#ftpauth').val(data.source.auth.password);
					$('#source_FTP').show();
				}
				else if (data.source.type == 'SOAP') $('#source_SOAP').show();
				else if (data.source.type == 'REST') $('#source_REST').show();
				else if (data.source.type == 'XML') $('#source_XML').show();	
			break;
			case "extractorWizard":
				$('#extractorName').val(data.name);
				$('#ext-source-select').val(data.source);
				$('#ext-source-select').val(data.source);
				if (data.target.type == 'file') {
					$('#ftpFileName').val(data.target.res);
					$('#extractorWizard input[value='+data.target.format+']').prop('checked',true);
				}

				var type = $DM.getSource(data.source).value.source.type;
				$('#extractorWizard .source-options').hide();
				if (type === 'FTP') {
					$('#ext-ftp-browser .files').empty();
					$('#ext-ftp-options').show();
				}
				else if (type === 'RETS') {
					$('#ext-rets-options').show();
				}
			break;
			case "transformWizard":
				$('#transformerName').val(data.name);
				$('#transformerDescription').val(data.description);
				$('#trn-source-toggle').val(data.style);
				$('#trn-source-select').val(data.extractor).removeAttr('disabled');
				$DM.extractor.sample($DM.getExtractor(data.extractor).value,function(e){
					if (!e.err) update('dataStructures',e.body);
				});
			break;
			case "loaderWizard":
				$('#loaderName').val(data.name);
				$('#ldr-source-select').val(data.transform);
				$('#ldr-target-type').val(data.target.type);
				$('#ldr-mysql-dsn').val(data.target.dsn);
				$('#ldr-target-schema').val(data.target.schema.name);

				$DM.transformer.sample($DM.getTransformer(data.transform).value,function(e){
					if (!e.err) {
						update('loaderDefinition',e.body);
						trnSample = e.body;
					} 
				});

				switch(data.target.type)
				{
					case "mysql":
						$('#loaderMySQL').show();
						$('#loaderCouchDB').hide();
						$('#loaderFTP').hide();
					break;
					case "couchdb":
						$('#loaderMySQL').hide();
						$('#loaderCouchDB').show();
						$('#loaderFTP').hide();
					break;
					case "ftp":
						$('#loaderMySQL').hide();
						$('#loaderCouchDB').hide();
						$('#loaderFTP').show();
					break;
				}
			break;
		}
	}

	this.showWizard = function(id) {
		$('#'+id).modal('show');
	}

	/**
	 * Get an extractor definition from the UI
	 * @return {[type]}
	 */
	var ext = function(){
		var stype = $DM.getSource($('#ext-source-select').val()).value.source.type;
		console.log(stype);
		return {
			name: $('#extractorName').val(),
			source: $('#ext-source-select').val(),
			target: {
				type: (stype == 'RETS') ? $('#ext-rets-resource').val() : "file",
				class: (stype == 'RETS') ? $('#ext-rets-class').val() : "",
				res: (stype == 'RETS') ? $('#ext-rets-query').val() : ($('#ftpRootPath').val() + $('#ftpFileName').val()),
				format: (stype == 'RETS') ? 'DMQL2' : $('[name=ext-text-format]:checked').val()
			}
		};
	};

	/**
	 * Get an transformer definition from the UI
	 * @return {[type]}
	 */
	var trn = function(){
		var transform = {
			name: $('#transformerName').val(),
			description: $('#transformerDescription').val(),
			style: $('#trn-source-toggle').val(),
			extractor: $('#trn-source-select').val(),
			transform: {
				input: [],
				normalize: [],
				map: $('#trn-map').val()
			}
		};

		$('#transformNormalize .item input:text:enabled').each(function(index,item){
			transform.transform.input.push($('.name', $(item).parent().parent()).text());
			transform.transform.normalize.push({
				in: $('.name', $(item).parent().parent()).text(),
				out: $(item).val()
			});
		});

		return transform;
	};

	/**
	 * Get a loader definition from the UI
	 * @return {[type]}
	 */
	var ldr = function(){
		var res = {
			name: $('#loaderName').val(),
			transform: $('#ldr-source-select').val(),
			target: {
				type: $('#ldr-target-type').val(),
				dsn: $('#ldr-mysql-dsn').val(),
				schema: {
					name: $('#ldr-target-schema').val(),
					fields: []
				}
			}
		};
		$('#loaderSchemas .fields .maps label').each(function(index,item){
			res.target.schema.fields.push({
				key: $(item).text(),
				type: $(item).parent().parent().find('select').val()
			});
		});
		console.log(res);
		return res;
	};


}(HoneyBadger.Admin, jQuery));