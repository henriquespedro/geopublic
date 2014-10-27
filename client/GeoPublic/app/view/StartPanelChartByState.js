Ext.define('GeoPublic.view.StartPanelChartByState', {
	extend : 'Ext.chart.Chart',
	alias : 'widget.startpanelchartbystate',
	animate : true,
	// store : store1,
	shadow : true,
	/*
	 legend : {
	 position : 'right'
	 },
	 */
	insetPadding : 60,
	theme : 'Base:gradients',
	store: 'Participation.ChartByState',
	initComponent : function() {
		/*
		 * SELECT e.id, e.estado, COUNT(o.idestado)
		 FROM ppgis.estado e
		 LEFT JOIN ppgis.ocorrencia o ON (e.id = o.idestado AND e.idplano = o.idplano)
		 WHERE e.idplano = 2
		 GROUP BY e.id, e.estado;
		 */

		// global!
		/*
		this.store = Ext.create('Ext.data.JsonStore', {
			fields : ['state', 'count']
		});
		var data = [{state: 'Aberta', count: 20}, {state: 'Fechada', count: 10} ];
		this.store.loadData(data); //generateData(4, 20));
	
		console.log('this.store');
		console.log(this.store);
		*/
		
		this.series = [{
			type : 'pie',
			field : 'count',
			showInLegend : true,
			donut : 35,
			/*
			tips : {
				trackMouse : true,
				width : 140,
				height : 28,
				renderer : function(storeItem, item) {
					//calculate percentage.
					var total = 0;
					this.store.each(function(rec) {
						total += rec.get('count');
					});
					this.setTitle(storeItem.get('state') + ': ' + Math.round(storeItem.get('count') / total * 100) + '%');
				}
			},
			*/
			highlight : {
				segment : {
					margin : 20
				}
			},
			label : {
				field : 'state',
				display : 'rotate',
				contrast : true,
				font : '12px Arial'
			}
		}];
		this.items = [{
			type : 'text',
			text : 'Estado das participações',
			font : '14px Arial',
			width : 280,
			height : 30,
			x : 50, //the sprite x position
			y : 10 //the sprite y position
		}];
		this.callParent(arguments);
	}
});