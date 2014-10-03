Ext.define('DemoExtJs.controller.Promotor', {
	extend : 'Ext.app.Controller',
	stores : ['Promotor', 'Plano'], // getPromotorStore(), getPlanoStore()
	// models : ['Plano'],
	// Ext.ComponentQuery.query('topheader button#botaoLogin')
	refs : [{
		selector : 'grid-promotor gridpanel#promotor',
		ref : 'grid' // gera um getGrid
	}, {
		selector : 'grid-promotor gridpanel#plano',
		ref : 'gridPlano' // gera um getGridPlano
	}, {
		selector : 'grid-promotor gridpanel#promotor button#remove',
		ref : 'buttonRemove' // gera um getButtonRemove
	}, {
		ref : 'editor',
		selector : 'grid-promotor #planoForm'
	}],
	init : function() {
		console.log('O controlador está a arrancar...');
		this.control({
			"grid-promotor gridpanel#promotor button#add" : {
				click : this.onButtonClickAdiciona
			},
			"grid-promotor gridpanel#promotor button#remove" : {
				click : this.onButtonClickRemove
			},

			"grid-promotor form#planoForm button#updateDescricaoPlano" : {
				click : this.onUpdateDescricaoPlano
			},
			// observar a grid
			'grid-promotor gridpanel#promotor' : {
				selectionchange : this.onGridSelect
			},
			"grid-promotor gridpanel#plano" : {
				itemclick : this.onPlanoGridItemClick
			}
		});
		this.application.on({
		});
		// write( store, operation, eOpts )
		this.getPromotorStore().addListener("write", function(store, operation, eOpts) {
			// console.log(operation);
			// se foi um insert, preciso de por o ID no registo...
			switch (operation.action) {
				case "create":
					console.log('Gravou um novo promotor que ficou com o id: ' + operation.resultSet.records[0].data.id);
					var record = this.getPromotorStore().getAt(0);
					record.set("id", operation.resultSet.records[0].data.id);
					// quero mostrar a coluna alterada, com o novo ID...
					var rowEditing = this.getGrid().plugins[0];
					rowEditing.startEdit(0, 0);
					break;
				case "update":
					console.log('Gravou o promotor com o id: ' + operation.resultSet.records[0].data.id);
					break;
				case "destroy":
					break;
				default:
					break;
			}
		}, this);
		// http://localhost/extjs/docs/index.html#!/api/Ext.data.proxy.Server-event-exception
		this.getPromotorStore().proxy.addListener("exception", function(proxy, response, operation, eOpts) {
			console.log(response.result.message);
			Ext.Msg.show({
				title : 'Erro',
				msg : response.result.message,
				icon : Ext.Msg.ERROR,
				buttons : Ext.Msg.OK
			});
			this.getPromotorStore().rejectChanges();
		}, this);
		this.getPromotorStore().proxy.addListener("load", this.onPromotorStoreLoad, this);
	},
	onPlanoGridItemClick : function(dataview, record, item, index, e, eOpts) {
		console.log('onPlanoGridItemClick');
		var form = this.getEditor();
		form.getForm().loadRecord(record);
		form.enable();
	},
	onGridSelect : function(selModel, selection) {
		this.getButtonRemove().setDisabled(!selection.length);
		if (selection.length == 1) {
			console.log('Ler os planos do promotor ', selection[0].data.id);
			// var store = Ext.StoreManager.lookup('Plano');
			var store = this.getPlanoStore();
			// var model = this.getPlanoModel();
			// model.load(selection[0].data.id);
			store.load({
				id : selection[0].data.id
			});
		}
	},
	missingSelection : function() {
		return this.getGridPlano().getSelectionModel().getSelection().length === 0;
	},
	onUpdateDescricaoPlano : function(button, e, options) {
		console.log('onUpdateDescricaoPlano');
		if (this.missingSelection()) {
			return false;
		}
		var form = this.getEditor();
		// var params = form.getForm().getValues(false, true, false, false);
		// console.log(params);
		var record = form.getRecord();
		// console.log(record);
		form.updateRecord(record);
	},
	onButtonClickAdiciona : function(button, e, options) {
		console.log('onButtonClickAdiciona');
		var rowEditing = this.getGrid().plugins[0];
		// console.log(rowEditing);
		rowEditing.cancelEdit();
		// Create a model instance
		var r = Ext.create('DemoExtJs.model.Promotor', {
			designacao : 'Nova entidade',
			email : 'info@entidade.pt',
			site : 'http://www.entidade.pt',
			// É preenchida, mas só par ao utilizador ver. Não será editável.
			dataregisto : new Date()
		});
		this.getPromotorStore().insert(0, r);
		// passei o startEdit para depois do evento 'write', depois de termos o id deste registo
		// rowEditing.startEdit(0, 0);
	},
	onButtonClickRemove : function(button, e, options) {
		console.log('onButtonClickRemove');
		var rowEditing = this.getGrid().plugins[0];
		var sm = this.getGrid().getSelectionModel();
		var store = this.getPromotorStore();
		rowEditing.cancelEdit();
		store.remove(sm.getSelection());
		if (store.getCount() > 0) {
			sm.select(0);
		}
	},
	onPromotorStoreLoad : function(proxy, records, successful, eOpts) {
		if (!successful) {
			Ext.MessageBox.show({
				title : 'Data Load Error',
				msg : 'The data encountered a load error, please try again in a few minutes.'
			});
		} else {
			console.log(records.length + ' registos foram devolvidos');
		}
	},
	onLaunch : function() {
		var me = this;
		console.log('...O controlador DemoExtJs.controller.Promotor arrancou.');
	}
});
