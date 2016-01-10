Ext.define('GeoPublic.store.Participation.DocumentCombo', {
	extend : 'Ext.data.Store',
	requires : ['GeoPublic.model.Participation.Fotografia'],
	autoLoad : false, // só pode ler este store depois de ter um promotor selecionado
	remoteSort : false, //enable remote filter
	remoteFilter : false, //enable remote sorting
	// pageSize: 5,
	autoSync: false, // if operating on model directly this will make double POSTs!
	model : 'GeoPublic.model.Participation.Fotografia'
}); 