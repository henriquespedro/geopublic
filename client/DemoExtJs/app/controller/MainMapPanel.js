/*
 * http://kb.imakewebsites.ca/2014/01/04/new-node-wishlist/
 */
Ext.define('DemoExtJs.controller.MainMapPanel', {
	extend : 'Ext.app.Controller',
	requires : ['GeoExt.Action'],

	wfs_pretensao : {},
	saveStrategy : {},
	zoomLevelEdit : 12,
	refs : [

	// ver exemplo:
	// http://geoext.github.io/geoext2/examples/action/mappanel_with_actions.html

	// Ext.ComponentQuery.query('app-main-map-panel toolbar')
	{
		ref : 'barra',
		selector : 'app-main-map-panel toolbar'
	}, {
		ref : 'mapa',
		selector : 'app-main-map-panel'
	}, {
		ref : 'inserir',
		selector : 'app-main-map-panel toolbar button#insertPolygon'
	}, {
		ref : 'geocoder',
		selector : 'app-main-map-panel toolbar gx_geocodercombo#geocoder'
	}, {
		ref : 'geocoderprocesso',
		selector : 'app-main-map-panel toolbar gx_geocodercombo#geocoderprocesso'
	}],
	init : function() {
		// <debug>
		console.log('O controlador Ppgis.controller.MainMapPanel init...');
		// </debug>
		this.listen({
            controller: {
                '*': {
                    uploadSuccessful: this.onUploadSuccessful,
                    logoutComSucesso: this.onLogoutComSucesso,
                    loginComSucesso: this.onLoginComSucesso
                }
            }
        });	
		this.control({
			'app-main-map-panel' : {
				'beforerender' : this.onMapPanelBeforeRender,
				'afterrender' : this.onMapPanelAfterRender,
				'beforeactivate' : this.onMapPanelBeforeActivate
			}, /*
			 "app-main-map-panel button#highlightCtrl" : {
			 click : this.onButtonClickHighlightCtrl
			 }, */
			"app-main-map-panel gx_geocodercombo#geocoder" : {
				select : this.onSelectGeocoder
			},
			"app-main-map-panel button#insertPolygon" : {
				click : this.onButtonClickInsertPolygon
			},
			"app-main-map-panel button#carregarprocesso" : {
				click : this.onButtonClickCarregarProcesso
			},
			"app-main-map-panel button#uploadShapefile" : {
				click : this.onButtonClickUploadShapefile
			},
			"app-main-map-panel button#refresh" : {
				click : this.onButtonClickRefresh
			}
		}, this);
	},
	onLoginComSucesso : function() {
		console.log('onLoginComSucesso', this, console.log(arguments));
		if (this.getMapa().up('tabpanel').getActiveTab().title == "Mapa") {
			var mapa = this.getMapa().map;
			this.getBarra().enable();
			var zLevel = mapa.getZoom();
			if (DemoExtJs.LoggedInUser && zLevel >= this.zoomLevelEdit) {
				this.getInserir().enable();
			} else {
				this.getInserir().disable();
			}
			this.wfs_pretensao.filter = new OpenLayers.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.EQUAL_TO,
				property : "idutilizador",
				value : DemoExtJs.LoggedInUser.data.id
			});
			this.wfs_pretensao.refresh({
				force : true
			});
		} else {
			console.log('Não faço nada onLoginComSucesso no DemoExtJs.controller.MainMapPanel');
		}
	},
	onLogoutComSucesso : function() {
		console.log('onLogoutComSucesso', this, console.log(arguments));
		if (this.getMapa().up('tabpanel').getActiveTab().title == "Mapa") {
			this.getInserir().disable();
			this.getBarra().disable();
			this.wfs_pretensao.filter = new OpenLayers.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.EQUAL_TO,
				property : "idutilizador",
				value : -1
			});
			this.wfs_pretensao.refresh({
				force : true
			});
		} else {
			console.log('Não faço nada onLogoutComSucesso no DemoExtJs.controller.MainMapPanel');
		}
	},
	onUploadSuccessful : function(url) {
		var mapa = this.getMapa().map;
		// <debug>
		console.log(url);
		// </debug>
		// window.location.href = url;
		var vector = mapa.getLayersByName('Pretensões')[0];
		// <debug>
		console.log(vector);
		// </debug>

		var parser = new OpenLayers.Format.GeoJSON();

		var shapefile = new Shapefile({
			shp : url
		}, function(data) {
			console.log(data);
			var features = parser.read(data.geojson);
			var primeiro = features[0];
			primeiro.state = OpenLayers.State.INSERT;
			primeiro.attributes["designacao"] = 'Importado de shp';
			// <debug>
			console.log(primeiro);
			// </debug>

			vector.addFeatures([primeiro]);
			mapa.zoomToExtent(primeiro.geometry.getBounds(), closest = true);
			// console.log("took", new Date - starttime, "milliseconds");
		});

	},
	onButtonClickRefresh : function(button, e, options) {
		// <debug>
		console.log('onButtonClickRefresh');
		// </debug>
		this.wfs_pretensao.filter = new OpenLayers.Filter.Comparison({
			type : OpenLayers.Filter.Comparison.EQUAL_TO,
			property : "idutilizador",
			value : DemoExtJs.LoggedInUser.data.id
		});
		this.wfs_pretensao.refresh({
			force : true
		});
	},
	onSelectGeocoder : function(combo, records) {
		// <debug>
		console.log('onSelectGeocoder');
		console.debug(records[0].data);
		// </debug>
	},
	onButtonClickCarregarProcesso : function(button, e, options) {
		var me = this;
		Ext.Msg.prompt('Processo', 'Indique o processo/ano (p.e 451/09)', function(btn, text) {
			if (btn == 'ok') {
				//<debug>
				console.log('Vou procurar o processo ' + text);
				//</debug>
				ExtRemote.DXConfrontacao.processo({
					processo : text,
					limit : 1,
					start : 0
				}, function(result, event) {
					if (result.success) {
						var msg = '';
						var titulo = 'Pesquisa do processo';
						if (result.total == 0) {
							msg = 'Nenhum processo "' + text + '" encontrado.';
							Ext.Msg.alert(titulo, msg);
						} else {
							if (result.total > 1) {
								msg = 'Polígono do processo "' + text + '" recuperado com sucesso.<br>Apenas o maior polígono dos ' + result.total + ' encontrados foi importado.';
							} else {
								msg = 'Polígono do processo "' + text + '" recuperado com sucesso.';
							}
							Ext.Msg.alert(titulo, msg);
							var mapa = me.getMapa().map;
							var geojson_format = new OpenLayers.Format.GeoJSON();
							// var processo_layer = new OpenLayers.Layer.Vector();
							var processo_layer = mapa.getLayersByName('Processos')[0];
							processo_layer.addFeatures(geojson_format.read(result.data));
						}
					} else {
						Ext.Msg.alert(titulo, 'Erro ao procurar o processo "' + text + '".', Ext.encode(result));
					}
				});
			}
		});
	},
	onButtonClickUploadShapefile : function(button, e, options) {
		var view = Ext.widget('uploadshapefile', {
			// title : 'Área total: ' +
			// Ext.util.Format.number(event.feature.data.area, '0.00') + ' m2',
			// bounds : event.feature.geometry.getBounds(),
			// pretensao : parseInt(event.feature.data.id),
			// feature : event.feature
		});
		view.show();
	},
	onButtonClickInsertPolygon : function(button, e, options) {
		// console.log('onButtonClickInsertPolygon');
		// console.debug(button);
		if (button.pressed) {
			button.up('app-main-map-panel').highlightCtrl.deactivate();
			button.up('app-main-map-panel').selectCtrl.deactivate();
			button.up('app-main-map-panel').insertPoint.deactivate();
			button.up('app-main-map-panel').insertPolygon.activate();
		} else {
			button.up('app-main-map-panel').insertPolygon.cancel();

			button.up('app-main-map-panel').highlightCtrl.activate();
			button.up('app-main-map-panel').selectCtrl.activate();
			button.up('app-main-map-panel').insertPoint.deactivate();
			button.up('app-main-map-panel').insertPolygon.deactivate();
		}
	},
	saveSuccess : function(event) {
		// só agora tenho o fid atribuído... fixe, que é para ser atribuído à
		// imagem.
		// console.log('Your mapped field(s) have been successfully saved, em
		// particular ' + ultimoFeatureInserido.fid);
		// console.log('Atualizar o store JSON com as contribuições...');
		// storeContribuicoesJson.load();
		// console.debug(event.response);
		// console.debug(this); // OpenLayers.Strategy.Save //se
		// me.saveStrategy.events.register('success', null, this.saveSuccess);
		// console.debug(this);
		// DemoExtJs.controller.MainMapPanel //se
		// me.saveStrategy.events.register('success', this, this.saveSuccess);
		this.wfs_pretensao.refresh({
			force : true
		});
		// pode ter acontecido um insert ou um remove :-)
		if (this.getInserir().pressed) {
			this.getInserir().toggle(false);
			// -- a ordem é importante...
			this.getMapa().highlightCtrl.activate();
			this.getMapa().selectCtrl.activate();
			this.getMapa().insertPoint.deactivate();
			this.getMapa().insertPolygon.deactivate();
		}
	},
	saveFail : function(event) {
		// <debug>
		console.log('Error! Your changes could not be saved. ');
		console.debug(event.response);
		// </debug>
		// alert('Error! Your changes could not be saved. ');
		Ext.Msg.alert('Erro', 'Não foi possível fazer a confrontação do polígono com os instrumentos de gestão do território.<br>O erro ficou registado e será analisado.');
	},
	onMapPanelBeforeRender : function(mapPanel, options) {
		// this = instância "DemoExtJs.controller.MainMapPanel"
		var me = this;
		var map = mapPanel.map;

		var userid = -1;
		if (DemoExtJs.LoggedInUser) {
			userid = DemoExtJs.LoggedInUser.data.id;
		}
			
		var layers = [];
		// OpenLayers object creating

		// var layerQuest = new OpenLayers.Layer.TMS('TMS mapquest',
		// servidor_de_mapas + '/mapproxy/tms/', {
		var layerQuest = new OpenLayers.Layer.TMS('OpenStreetMap', DemoExtJs.mapproxy, {
			layername : 'mapquest/pt_tm_06',
			type : 'png',
			tileSize : new OpenLayers.Size(256, 256)
		}, {
			isBaseLayer : true
		});
		layers.push(layerQuest);

		var layerOrtos = new OpenLayers.Layer.TMS('Ortofotos da DGT', DemoExtJs.mapproxy, {
			layername : 'ortos/pt_tm_06',
			type : 'png',
			tileSize : new OpenLayers.Size(256, 256)
			// resolutions: [8.79651750792, 4.39825875396, 2.19912937698,
			// 1.09956468849, 0.549782344245, 0.274891172122, 0.137445586061,
			// 0.0687227930306]
		}, {
			isBaseLayer : true
		});
		layers.push(layerOrtos);

		var layerCarto10k = new OpenLayers.Layer.TMS('Cartografia 1:10.000', DemoExtJs.mapproxy, {
			layername : 'carto10k/pt_tm_06',
			type : 'png',
			tileSize : new OpenLayers.Size(256, 256)
			// resolutions: [8.79651750792, 4.39825875396, 2.19912937698,
			// 1.09956468849, 0.549782344245, 0.274891172122, 0.137445586061,
			// 0.0687227930306]
		}, {
			isBaseLayer : true
		});
		layers.push(layerCarto10k);

		// ok http://localhost:8011/tms/1.0.0/ortos/pt_tm_06/11/326/1254.png
		// ok
		// http://development.localhost.lan/mapproxy/tms/1.0.0/ortos/pt_tm_06/11/326/1254.png
		// not ok
		// http://development.localhost.lan/mapproxy/tms/1.0.0/ortos/pt_tm_06/2/162/713.png

		// resolutions : [2251.90848203, 1125.95424101, 562.977120507,
		// 281.488560253, 140.744280127, 70.3721400634, 35.1860700317,
		// 17.5930350158, 8.79651750792, 4.39825875396, 2.19912937698,
		// 1.09956468849, 0.549782344245, 0.274891172122, 0.137445586061,
		// 0.0687227930306], // , 0.0343613965153, 0.0171806982577,
		// 0.00859034912883, 0.00429517456441],
		// os ortos só dá para resoluções [8.79651750792, 4.39825875396,
		// 2.19912937698, 1.09956468849, 0.549782344245, 0.274891172122,
		// 0.137445586061, 0.0687227930306],

		map.addLayers(layers);
		map.setCenter(new OpenLayers.LonLat(-26557, 100814), 10);
		// deve ser 5; em debug pode ser 10

		//<debug>
		// variáveis globais para debug
		mapDebug = map;
		mapPanelDebug = mapPanel;
		//</debug>

		me.saveStrategy = new OpenLayers.Strategy.Save({
			auto : 'true'
		});
		// me.saveStrategy = new OpenLayers.Strategy.Save();
		me.saveStrategy.events.register('success', this, this.saveSuccess);
		me.saveStrategy.events.register('fail', this, this.saveFail);
		me.wfs_pretensao = new OpenLayers.Layer.Vector('Pretensões', {
			strategies : [new OpenLayers.Strategy.BBOX(), me.saveStrategy],
			protocol : new OpenLayers.Protocol.WFS({
				url : DemoExtJs.geoserver + '/geoserver/wfs', //
				featureType : 'pretensao',
				featureNS : 'http://geomaster.pt',
				srsName : 'EPSG:3763',
				version : '1.1.0',
				reportError : true,
				featurePrefix : 'geomaster',
				schema : DemoExtJs.geoserver + '/geoserver/wfs/DescribeFeatureType?version=1.1.0&typename=geomaster:pretensao',
				geometryName : 'the_geom'
			}),
			visibility : true,
			displayInLayerSwitcher : false,
			projection : new OpenLayers.Projection("EPSG:3763"),
			filter : new OpenLayers.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.EQUAL_TO,
				property : "idutilizador",
				value : userid
			})
		});
		map.addLayer(me.wfs_pretensao);

		var locationLayer = new OpenLayers.Layer.Vector("Location", {
			displayInLayerSwitcher : false,
			projection : new OpenLayers.Projection("EPSG:4326"),
			styleMap : new OpenLayers.Style({
				externalGraphic : "resources/images/marker.png",
				graphicYOffset : -25,
				graphicHeight : 25,
				graphicTitle : "${name}"
			})
		});

		map.addLayer(locationLayer);
		//
		me.getGeocoder().layer = locationLayer;
		// me.getGeocoderprocesso().layer = locationLayer;

		// http://www.peterrobins.co.uk/it/olvectors.html
		var processo_layer = new OpenLayers.Layer.Vector("Processos", {
			displayInLayerSwitcher : false,
			style : {
				fillColor : '#FF0000',
				fillOpacity : 0.5,
				strokeColor : '#FF0000',
				strokeWidth : 2.5
			},
			eventListeners : {
				"featuresadded" : function(event) {
					// 'this' is layer
					console.log('featuresadded processo_layer');
					this.map.zoomToExtent(this.getDataExtent(), closest = true);
					var pretensoes = map.getLayersByName('Pretensões')[0];
					var geometria = this.features[0].geometry.clone();
					var dados = {
						designacao : this.features[0].attributes["designacao"]
					};
					var feature = new OpenLayers.Feature.Vector(geometria, dados, {});
					feature.state = OpenLayers.State.INSERT;
					//<debug>
					console.log('geometria.CLASS_NAME', geometria.CLASS_NAME);
					console.log('feature.CLASS_NAME', feature.CLASS_NAME);
					//</debug>
					pretensoes.addFeatures([feature]);
				}
			}
		});
		map.addLayer(processo_layer);
	},
	onMapPanelAfterRender : function(mapPanel, options) {
		// this = instância "DemoExtJs.controller.MainMapPanel"
		var me = this;
		var map = mapPanel.map;

		mapPanel.selectCtrl = new OpenLayers.Control.SelectFeature(me.wfs_pretensao, {
			clickout : true,
			eventListeners : {
				beforefeaturehighlighted : function(event) {
					console.debug(event.feature);
					// este feature pode vir a ser removido...

					// console.debug(event.feature.geometry.getBounds().toBBOX());
					console.debug('Confrontações da pretensão ' + event.feature.data.id);
					// me.getConfrontacaoStore().proxy.setExtraParam("idpretensao",
					// event.feature.data.id);
					// .proxy não existe no store geoext
					// me.getConfrontacaoStore().filter("id",
					// parseInt(event.feature.data.id));
					// me.getConfrontacaoStore().load();
					// widget.windowconfrontacao
					var view = Ext.widget('windowconfrontacao', {
						// title : 'Área total: ' +
						// parseFloat(event.feature.data.area).toFixed(2) + '
						// m2',
						title : 'Área total: ' + Ext.util.Format.number(event.feature.data.area, '0.00') + ' m2',
						bounds : event.feature.geometry.getBounds(),
						pretensao : parseInt(event.feature.data.id),
						feature : event.feature
					});
					// view.bounds = event.feature.geometry.getBounds();
					// console.debug(view);
					view.show();
				},
				featurehighlighted : function(event) {
					this.unselectAll();
				}
			}
		});

		mapPanel.highlightCtrl = new OpenLayers.Control.SelectFeature(me.wfs_pretensao, {
			hover : true,
			highlightOnly : true,
			renderIntent : "temporary"
		});

		mapPanel.insertPoint = new OpenLayers.Control.DrawFeature(me.wfs_pretensao, OpenLayers.Handler.Point, {
			'displayClass' : 'olControlDrawFeaturePoint'
		});
		mapPanel.insertPolygon = new OpenLayers.Control.DrawFeature(me.wfs_pretensao, OpenLayers.Handler.Polygon, {
			'displayClass' : 'olControlDrawFeaturePolygon'
		});

		var toolbar = new OpenLayers.Control.Panel({
			displayClass : 'customEditingToolbar'
		});
		toolbar.addControls([mapPanel.selectCtrl, mapPanel.highlightCtrl, mapPanel.insertPoint, mapPanel.insertPolygon]);
		map.addControl(toolbar);
		me.wfs_pretensao.events.on({
			beforefeatureadded : function(event) {
				console.log('beforefeatureadded WFS');
				// console.log(arguments);
				// console.debug(event.feature);
				// só devia preencher estes campos para os novos features...
				if (!event.feature.attributes["designacao"]) {
					event.feature.attributes["designacao"] = 'Desenhado na web';
				}
				event.feature.attributes["idutilizador"] = DemoExtJs.LoggedInUser.data.id;
			}
		});
		mapPanel.insertPolygon.events.on({
			featureadded : function(event) {
				console.log('featureadded');
			}
		});
		// -- a ordem destes dois é importante
		mapPanel.highlightCtrl.activate();
		mapPanel.selectCtrl.activate();

		map.events.register('zoomend', this, function(event) {
			var zLevel = map.getZoom();
			console.log('Zoom level: ', zLevel);
			if (DemoExtJs.LoggedInUser && zLevel >= this.zoomLevelEdit) {
				this.getInserir().enable();
			} else {
				this.getInserir().disable();
			}
		});

	},
	onMapPanelBeforeActivate : function(mapPanel, options) {
		console.log('onMapPanelBeforeActivate');
		var map = mapPanel.map;
		if (DemoExtJs.LoggedInUser) {
			this.getBarra().enable();
		} else {
			this.getBarra().disable();
		}
	}
});
