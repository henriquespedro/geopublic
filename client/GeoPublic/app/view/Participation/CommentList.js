Ext.define('GeoPublic.view.Participation.CommentList', {
    extend: 'Ext.panel.Panel',
    requires: ['GeoPublic.view.Participation.CommentForm'],
    alias: 'widget.commentlist',
    frame: false,
    ui: 'light', // neptune theme
    collapsible: true,
    collapsed: true,
    // titleCollapse : true,
    header: false,
    hideCollapseTool: true,
    bodyStyle: 'background-color: #EEEEEE', // cinza claro
    initComponent: function () {
        this.loaded = false;
        this.numcomments = this.initialConfig.config.numcomments;
        this.idocorrencia = this.initialConfig.config.idocorrencia;
        this.idplano = this.initialConfig.config.idplano;
        this.idpromotor = this.initialConfig.config.idpromotor;
        // this.title = this.numcomments + ' ' + 'comentários'.translate();

        // http://localhost/extjs/docs/index.html#!/api/Ext.XTemplate
        // http://wenda.baba.io/questions/404061/extjs-component-inside-ext-xtemplate-on-extjs-4.html

        /*
         var commenttpl = new Ext.XTemplate(//
         '<tpl for=".">', //
         '<p><img src="{fotografia}" align="left" height="32" width="32">', //
         '<b>{nome}</b> {comentario}<br/><i>{tempo}</i></p>', //
         '<p>Estado: <span style="color:{color}">{estado}</span></p>', //
         '<p><div class="comment-buttons"></div></p>',
         '</tpl>' //
         );

         this.tpl = commenttpl;
         this.data = [];
         */

        this.items = [{
            html: '&nbsp;',
            height: 1
        }];

        this.items.push({
            xtype: 'commentform',
            hidden: !this.initialConfig.config.showFormComments,
            config: {
                idocorrencia: this.idocorrencia,
                idestado: this.initialConfig.config.idestado,
                estado: this.initialConfig.config.estado,
                color: this.initialConfig.config.color,
                estadoStore: this.initialConfig.config.estadoStore
            }
        });

        this.callParent(arguments);
    },
    getNumComments: function () {
        return this.numcomments;
    },
    setNumComments: function (x) {
        this.numcomments = x;
        return this.numcomments;
    }
});

/*
 * Há 38 minutos
 * Há 3 hrs
 * Ontem, às 20:16:56
 * 11 de setembro, às 20:16:56
 * var d = new Date('2014-09-23T20:16:56.223Z')
 * Ext.util.Format.date('2014-09-23T20:16:56.223Z', "d M H:i")
 * Ext.util.Format.date('2014-09-23T20:16:56.223Z', "d M H:i")
 * "23 Set 21:16"

 // prepareData: function(data) {} só para dataviews!
 data : [{
 "data" : [{
 "id" : 38,
 "comentario" : "Sempre tive uma atrção especial pelo Jardim da Enferma. Faço o que estiver ao meu alcance para o recuperar.\nAquele abraço!",
 "datacriacao" : "2014-09-23T20:16:56.223Z",
 "haquantotempo" : {
 "days" : 1,
 "hours" : 1,
 "minutes" : 56,
 "seconds" : 33
 },
 "fotografia" : "uploaded_images/profiles/32x32/31_ee201c208a968b4ac27ea7f662e34db2.jpg",
 "nome" : "Gustavo Bastos"
 }, {
 "id" : 39,
 "comentario" : "Pode-se corrigir um comentário anterior? É que escrivi mal e queria corrigir. Obrigado pela atenção.",
 "datacriacao" : "2014-09-23T20:26:11.699Z",
 "haquantotempo" : {		this.loaded = false;

 "days" : 1,
 "hours" : 1,
 "minutes" : 47,
 "seconds" : 18
 },
 "fotografia" : "uploaded_images/profiles/32x32/31_ee201c208a968b4ac27ea7f662e34db2.jpg",
 "nome" : "Gustavo Bastos"
 }, {
 "id" : 40,
 "comentario" : "Continuo a dar grolhas sem querer e ninguém me ajuda? Preciso de saber se há maneira de alterar os comentário. Obrigado!",
 "datacriacao" : "2014-09-23T20:42:30.149Z",
 "haquantotempo" : {
 "days" : 1,
 "hours" : 1,
 "minutes" : 30,
 "seconds" : 59
 },
 "fotografia" : "uploaded_images/profiles/32x32/31_ee201c208a968b4ac27ea7f662e34db2.jpg",
 "nome" : "Gustavo Bastos"
 }]
 }],
 */