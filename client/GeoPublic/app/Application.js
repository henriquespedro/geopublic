// http://alvinalexander.com/sencha/how-to-sencha-extjs-splash-screen-loading

Ext.define('GeoPublic.Application', {
	name : 'GeoPublic',
	requires : ['GeoPublic.Translation', 'GeoPublic.DirectAPI', 'Ext.grid.plugin.RowEditing', 'Ext.form.Label', 'Ext.util.Cookies', 'Ext.ux.DataTip', 'GeoExt.panel.Map', 'Ext.button.Split', 'Ext.grid.column.Date', 'Ext.state.LocalStorageProvider', 'Ext.ux.Wizard', 'Ext.ux.wizard.Header', 'Ext.ux.wizard.CardLayout', 'Ext.ux.wizard.Card', 'GeoPublic.view.Participation.Discussion', 'Ext.form.field.Hidden', 'Ext.Img', 'Ext.chart.Chart', 'Ext.chart.series.Bar', 'Ext.chart.axis.Numeric', 'Ext.chart.axis.Category', 'Ext.chart.series.Pie'],
	extend : 'Ext.app.Application',
	views : ['StartPanel', 'StartPromotor', 'StartPlano', 'StartPlanoDescricao', 'StartPlanoEstatisticas', 'BemVindoPanel', 'Promotor', 'TopHeader', 'Users.GridSessao', 'Users.Profile', 'Guia', 'MapaComProjeto', 'Participation.Activity', 'Participation.Contribution', 'Participation.Ocorrencias', 'Participation.Discussion', 'Participation.CommentList', 'Participation.CommentForm', 'Participation.FotografiaTmp', 'StartPanelChartByType', 'StartPanelChartByState'],
	controllers : ['TopHeader', 'Users.Profile', 'StartPanel', 'BemVindoPanel', 'Promotor', 'Plano', 'TipoOcorrencia', 'Participation.Contribution', 'Participation.Discussion', 'Participation.EstadoOcorrencia', 'Participation.Fotografia', 'DiscussaoRegulamento', 'Participation.ActivityNew', 'Mapa', 'DiscussaoGeografica', 'StartPlano', 'StartPromotor', 'StartPlanoDescricao'],
	models : ['Utilizador', 'Sessao', 'Promotor', 'Plano', 'TipoOcorrencia', 'Participation.EstadoOcorrencia', 'Participation.ChartByState', 'Participation.ChartByType'],
	stores : ['Sessao', 'Promotor', 'Plano', 'Participation.EstadoOcorrencia', 'Participation.EstadoCombo', 'Participation.ChartByState', 'Participation.ChartByType'],
	splashscreen : {},
	refs : [{
		selector : 'viewport > tabpanel',
		ref : 'painelPrincipal' // gera um getPainelPrincipal
	}, {
		ref : 'combopromotor', // this.getCombopromotor()
		selector : 'app-main-map-panel combo#promotor'
	}, {
		ref : 'comboplano', // this.getComboplano()
		selector : 'app-main-map-panel combo#plano'
	}],
	init : function() {
		splashscreen = Ext.getBody().mask('Loading PPGIS, please stand by ...', 'splashscreen');
		var me = this;
        Ext.setGlyphFontFamily('FontAwesome');
		hello.init({
			// home facebook, menu lateral esq, no fundo; apps
			// https://developers.facebook.com/apps/1425420377699726/dashboard/
			facebook : '1425420377699726',
			// https://console.developers.google.com/project
			// https://console.developers.google.com/project/driven-crane-540
			google : '171807226739-pl2lsvoh70jeqqtkcdrqpo9j8urfdcij.apps.googleusercontent.com',
			// https://account.live.com/developers/applications/index
			// https://account.live.com/developers/applications/ApiSettings?id=0000000048117A44
			// We can get only one application per domain :-(
			// windows live authentication is disabled in the login form
			windows : '0000000048117A44'
		});
		var sessionstart = function(auth) {
			//<debug>
			console.log('Bem vindo!  Vou pedir os seus dados à rede ' + auth.network);
			//</debug>
			var api_me_error = function() {
				//<debug>
				console.log("Erro ao invocar a api \"me\" da rede " + auth.network);
				//</debug>
			};
			var api_me = function(response) {
				response["network"] = auth.network;
				//<debug>
				console.log(Ext.encode(response));
				//</debug>
				ExtRemote.DXLogin.social(response, function(result, event) {
					if (result.success) {
						// Ext.Msg.alert('Successul login', Ext.encode(result));
						GeoPublic.LoggedInUser = Ext.create('GeoPublic.model.Utilizador', result.data[0]);
						GeoPublic.LoggedInUser["login"] = auth.network;
						me.fireEvent('loginComSucesso');
					} else {
						// Ext.Msg.alert('Não foi possível iniciar a sessão com estes dados.', Ext.encode(result));
						Ext.Msg.alert('Não foi possível iniciar a sessão com estes dados.');
					}
				});
			};
			hello(auth.network).api("me").success(api_me).error(api_me_error);
		};
		var sessionend = function(auth) {
			console.log("Session has ended. Auth: " + auth.network);
			console.log(auth);
			ExtRemote.DXLogin.deauthenticate({}, function(result, event) {
				if (result.success) {
					// Ext.Msg.alert(result.message);
					me.fireEvent('logoutComSucesso');
				} else {
					// Ext.Msg.alert('Something wrong with logout', Ext.encode(result));
				}
			});
		};
		hello.on("auth.logout", sessionend);
		hello.on("auth.login", sessionstart);

		/*
		 hello.on("auth.failed", function() {
		 console.log(arguments);
		 });
		 hello.on("auth", function() {
		 console.log(arguments);
		 });
		 */

		if (document.location.href.split('/')[2].indexOf('localhost') > -1) {
			GeoPublic.geoserver = 'http://localhost:8080';
			GeoPublic.mapproxy = 'http://localhost/mapproxy/tms/';
		} else {
			GeoPublic.geoserver = 'http://cm-agueda.geomaster.pt:8080';
			GeoPublic.mapproxy = ['http://a.geomaster.pt/mapproxy/tms/', 'http://b.geomaster.pt/mapproxy/tms/', 'http://c.geomaster.pt/mapproxy/tms/', 'http://d.geomaster.pt/mapproxy/tms/'];
		}

		var socket = io.connect();
		/*
		var socket = io.connect({
			// path : '/ppgis/socket.io'
			path : '/socket.io'
		});
		*/

		// No servidor
		// var io = require('socket.io').listen(servidor, { resource: '/ppgis/socket.io'});

        // comment-created
        // comment-updated
        // comment-deleted
        socket.on('comment-created', function(data) {
            console.log('comment-created: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newComment', data);
            // Ext.example.msg('No comentário recebido', data.params.comentario);
            Ext.example.msg('Novo comentário', 'Novo comentário registado');
        });
        socket.on('comment-updated', function(data) {
            console.log('comment-updated: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newComment', data);
            // Ext.example.msg('No comentário recebido', data.params.comentario);
            Ext.example.msg('Comentário atualizado', 'Um comentário foi alterado');
        });
        socket.on('comment-deleted', function(data) {
            console.log('comment-deleted: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newComment', data);
            // Ext.example.msg('No comentário recebido', data.params.comentario);
            Ext.example.msg('Comentário eliminado', 'Um comentário foi eliminado');
        });
        // participation-created
        // participation-updated
        // participation-deleted
        socket.on('participation-created', function(data) {
            console.log('participation-created: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newParticipation', data);
            // Ext.example.msg('Nova participação recebida', data.params.participacao);
            Ext.example.msg('Nova participação', 'Nova participação registada');
        });
        socket.on('participation-updated', function(data) {
            console.log('participation-updated: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newParticipation', data);
            // Ext.example.msg('Nova participação recebida', data.params.participacao);
            Ext.example.msg('Participação atualizada', 'Uma participação foi alterada');
        });
        socket.on('participation-deleted', function(data) {
            console.log('participation-deleted: ', data);
            // Recebe novas estatísticas
            // despoleta um evento fireEvent(data.numeros) para o controlador startpanel
            me.fireEvent('newParticipation', data);
            // Ext.example.msg('Nova participação recebida', data.params.participacao);
            Ext.example.msg('Participação eliminada', 'Uma participação foi removida');
        });
	},
	launch : function() {
		var me = this;
		// Ext.tip.QuickTipManager.init();
		Ext.QuickTips.init();

		var task = new Ext.util.DelayedTask(function() {
			// fade out the body mask
			splashscreen.fadeOut({
				duration : 750,
				remove : true
			});
			// fade out the message
			splashscreen.next().fadeOut({
				duration : 500,
				remove : true
			});
		});
		task.delay(1000);

		//<debug>
		console.log('... tudo carregado e pronto a funcionar (app/Application.js).');
		//</debug>
		if (Ext.supports.LocalStorage) {
			Ext.state.Manager.setProvider(Ext.create('Ext.state.LocalStorageProvider'));
			//<debug>
			console.log('Vai usar local storage HTML 5');
			//</debug>
		} else {
			Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));
			//<debug>
			console.log('Vai usar cookies');
			//</debug>
		}

		// será que consigo fazer este alive se só existir um cookie do lado de cá que tenha sido enviado para o servidor?

		ExtRemote.DXLogin.alive({}, function(result, event) {
			//<debug>
			console.log('------------------- ALIVE --------------------');
			//</debug>
			// console.debug(result);
			// console.debug(event);
			if (result.success) {
				// We have a valid user data
				// Ext.Msg.alert('Successul login', Ext.encode(result));
				GeoPublic.LoggedInUser = Ext.create('GeoPublic.model.Utilizador', result.data[0]);
				GeoPublic.LoggedInUser["login"] = "local";

				// console.log(GeoPublic.LoggedInUser);
				me.fireEvent('loginComSucesso');
			} /* else {
			 me.fireEvent('logoutComSucesso');
			 } */

            /*
			// Esta consulta ao servidor deu tempo para a aplicação arrancar...
			// Salto já para o mapa? Posso?
			// Estou a fazer isto, mesmo sem saber se está ou não autenticado
			var cookiepromotor = Ext.util.Cookies.get('promotor');
			var cookieplano = Ext.util.Cookies.get('plano');
			console.log('Cookie promotor: ', cookiepromotor);
			console.log('Cookie plano: ', cookieplano);
			if (cookiepromotor && cookieplano) {
				console.log('Vai mudar automaticamente para o plano ' + cookieplano + ' daqui a instantes...');
				// O último plano que andou a mexer foi em ...
				// GeoPublic.OpenPlan = { promotor: parseInt(cookiepromotor), plano: parseInt(cookieplano)}
				me.getCombopromotor().setValue(parseInt(cookiepromotor));
				var taskOpenPlan = new Ext.util.DelayedTask(function () {
					me.getComboplano().setValue(parseInt(cookieplano));
				});
				taskOpenPlan.delay(1500);
				me.getPainelPrincipal().setActiveTab(1);
			} else {
				console.log('Não há cookies para ninguém');
			}
			*/
		});
	}
});

