Ext.define('DemoExtJs.model.Plano', {
	extend : 'Ext.data.Model',
	fields : [{
		name : 'id',
		type : 'int'
	}, {
		name : 'idpromotor',
		type : 'int'
	}, {
		name : 'designacao',
		type : 'string'
	}, {
		name : 'descricao',
		type : 'string'
	}, {
		name : 'responsavel',
		type : 'string'
	}, {
		name : 'email',
		type : 'string'
	}, {
		name : 'site',
		type : 'string'
	}, {
		name : 'inicio',
		type : 'date'
	}, {
		name : 'fim',
		type : 'date'
	}, {
		name : 'wkt',
		type : 'string'
	}, {
		name : 'geojson',
		type : 'string'
	}],
	// belongsTo : 'DemoExtJs.model.Promotor',
	// http://localhost/extjs/docs/index.html#!/api/Ext.data.proxy.Direct
	proxy : {
		// Extra parameters that will be included on every read request.
		// Individual requests with params of the same name will override these params when they are in conflict.
		// extraParams : {
		// 	tabela : 'plano'
		// },
		type : 'direct',
		paramOrder : 'id', // Tells the proxy to pass the id as the first parameter to the remoting method.
		api : {
			create : 'ExtRemote.DXParticipacao.createPlano',
			read : 'ExtRemote.DXParticipacao.readPlano',
			update : 'ExtRemote.DXParticipacao.updatePlano',
			destroy : 'ExtRemote.DXParticipacao.destroyPlano'
		},
		reader : {
			type : 'json',
			root : 'data',
			messageProperty : 'message' // mandatory if you want the framework to set it's content
		}
		// NÃO TESTADO; acrescentei par ver se dava para ir só as partes modificadas do RowEditor
		/*
		 writer : {
		 writeAllFields : false
		 }
		 */
	}
});