Ext.define('GeoPublic.view.DiscussaoRegulamento', {
    extend: 'Ext.container.Container',
    requires: ['GeoPublic.view.Participation.ActivityNew', 'GeoPublic.store.Ocorrencia', 'GeoPublic.store.Participation.EstadoCombo'],
    alias: 'widget.discussao-regulamento',
    layout: 'border',
    glyph: 0xf0f6,
    closable: true,
    // title: 'Regime Jurídico da Urbanização e Edificação',
    // style : 'padding:5px',
    initComponent: function () {
        var me = this;
        //<debug>
        console.log(this.initialConfig);
        //</debug>

        me.itemId = 'discussao-regulamento-' + me.idplano;
        var storeId = me.itemId + '-ocorrencia-store';
        //<debug>
        console.log('Ler as discussões de ', storeId, me.itemId);
        //</debug>
        me.store = Ext.StoreManager.lookup(storeId); // Ext.StoreManager.lookup(storeId);
        if (!Ext.isDefined(me.store)) {
            me.store = Ext.create('GeoPublic.store.Ocorrencia', Ext.apply({storeId: me.storeId, autoDestroy: true}));
        }
        var storeEstadoId = me.itemId + '-estadoocorrencia-store';
        //<debug>
        console.log('Ler os estados possíveis de ', storeEstadoId, me.itemId);
        //</debug>
        me.storeEstado = Ext.StoreManager.lookup(storeEstadoId); // Ext.StoreManager.lookup(storeId);
        if (!Ext.isDefined(me.storeEstado)) {
            me.storeEstado = Ext.create('GeoPublic.store.Participation.EstadoCombo', Ext.apply({
                storeId: storeEstadoId,
                autoDestroy: false
            }));
            // ao destruir uma discussão com este store na combo, o store era destruído
            // tem mesmo que ser autoDestroy: false
        }

        this.mergelycriado = false;
        this.iddivcompare = 'compare-' + this.initialConfig.idplano;

        this.items = [{
            xtype: 'panel',
            region: 'center',
            layout: 'border',
            items: [{
                region: 'north',
                layout: {
                    type: 'hbox',
                    // padding: '5',
                    align: 'middle'
                },
                height: 60,
                items: [{
                    xtype: 'panel',
                    itemId: 'informacao-rhs',
                    margin: '10 10 10 10',
                    html: 'Texto original, proposto para discussão.',
                    // bodyStyle: 'background-color: #E6E6E6', // cinza claro
                    flex: 1
                }, {
                    xtype: 'panel',
                    itemId: 'informacao-lhs',
                    margin: '10 10 10 16',
                    html: '', // update()...
                    // bodyStyle: 'background-color: #A6A6A6', // cinza claro
                    flex: 1
                }]
            }, {
                region: 'center',
                collapsible: false,
                layout: 'border',
                // this panel will be used by mergely.
                // it only fits, if this panle is the only component of a border layout
                items: [{
                    xtype: 'component',
                    itemId: 'secretaria',
                    region: 'center',
                    // style: {background: 'red'},
                    id: this.iddivcompare,
                    config: {
                        idplano: this.initialConfig.idplano,
                        idpromotor: this.initialConfig.idpromotor,
                        title: this.initialConfig.designacao,
                        designacao: this.initialConfig.designacao,
                        descricao: this.initialConfig.descricao,
                        proposta: this.initialConfig.proposta,
                        alternativeproposta: this.initialConfig.alternativeproposta
                    }
                }]
            }]
        }, {
            xtype: 'activitynew',
            region: 'east',
            // collapsible : false,
            split: true,
            width: 420,
            config: {
                idplano: this.initialConfig.idplano,
                idpromotor: this.initialConfig.idpromotor,
                geodiscussao: false
            }
        }];
        this.callParent(arguments);
    },
    getStoreOcorrencias: function () {
        return this.store;
    },
    getStoreEstado: function () {
        return this.storeEstado;
    }
});