Ext.example = function() {
	var msgCt;

	function createBox(t, s) {
		// return ['<div class="msg">',
		//         '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
		//         '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
		//         '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
		//         '</div>'].join('');
		return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
	}

	return {
		msg : function(title, format) {
			if (!msgCt) {
				msgCt = Ext.DomHelper.insertFirst(document.body, {
					id : 'msg-div'
				}, true);
			}
			var s = Ext.String.format.apply(String, Array.prototype.slice.call(arguments, 1));
			var m = Ext.DomHelper.append(msgCt, createBox(title, s), true);
			m.hide();
			m.slideIn('t').ghost("t", {
				delay : 2000,
				remove : true
			});
		},

		init : function() {
			if (!msgCt) {
				// It's better to create the msg-div here in order to avoid re-layouts
				// later that could interfere with the HtmlEditor and reset its iFrame.
				msgCt = Ext.DomHelper.insertFirst(document.body, {
					id : 'msg-div'
				}, true);
			}
			//            var t = Ext.get('exttheme');
			//            if(!t){ // run locally?
			//                return;
			//            }
			//            var theme = Cookies.get('exttheme') || 'aero';
			//            if(theme){
			//                t.dom.value = theme;
			//                Ext.getBody().addClass('x-'+theme);
			//            }
			//            t.on('change', function(){
			//                Cookies.set('exttheme', t.getValue());
			//                setTimeout(function(){
			//                    window.location.reload();
			//                }, 250);
			//            });
			//
			//            var lb = Ext.get('lib-bar');
			//            if(lb){
			//                lb.show();
			//            }
		}
	};
}();

/*
 String.prototype.translate = function() {
 var s = this.valueOf();
 console.log('TRANSLATE: ' + s);
 var t = {},
 i = 0,
 n = GeoPublic.Translation.length;
 while (i < n) {
 t = GeoPublic.Translation[i];
 // console.log(t);
 if (t.id == s) {
 return t.translation;
 }
 i++;
 }
 return s;
 };
 */

