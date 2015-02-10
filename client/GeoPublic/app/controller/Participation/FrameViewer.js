Ext.define('GeoPublic.controller.Participation.FrameViewer', {
    extend: 'Ext.app.Controller',
    requires: ['GeoPublic.view.Participation.FrameViewer'],
    init: function () {
        var me = this;
        this.control({
            "discussion fotografia dataview" : {
                itemclick : this.onFotografiaItemClick
            },
            'frameviewer': {
                resize: this.onResizeJanela
            },
            'frameviewer button': {
                click: this.buttonActions
            }
        }, this);
    },
    onFotografiaItemClick : function(dview, record, item, index, e, eOpts) {
        console.log(arguments);
        // record.data.url, record.data.largura, record.data.altura
        // var res = str.replace("Microsoft", "W3Schools");
        // http://localhost:3000/participation_data/2/2/80x80/500950f0f512dc9a8dca7888bd9a9a17.jpg
        // http://localhost:3000/participation_data/2/2/500950f0f512dc9a8dca7888bd9a9a17.jpg
        var imagem = record.data.url.replace("/80x80/", "/");

        var janela = Ext.create('GeoPublic.view.Participation.FrameViewer', {
            store: dview.store,
            indice: index,
            caminho: imagem,
            largura: record.data.largura,
            altura: record.data.altura
        });
        janela.show();
        janela.setTitle(dview.up('discussion').title);
    },
    buttonActions: function (button, e, eOpts) {
        var janelaframeviewer = button.up('window');
        switch (button.action) {
            case 'fechar':
                janelaframeviewer.close();
                break;
            case 'previousframe':
                if (janelaframeviewer.indice > 0) {
                    var record = janelaframeviewer.store.getAt(janelaframeviewer.indice-1);
                    var imagem = record.data.url.replace("/80x80/", "/");
                    janelaframeviewer.setImage(janelaframeviewer.indice-1, imagem, record.data.largura, record.data.altura);
                }
                break;
            case 'nextframe':
                if (janelaframeviewer.indice < janelaframeviewer.store.count()-1) {
                    var record = janelaframeviewer.store.getAt(janelaframeviewer.indice+1);
                    var imagem = record.data.url.replace("/80x80/", "/");
                    janelaframeviewer.setImage(janelaframeviewer.indice+1, imagem, record.data.largura, record.data.altura);
                }
                break;
            default:
                break;
        }
    },
    /**
     * onResizeJanela
     * Não é preciso absolutamente para nada
     * Está a servir para debug das dimensões e posição da imagem dentro do canvas
     */
    onResizeJanela: function (win, width, height, opt) {
        console.log(width);
        console.log(height);
        var draw = win.down('draw');
        if (draw) {
            var imagem = draw.surface.items.items[0];
            console.log(imagem.surface.viewBoxShift);
            // {dx: 222.2680412371134, dy: -0, scale: 0.2841796875}
        }
    }
});