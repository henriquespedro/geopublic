var db = global.App.database;
var io = global.App.io;
var mkdirp = require('mkdirp');
var smtpTransport = global.App.transport;
var emailTemplates = require('email-templates');

var enviarEmailParticipation = function (params) {
    /*
     userid: request.session.userid,        // quem submeteu a participação
     id: newid,                             // id da nova ocorrencia
     titulo: params.titulo,                 // título da participação
     participacao: params.participacao,     // conteúdo da participação
     idplano: params.idplano                // idplano em que se está a participar
     */
    var siteStr = '';
    if (global.App.url) {
        siteStr = global.App.url;
    } else {
        siteStr = params.site;
    }
    /*
     select u.nome, u.email, u.masculino, p.designacao, p.responsavel, p.email as responsavelemail, e.designacao as entidade
     from public.utilizador u, ppgis.plano p, ppgis.promotor e
     where p.id = 28 and u.id = 31 and p.idpromotor = e.id
     */
    var conn = db.connect();
    var sql = '';
    sql += 'select u.nome, u.email, u.masculino, p.designacao, p.responsavel, p.email as responsavelemail, e.designacao as entidade';
    sql += ' from public.utilizador u, ppgis.plano p, ppgis.promotor e';
    sql += ' where p.id = ' + params.idplano + ' and u.id = ' + params.userid + ' and p.idpromotor = e.id';
    conn.query(sql, function (err, result) {
        if (err) {
            console.log('SQL=' + sql + ' Error: ', err);
        } else {
            db.disconnect(conn);
            //release connection
            console.log('Resultado: ', result.rows.length);

            // we need to send 2 emails:
            // * for the user submitting the new participation
            // * for the responsible of the plan under discussion
            var locals = {
                email: result.rows[0].email,
                subject: 'Nova participação - ' + result.rows[0].designacao, // translate()?
                saudacao: result.rows[0].masculino ? 'Caro' : 'Cara',
                name: result.rows[0].nome,
                plano: result.rows[0].designacao,
                responsavel: result.rows[0].responsavel,
                responsavelemail: result.rows[0].responsavelemail,
                entidade: result.rows[0].entidade,
                site: siteStr,
                titulo: params.titulo,
                participacao: params.participacao,
                callback: function (err, responseStatus) {
                    if (err) {
                        console.log('Erro', responseStatus.message);
                    } else {
                        console.log('Sucesso', responseStatus.message);
                    }
                    smtpTransport.close();
                }
            };
            emailTemplates(global.App.templates, function (err, template) {
                if (err) {
                    console.log(err);
                } else {
                    template('newparticipation', locals, function (err, html, text) {
                        if (err) {
                            console.log(err);
                        } else {
                            smtpTransport.sendMail({
                                from : locals.responsavelemail,
                                to: locals.email,
                                subject: locals.subject,
                                html: html,
                                text: text
                            }, locals.callback);
                        }
                    });
                }
            });
            // Email ao responsável
            var locals2responsabile = {
                email: result.rows[0].responsavelemail,
                subject: 'Nova participação - ' + result.rows[0].designacao, // translate()?
                saudacao: result.rows[0].masculino ? 'Caro' : 'Cara',
                name: result.rows[0].nome,
                plano: result.rows[0].designacao,
                responsavel: result.rows[0].responsavel,
                responsavelemail: result.rows[0].responsavelemail,
                entidade: result.rows[0].entidade,
                site: siteStr,
                titulo: params.titulo,
                participacao: params.participacao,
                callback: function (err, responseStatus) {
                    if (err) {
                        console.log('Erro', responseStatus.message);
                    } else {
                        console.log('Sucesso', responseStatus.message);
                    }
                    smtpTransport.close();
                }
            };
            emailTemplates(global.App.templates, function (err, template) {
                if (err) {
                    console.log(err);
                } else {
                    template('newparticipation2responsabile', locals2responsabile, function (err, html, text) {
                        if (err) {
                            console.log(err);
                        } else {
                            smtpTransport.sendMail({
                                from : locals.responsavelemail,
                                to: locals.email,
                                subject: locals.subject,
                                html: html,
                                text: text
                            }, locals.callback);
                        }
                    });
                }
            });
        }
    });
};

var enviarEmailPlan = function (destino, parametros, callback) {
    var email = destino.email;
    var name = destino.nome;
    var siteStr = '';
    if (global.App.url) {
        siteStr = global.App.url;
    } else {
        siteStr = destino.site;
    }
    var locals = {
        email: email,
        subject: 'Novo plano para discussão',
        saudacao: 'Caro(a)',
        name: name,
        // site : 'http://' + request.headers.host,
        site: siteStr,
        callback: function (err, responseStatus) {
            if (err) {
                console.log(responseStatus.message);
                /*
                 callback({
                 success : false,
                 message : 'Falhou o envio para o endereço ' + email + '.'
                 });
                 */
            } else {
                console.log(responseStatus.message);
            }
            callback(parametros);
            smtpTransport.close();
        }
    };
    emailTemplates(global.App.templates, function (err, template) {
        if (err) {
            console.log(err);
        } else {
            template('newplan', locals, function (err, html, text) {
                if (err) {
                    console.log(err);
                } else {
                    smtpTransport.sendMail({
                        // from : 'Jorge Gustavo <jorgegustavo@sapo.pt>',
                        to: locals.email,
                        subject: locals.subject,
                        html: html,
                        // generateTextFromHTML: true,
                        text: text
                    }, locals.callback);
                }
            });
        }
    });
    callback(parametros);
};

var rollback = function (client, fn) {
    console.log('Rollback: transação abortada');
    //terminating a client connection will
    //automatically rollback any uncommitted transactions
    //so while it's not technically mandatory to call
    //ROLLBACK it is cleaner and more correct
    client.query('ROLLBACK', function () {
        client.end();
        fn({
            success: false,
            message: 'Transação interrompida'
        });
    });
};

var DXParticipacao = {
    updateComment: function (params, callback, sessionID, request) {
        /*
         { idcomentario: '106', idocorrencia: '19',  comentario: 'Se já estás a dormir, bom proveito',  idestado: '' }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('updateComment: ', params);

        // special case: the idestado can be empty
        // we remove it from the params
        // an additional trigger will fill it with the previous idestado of the ocorrencia
        if (!(params.idestado && parseInt(params.idestado))) {
            delete params.idestado;
            console.log('params.idestado: ' + params.idestado + ' - deleted');
        }

        var i = 1, id, fields = [], values = [];
        id = params.idcomentario;
        delete params.idcomentario;
        for (var key in params) {
            fields.push(key + '= $' + i);
            values.push(params[key]);
            i = i + 1;
        }
        fields.push('datamodificacao = $' + i);
        values.push('now()');

        var conn = db.connect();
        conn.query('UPDATE ppgis.comentario SET ' + fields.join() + ' WHERE id = ' + id, values, function (err, resultUpdate) {
            if (err) {
                console.log('UPDATE ppgis.ocorrencia', err);
            } else {
                db.disconnect(conn);
                callback({
                    success: true
                });
            }
        });
    },
    createComment: function (params, callback, sessionID, request) {
        /*
         { idocorrencia: '19',  comentario: 'Se já estás a dormir, bom proveito',  idestado: '' }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('createComment: ', params);

        // special case: the idestado can be empty
        // we remove it from the params
        // an additional trigger will fill it with the previous idestado of the ocorrencia
        if (!(params.idestado && parseInt(params.idestado))) {
            delete params.idestado;
            console.log('params.idestado: ' + params.idestado + ' - deleted');
        }
        var fields = [], values = [];
        for (var key in params) {
            switch (key) {
                case "id":
                    break;
                default:
                    fields.push(key);
                    values.push(params[key]);
                    break;
            }
        }
        //
        fields.push('datamodificacao');
        values.push('now()');
        fields.push('idutilizador');
        values.push(request.session.userid);
        var i = 0, buracos = [];
        for (i = 1; i <= fields.length; i++) {
            buracos.push('$' + i);
        }
        var conn = db.connect();
        conn.query('INSERT INTO ppgis.comentario (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
            // db.disconnect(conn);
            if (err) {
                db.debugError(callback, err);
            } else {
                // var sql = 'SELECT * FROM ppgis.comentario where id = ' + resultInsert.rows[0].id;
                var sql = '';
                sql += 'SELECT c.id, c.comentario, c.datacriacao, now()-c.datacriacao as haquantotempo, u.fotografia, u.nome, u.id as idutilizador, p.idutilizador as idresponsavel, e.estado, e.color';
                sql += ' FROM ppgis.comentario c, public.utilizador u, ppgis.estado e, ppgis.ocorrencia o, ppgis.plano p';
                sql += ' where c.id = ' + resultInsert.rows[0].id;
                sql += ' and c.idutilizador = u.id';
                sql += ' and c.idestado = e.id';
                sql += ' and o.idplano = e.idplano';
                sql += ' and c.idocorrencia = o.id';
                sql += ' and p.id = o.idplano';
                console.log(sql);
                conn.query(sql, function (err, result) {
                    if (err) {
                        console.log('SQL=' + sql + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        callback({
                            success: true,
                            data: result.rows, // toJson(result.rows, resultTotalQuery.rows[0].totals),
                            total: result.rows.length
                        });
                        /*
                         * Atualizar as estatísticas...
                         */
                        DXParticipacao.numeros({}, function (res) {
                            console.log('Novas estatísticas calculadas: ');
                            // console.log(res.data);
                            if (res.success) {
                                io.emit('comment-created', {
                                    msg: 'Novo comentário',
                                    params: params,
                                    idutilizador: request.session.userid,
                                    numeros: res.data
                                });
                            } else {
                                console.log('Problema GRAVE ao calcular as novas estatísticas. O mundo está perdido.');
                            }
                        });
                    }
                });
            }
        });
    },
    readComment: function (params, callback, sessionID, request) {
        console.log('readComment: ');
        console.log(params);
        var idocorrencia = params;
        var conn = db.connect();
        /*
         SELECT c.id, c.comentario, c.datacriacao, now()-c.datacriacao as haquantotempo, u.fotografia, u.nome, u.id as idutilizador, p.idutilizador as idresponsavel, e.estado, e.color
         FROM ppgis.comentario c, public.utilizador u, ppgis.estado e, ppgis.ocorrencia o, ppgis.plano p
         where idocorrencia = 44
         and c.idutilizador = u.id
         and c.idestado = e.id
         and o.idplano = e.idplano
         and c.idocorrencia = o.id
         and p.id = o.idplano
         */
        var sql = '';
        sql += 'SELECT c.id, c.comentario, c.datacriacao, now()-c.datacriacao as haquantotempo, u.fotografia, u.nome, u.id as idutilizador, p.idutilizador as idresponsavel, e.estado, e.color';
        sql += ' FROM ppgis.comentario c, public.utilizador u, ppgis.estado e, ppgis.ocorrencia o, ppgis.plano p';
        sql += ' where idocorrencia = ' + idocorrencia;
        sql += ' and c.idutilizador = u.id';
        sql += ' and c.idestado = e.id';
        sql += ' and o.idplano = e.idplano';
        sql += ' and c.idocorrencia = o.id';
        sql += ' and p.id = o.idplano';

        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals FROM ppgis.comentario where idocorrencia = ' + idocorrencia;
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows, // toJson(result.rows, resultTotalQuery.rows[0].totals),
                            total: resultTotalQuery.rows[0].totals
                        });
                    }
                });
            }
        });
    },
    destroyComment: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.destroyComment');
        console.log(params);
        var id = params.idcomentario;

        var conn = db.connect();
        var sql = 'delete FROM ppgis.comentario where id = ' + id;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                db.disconnect(conn);
                callback({
                    success: true,
                    message: 'Comment removed'
                });
                /*
                 * Atualizar as estatísticas...
                 */
                DXParticipacao.numeros({}, function (res) {
                    console.log('Novas estatísticas calculadas: ');
                    // console.log(res.data);
                    if (res.success) {
                        io.emit('comment-deleted', {
                            msg: 'Comment deleted',
                            params: params,
                            idutilizador: request.session.userid,
                            numeros: res.data
                        });
                    } else {
                        console.log('Problema GRAVE ao calcular as novas estatísticas. O mundo está perdido.');
                    }
                });
            }
        });
    },
    readFotografiaTmp: function (params, callback, sessionID, request) {
        console.log('readFotografiaTmp: ');
        console.log(params);
        var conn = db.connect();

        var sql = "SELECT id, pasta || '/80x80/' || caminho as url, largura, altura, datacriacao FROM ppgis.fotografiatmp where sessionid = '" + sessionID + "'";
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = "SELECT count(*) as totals FROM ppgis.fotografiatmp where sessionid = '" + sessionID + "'";
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals
                        });
                    }
                });
            }
        });
    },
    destroyFotografiaTmp: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.destroyFotografiaTmp: ', params);
        //  [ { id: 4 }, { id: 6 }, { id: 5 }, { id: 9 } ]
        // or
        // { id: 3 }
        //
        // isto pode ser evitado (ié pode vir sempre um array)
        // http://localhost/extjs/docs/index.html#!/api/Ext.data.writer.Json
        // The allowSingle configuration can be set to false to force the records to always be encoded in an array, even if there is only a single record being sent.
        var where = [];
        var wherestr = '';
        if (Array.isArray(params)) {
            params.forEach(function (entry) {
                where.push('id = ' + entry.id);
            });
            wherestr = where.join(' OR ');
        } else {
            console.log('Não é um array!');
            wherestr = 'id = ' + params.id;
        }
        console.log(wherestr);
        var conn = db.connect();
        var sql = 'delete FROM ppgis.fotografiatmp where ' + wherestr;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                callback({
                    success: true
                });
            }
        });
    },
    updateFotografiaTmp: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.updateFotografiaTmp');
        console.log(params);
        callback({
            success: true
        });
    },
    createFotografiaTmp: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.createFotografiaTmp');
        console.log(params);
        callback({
            success: true
        });
    },
    readFotografia: function (params, callback, sessionID, request) {
        console.log('readFotografia: ');
        // console.log(arguments);
        console.log(params);
        // { idocorrencia: 1, page: 1, start: 0, limit: 25 }
        var idocorrencia = params.idocorrencia;
        var conn = db.connect();

        var sql = "SELECT id, pasta || '/80x80/' || caminho as url, largura, altura, datacriacao FROM ppgis.fotografia where not inapropriada and idocorrencia = " + idocorrencia;
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals FROM ppgis.fotografia where not inapropriada and idocorrencia = ' + idocorrencia;
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals
                        });
                    }
                });
            }
        });
    },
    destroyFotografia: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.destroyFotografia');
        console.log(params);
    },
    updateFotografia: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.updateFotografia');
        console.log(params);
        callback({
            success: true
        });
    },
    createFotografia: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.createFotografia');
        console.log(params);
        callback({
            success: true
        });
    },
    destroyOcorrencia: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.destroyOcorrencia');
        console.log(params);
        var id = params.idocorrencia;
        // Pode ter fotografias associadas...
        // Se tiver comentários, não se remove
        var conn = db.connect();
        // https://github.com/brianc/node-postgres/wiki/Transactions
        conn.query('BEGIN', function (err, resultBegin) {
            if (err) {
                console.log('BEGIN', err);
                rollback(conn, callback);
            }
            var sql = "delete FROM ppgis.fotografia where idocorrencia = " + id + ' and idutilizador = ' + request.session.userid;
            conn.query(sql, function (err, resultDeleteFotografia) {
                if (err) {
                    console.log(sql, err);
                    rollback(conn, callback);
                }
                sql = "delete FROM ppgis.ocorrencia where id = " + id + ' and idutilizador = ' + request.session.userid;
                conn.query(sql, function (err, resultDeleteFotografiatmp) {
                    if (err) {
                        console.log(sql, err);
                        rollback(conn, callback);
                    }
                    conn.query('COMMIT', function (err, resultCommit) {
                        db.disconnect(conn);
                        callback({
                            success: true,
                            message: 'Participation removed'
                        });
                        /*
                         * Atualizar as estatísticas...
                         */
                        DXParticipacao.numeros({}, function (res) {
                            console.log('Novas estatísticas calculadas: ');
                            // console.log(res.data);
                            if (res.success) {
                                io.emit('participation-deleted', {
                                    msg: 'Participation deleted',
                                    params: params,
                                    idutilizador: request.session.userid,
                                    numeros: res.data
                                });
                            } else {
                                console.log('Problema GRAVE ao calcular as novas estatísticas. O mundo está perdido.');
                            }
                        });
                    });
                });
            });
        });
    },
    updateOcorrencia: function (params, callback, sessionID, request) {
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('DXParticipacao.updateOcorrencia: ', params);
        var fields = [], values = [];

        /*
         DXParticipacao.updateOcorrencia
         { idocorrencia: 37,
         the_geom: '{"type":"Point","coordinates":[-940147.1728822,4949493.2266015]}' }

         */

        var i = 1, id, fields = [], values = [];
        id = params.idocorrencia;
        delete params.idocorrencia;
        for (var key in params) {
            if (key === 'the_geom') {
                fields.push(key + ' = ' + 'ST_SetSRID(ST_GeomFromGeoJSON($' + i + '), 900913)');
                // select ST_SetSRID(ST_GeomFromGeoJSON(''), 900913) // dá erro
                // select ST_SetSRID(ST_GeomFromGeoJSON(null), 900913) // não dá erro
                if (params[key] === '') {
                    values.push(null);
                } else {
                    values.push(params[key]);
                }
            } else {
                fields.push(key + '= $' + i);
                values.push(params[key]);
            }
            i = i + 1;
        }
        fields.push('datamodificacao = $' + i);
        values.push('now()');

        var conn = db.connect();
        // https://github.com/brianc/node-postgres/wiki/Transactions
        conn.query('BEGIN', function (err, resultBegin) {
            if (err) {
                console.log('BEGIN', err);
                rollback(conn, callback);
            }
            conn.query('UPDATE ppgis.ocorrencia SET ' + fields.join() + ' WHERE id = ' + id, values, function (err, resultUpdateOcorrencia) {
                if (err) {
                    console.log('UPDATE ppgis.ocorrencia', err);
                    rollback(conn, callback);
                }
                sql = "delete FROM ppgis.fotografia where idocorrencia = " + id;
                conn.query(sql, function (err, resultDeleteFotografia) {
                    if (err) {
                        console.log(sql, err);
                        rollback(conn, callback);
                    }
                    var sql = 'insert into ppgis.fotografia (idocorrencia, pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao) ';
                    sql += 'select ' + id + ', pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao ';
                    sql += 'from ppgis.fotografiatmp ';
                    sql += "where sessionid = '" + sessionID + "'";
                    conn.query(sql, function (err, resultInsertFotografia) {
                        if (err) {
                            console.log(sql, err);
                            rollback(conn, callback);
                        }
                        sql = "delete FROM ppgis.fotografiatmp where sessionid = '" + sessionID + "'";
                        conn.query(sql, function (err, resultDeleteFotografiatmp) {
                            if (err) {
                                console.log('delete FROM ppgis.fotografiatmp', err);
                                rollback(conn, callback);
                            }
                            conn.query('COMMIT', function (err, resultCommit) {
                                db.disconnect(conn);
                                callback({
                                    success: true,
                                    message: 'Ocorrência alterada'
                                    // data: resultInsert.rows,
                                    // dataphoto: result2Insert
                                });
                                /*
                                 * Atualizar as estatísticas...
                                 */
                                DXParticipacao.numeros({}, function (res) {
                                    console.log('Novas estatísticas calculadas: ');
                                    // console.log(res.data);
                                    if (res.success) {
                                        io.emit('participation-updated', {
                                            msg: 'Participation updated',
                                            params: params,
                                            idutilizador: request.session.userid,
                                            numeros: res.data
                                        });
                                    } else {
                                        console.log('Problema GRAVE ao calcular as novas estatísticas. O mundo está perdido.');
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    },
    prepareEditOcorrencia: function (params, callback, sessionID, request) {
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('prepareEditOcorrencia: ', params);

        var conn = db.connect();
        // https://github.com/brianc/node-postgres/wiki/Transactions
        conn.query('BEGIN', function (err, result) {
            if (err) {
                console.log('BEGIN', err);
                rollback(conn, callback);
            }
            var delanterior = "delete from ppgis.fotografiatmp where sessionid = '" + sessionID + "'";
            conn.query(delanterior, function (err, resultDelete) {
                if (err) {
                    console.log('delete from ppgis.fotografiatmp: ', err);
                    rollback(conn, callback);
                }
                var sql = 'insert into ppgis.fotografiatmp (sessionid, pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao) ';
                sql += "select '" + sessionID + "', pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao ";
                sql += 'from ppgis.fotografia ';
                sql += "where idocorrencia = " + params.idocorrencia;
                console.log(sql);
                conn.query(sql, function (err, result) {
                    if (err) {
                        console.log('insert into ppgis.fotografiatmp: ', err);
                        rollback(conn, callback);
                    }
                    conn.query('COMMIT', function (err, resultCommit) {
                        db.disconnect(conn);
                        callback({
                            success: true,
                            total: result.rowCount
                        });
                    });

                });
            });
        });
    },
    createOcorrencia: function (params, callback, sessionID, request) {
        /*
         {
         titulo: 'sfkjh',
         id_tipo_ocorrencia: 8,
         participacao: 'sdfasdfasdf',
         idplano: 1,
         geojson: '{"type":"Point","coordinates":[-938422.0682167901,4951421.1694373]}'
         }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('createOcorrencia: ', params);
        var fields = [], values = [];
        // o primeiro parâmetro é a chave (garantido por paramOrder : 'id', em app/model/Promotor.js)
        // o id vem a 0, quando se insere um registo
        for (var key in params) {
            switch (key) {
                case "idocorrencia":
                    break;
                /*
                 case "geojson":
                 fields.push('the_geom');
                 values.push("ST_GeomFromGeoJSON('" + params[key] + "')");
                 break;
                 */
                default:
                    fields.push(key);
                    values.push(params[key]);
                    break;
            }
        }
        fields.push('datamodificacao');
        values.push('now()');
        fields.push('idutilizador');
        values.push(request.session.userid);
        var i, buracos = [];
        for (i = 1; i <= fields.length; i++) {
            if (fields[i - 1] === 'the_geom') {
                buracos.push('ST_SetSRID(ST_GeomFromGeoJSON($' + i + '), 900913)');
            } else {
                buracos.push('$' + i);
            }
        }

        var conn = db.connect();
        // https://github.com/brianc/node-postgres/wiki/Transactions
        conn.query('BEGIN', function (err, result) {
            if (err) {
                console.log('BEGIN', err);
                rollback(conn, callback);
            }
            conn.query('INSERT INTO ppgis.ocorrencia (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
                if (err) {
                    console.log('INSERT INTO ppgis.ocorrencia', err);
                    rollback(conn, callback);
                }
                var newid = resultInsert.rows[0].id;
                var sql = 'insert into ppgis.fotografia (idocorrencia, pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao) ';
                sql += 'select ' + newid + ', pasta, caminho, observacoes, idutilizador, tamanho, largura, altura, datacriacao ';
                sql += 'from ppgis.fotografiatmp ';
                sql += "where sessionid = '" + sessionID + "'";
                conn.query(sql, function (err, result2Insert) {
                    if (err) {
                        console.log('insert into ppgis.fotografia', err);
                        rollback(conn, callback);
                    }
                    sql = "delete FROM ppgis.fotografiatmp where sessionid = '" + sessionID + "'";
                    conn.query(sql, function (err, result) {
                        if (err) {
                            console.log('delete FROM ppgis.fotografiatmp', err);
                            rollback(conn, callback);
                        }
                        conn.query('COMMIT', function (err, result) {
                            db.disconnect(conn);
                            callback({
                                success: true,
                                message: 'Ocorrência inserida',
                                data: resultInsert.rows,
                                dataphoto: result2Insert
                            });
                            /*
                            * Notify users by email
                            *
                            * createOcorrencia:  { titulo: 'Notificação 1',
                             participacao: 'nihao tong shue',
                             idplano: 29,
                             idestado: 1,
                             proposta: '' }

                             request.session.userid

                             */

                            enviarEmailParticipation({
                                userid: request.session.userid,
                                id: newid,
                                titulo: params.titulo,
                                participacao: params.participacao,
                                idplano: params.idplano
                            }); // sem callback nem parametros para o callback...

                            /*
                             * Atualizar as estatísticas...
                             */
                            DXParticipacao.numeros({}, function (res) {
                                console.log('Novas estatísticas calculadas: ');
                                // console.log(res.data);
                                if (res.success) {
                                    io.emit('participation-created', {
                                        msg: 'New participation',
                                        params: params,
                                        idutilizador: request.session.userid,
                                        numeros: res.data
                                    });
                                } else {
                                    console.log('Problema GRAVE ao calcular as novas estatísticas. O mundo está perdido.');
                                }
                            });
                        });
                    });
                });
            });
        });
    },
    readOcorrencia: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.readOcorrencia');
        console.log(params);
        // podem-se pedir todas as ocorrências ou só uma
        // só uma para acrescentar depois de se inserir ou
        // para se acrecentar quando se recebe uma notificação pelo socket.io
        var where = '';
        if (params.id) {
            where = 'id = ' + params.id;
        }
        if (params.idplano) {
            where = 'idplano = ' + params.idplano;
        }
        var conn = db.connect();
        /*
         SELECT o.*, e.estado, e.color, e.icon, ST_AsGeoJSON(the_geom) as geojson, (SELECT COUNT(*) FROM ppgis.comentario c WHERE c.idocorrencia = o.id) AS numcomentarios,
         (SELECT COUNT(*) FROM ppgis.fotografia f WHERE f.idocorrencia = o.id) AS numfotografias,
         now()-o.datacriacao as haquantotempo, u.fotografia, u.nome
         FROM ppgis.ocorrencia o, ppgis.estado e, public.utilizador u
         WHERE NOT o.apagado AND o.idplano = 2 and e.id = o.idestado AND e.idplano = o.idplano
         AND o.idutilizador = u.id
         */

        var sql = 'SELECT o.*, e.estado, e.color, e.icon, ST_AsGeoJSON(the_geom) as geojson, proposta, (SELECT COUNT(*) FROM ppgis.comentario c WHERE c.idocorrencia = o.id) AS numcomentarios,';
        sql += ' (SELECT COUNT(*) FROM ppgis.fotografia f WHERE f.idocorrencia = o.id) AS numfotografias,';
        sql += ' now()-o.datacriacao as haquantotempo, u.fotografia, u.nome, o.idutilizador';
        sql += ' FROM ppgis.ocorrencia o, ppgis.estado e, public.utilizador u';
        sql += ' WHERE NOT o.apagado AND o.' + where + ' and e.id = o.idestado AND e.idplano = o.idplano';
        sql += ' AND o.idutilizador = u.id';

        // OpenLayers.Geometry.fromWKT("POINT(-4.259215 45.344827)")
        console.log(sql);
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals FROM ppgis.ocorrencia WHERE NOT apagado AND ';
                totalQuery += where;
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals
                        });
                    }
                });
            }
        });
    },
    statsByType: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.statsByType');
        console.log(params);
        var where = '';
        if (params.idplano) {
            where = 'idplano = ' + params.idplano;
            var sql = "SELECT t.id, t.designacao AS type, COUNT(o.idtipoocorrencia) ";
            sql += "FROM ppgis.tipoocorrencia t ";
            sql += "LEFT JOIN ppgis.ocorrencia o ON (t.id = o.idtipoocorrencia AND t.idplano = o.idplano) ";
            sql += "WHERE t." + where + " ";
            sql += "GROUP BY t.id, t.designacao ";
            sql += "ORDER BY t.id";
            console.log(sql);
            var conn = db.connect();
            conn.query(sql, function (err, result) {
                if (err) {
                    console.log('SQL=' + sql + ' Error: ', err);
                    db.debugError(callback, err);
                } else {
                    //release connection
                    db.disconnect(conn);
                    callback({
                        success: true,
                        data: result.rows,
                        total: result.rows.length
                    });
                }
            });
        } else {
            console.log('statsByType: idplano parameter missing');
            callback({
                success: false
            });
        }
        /*
         SELECT t.id, t.designacao, COUNT(o.idtipoocorrencia)
         FROM ppgis.tipoocorrencia t
         LEFT JOIN ppgis.ocorrencia o ON (t.id = o.idtipoocorrencia AND t.idplano = o.idplano)
         WHERE t.idplano = 1
         GROUP BY t.id, t.designacao
         ORDER BY t.id
         */
    },
    statsByState: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.statsByState');
        console.log(params);
        var where = '';
        if (params.idplano) {
            where = 'idplano = ' + params.idplano;
            var sql = "SELECT e.id, e.estado as state, COUNT(o.idestado) ";
            sql += "FROM ppgis.estado e ";
            sql += "LEFT JOIN ppgis.ocorrencia o ON (e.id = o.idestado AND e.idplano = o.idplano) ";
            sql += "WHERE e." + where + " ";
            sql += "GROUP BY e.id, e.estado ";
            sql += "ORDER BY e.id";
            console.log(sql);

            var conn = db.connect();
            conn.query(sql, function (err, result) {
                if (err) {
                    console.log('SQL=' + sql + ' Error: ', err);
                    db.debugError(callback, err);
                } else {
                    //release connection
                    db.disconnect(conn);
                    callback({
                        success: true,
                        data: result.rows,
                        total: result.rows.length
                    });
                }
            });
        } else {
            console.log('statsByState: idplano parameter missing');
            callback({
                success: false
            });

        }
        /*
         SELECT e.id, e.estado, COUNT(o.idestado)
         FROM ppgis.estado e
         LEFT JOIN ppgis.ocorrencia o ON (e.id = o.idestado AND e.idplano = o.idplano)
         WHERE e.idplano = 2
         GROUP BY e.id, e.estado
         ORDER BY e.id;
         */
    },
    numeros: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.numeros');
        console.log(params);

        var obj = {
            promoters: 9,
            plans: 18,
            participations: 27,
            comments: 36,
            images: 45
        };

        /*
         select 'promoters' as table, count(*) from ppgis.promotor UNION
         select 'plans' as table, count(*) from ppgis.plano UNION
         select 'participations' as table, count(*) from ppgis.ocorrencia where NOT apagado UNION
         select 'comments' as table, count(*) from ppgis.comentario UNION
         select 'images' as table, count(*) from ppgis.fotografia
         */

        var conn = db.connect();
        var sql = "select 'promoters' as table, count(*) from ppgis.promotor UNION ";
        sql += "select 'plans' as table, count(*) from ppgis.plano UNION ";
        sql += "select 'participations' as table, count(*) from ppgis.ocorrencia where NOT apagado UNION ";
        sql += "select 'comments' as table, count(*) from ppgis.comentario UNION ";
        sql += "select 'images' as table, count(*) from ppgis.fotografia";
        console.log(sql);

        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //release connection
                db.disconnect(conn);
                // return just one object, instead of an array of objects (array of rows)
                // less processing on the client side :-)
                var aux = {};
                result.rows.forEach(function (element, index, array) {
                    aux[element.table] = element.count;
                });
                console.log(aux);
                callback({
                    success: true,
                    data: aux
                });
            }
        });
    },
    readSummitsGeoJSON: function (params, callback, sessionID, request) {
        console.log('DXParticipacao.readSummits');
        console.log(params);
        var toGeoJson = function (rows) {
            var obj, i;
            obj = {
                type: "FeatureCollection",
                features: []
            };
            for (i = 0; i < rows.length; i++) {
                var id, item, feature, geometry;
                item = rows[i];
                id = item.id;
                geometry = JSON.parse(item.geojson);
                delete item.geojson;
                delete item.id;
                feature = {
                    type: "Feature",
                    properties: item,
                    geometry: geometry,
                    id: id
                };
                obj.features.push(feature);
            }
            return obj;
        };
        var conn = db.connect();
        var sql = 'SELECT id, elevation, name, ST_AsGeoJSON(the_geom) as geojson FROM amr.summits';
        console.log(sql);
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals FROM amr.summits';
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        callback({
                            success: true,
                            data: toGeoJson(result.rows),
                            total: resultTotalQuery.rows[0].totals
                        });
                    }
                });
            }
        });
    },
    /*
     * EstadoOcorrencia
     */
    createEstadoOcorrencia: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        /*
         createPromotor:
         {
         { id: 0,
         idplano: 3,
         estado: 'Estado',
         significado: '',
         color: 'gray',
         icon: '' }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('createEstadoOcorrencia: ');
        console.log(params);
        var conn = db.connect();
        var sql = 'select max(id) as contador from ppgis.estado where idplano = ' + params.idplano;
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                var next = result.rows[0].contador + 1;
                params.id = next;
                var fields = [], values = [];
                for (var key in params) {
                    fields.push(key);
                    values.push(params[key]);
                }
                var i, buracos = [];
                for (i = 1; i <= fields.length; i++) {
                    buracos.push('$' + i);
                }
                conn.query('INSERT INTO ppgis.estado (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
                    db.disconnect(conn);
                    if (err) {
                        db.debugError(callback, err);
                    } else {
                        callback({
                            success: true,
                            message: 'Dados atualizados',
                            data: resultInsert.rows
                            // id : resultInsert.rows[0].id
                        });
                    }
                });
            }
        });
    },
    updateEstadoOcorrencia: function (params, callback, sessionID, request) {
        console.log('updateEstadoOcorrencia');
        console.log(params);
        /*
         { id: 4,
         idplano: 1,
         estado: 'Fechada',
         significado: 'encerrada',
         color: '',
         icon: 'escuro' }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        var fields = [], values = [], i = 1;
        var id = params.id;
        delete params.id;
        var idplano = params.idplano;
        delete params.idplano;
        for (var key in params) {
            fields.push(key + '= $' + i);
            values.push(params[key]);
            i = i + 1;
        }
        if (request.session.userid && request.session.groupid <= 1) {
            var conn = db.connect();
            conn.query('UPDATE ppgis.estado SET ' + fields.join() + ' WHERE id = ' + id + ' AND idplano = ' + idplano, values, function (err, result) {
                if (err) {
                    console.log('UPDATE =' + sql + ' Error: ' + err);
                    db.debugError(callback, err);
                } else {
                    var sql = 'SELECT * FROM ppgis.estado where id = ' + id + ' AND idplano = ' + idplano;
                    conn.query(sql, function (err, resultSelect) {
                        db.disconnect(conn);
                        if (err) {
                            console.log('SQL=' + sql + ' Error: ', err);
                            db.debugError(callback, err);
                        } else {
                            callback({
                                success: true,
                                message: 'Dados atualizados',
                                data: resultSelect.rows
                            });
                        }
                    });
                }
            });
        } else {
            callback({
                success: false,
                message: 'Utilizador sem permissão para alterar os dados.'
            });
        }
    },
    destroyEstadoOcorrencia: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        console.log('destroyEstadoOcorrencia: ');
        console.log(params);
        var conn = db.connect();
        var sql = 'delete FROM ppgis.estado where id = ' + params.id + ' AND idplano = ' + params.idplano;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                callback({
                    success: true
                });
            }
        });
    },
    readEstadoOcorrencia: function (params, callback, sessionID, request) {
        console.log('readEstadoOcorrencia: ');
        console.log(params);
        var plano = params.idplano;
        // ???
        var userid = request.session.userid;
        var conn = db.connect();

        var sql = 'select * ';
        sql += ' from ppgis.estado where idplano = ' + plano;
        sql += ' order by id';

        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals from ppgis.estado where idplano = ' + plano;
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals // rowsTotal[0].totals
                        });
                    }
                });
            }
        });
    },
    /*
     * TipoOcorrencia
     */
    createTipoOcorrencia: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        /*
         createTipoOcorrencia:
         {
         id: 0,
         designacao: 'Nova entidade',
         email: 'info@entidade.pt',
         site: 'http://www.entidade.pt',
         dataregisto: null }
         */
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('createTipoOcorrencia: ', params);
        var conn = db.connect();
        var sql = 'select max(id) as contador from ppgis.tipoocorrencia where idplano = ' + params.idplano;
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                var next = result.rows[0].contador + 1;
                params.id = next;
                // isclass exists in Model, but not on DB
                delete params.isclass;
                var fields = [], values = [];
                for (var key in params) {
                    fields.push(key);
                    values.push(params[key]);
                }
                fields.push('datamodificacao');
                values.push('now()');
                fields.push('idutilizador');
                values.push(request.session.userid);
                var i, buracos = [];
                for (i = 1; i <= fields.length; i++) {
                    buracos.push('$' + i);
                }
                conn.query('INSERT INTO ppgis.tipoocorrencia (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
                    db.disconnect(conn);
                    if (err) {
                        db.debugError(callback, err);
                    } else {
                        callback({
                            success: true,
                            message: 'Dados atualizados',
                            data: resultInsert.rows
                            // id : resultInsert.rows[0].id
                        });
                    }
                });
            }
        });
    },
    updateTipoOcorrencia: function (params, callback, sessionID, request) {
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('updateTipoOcorrencia: ', params);
        /*
         { id: 5,
         idplano: 2,
         designacao: 'Acidente grave sem feridos',
         ativa: true,
         classe: 0,
         isclass: false }
         */
        var fields = [], values = [], i = 1;
        var id = params.id;
        delete params.id;
        var idplano = params.idplano;
        delete params.idplano;
        delete params.isclass;
        for (var key in params) {
            fields.push(key + '= $' + i);
            values.push(params[key]);
            i = i + 1;
        }
        fields.push('datamodificacao = $' + i);
        values.push('now()');
        i = i + 1;
        fields.push('idutilizador = $' + i);
        values.push(request.session.userid);
        if (request.session.userid && request.session.groupid <= 1) {
            var conn = db.connect();
            conn.query('UPDATE ppgis.tipoocorrencia SET ' + fields.join() + ' WHERE id = ' + id + ' AND idplano = ' + idplano, values, function (err, result) {
                if (err) {
                    console.log('UPDATE Error: ' + err);
                    db.debugError(callback, err);
                } else {
                    var sql = 'SELECT * FROM ppgis.tipoocorrencia where id = ' + id + ' AND idplano = ' + idplano;
                    conn.query(sql, function (err, resultSelect) {
                        db.disconnect(conn);
                        if (err) {
                            console.log('SQL=' + sql + ' Error: ', err);
                            db.debugError(callback, err);
                        } else {
                            callback({
                                success: true,
                                message: 'Dados atualizados',
                                data: resultSelect.rows
                            });
                        }
                    });
                }
            });
        } else {
            callback({
                success: false,
                message: 'Utilizador sem permissão para alterar os dados.'
            });
        }
    },
    destroyTipoOcorrencia: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        console.log('destroyTipoOcorrencia: ', params);
        var conn = db.connect();
        var sql = 'delete FROM ppgis.tipoocorrencia where id = ' + params.id + ' AND idplano = ' + params.idplano;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                callback({
                    success: true
                });
            }
        });
    },
    readTipoOcorrencia: function (params, callback, sessionID, request) {
        console.log('readTipoOcorrencia: ');
        console.log(params);
        var plano = params.idplano;
        // ???
        var userid = request.session.userid;
        var conn = db.connect();
        // var sql = 'SELECT * FROM ppgis.tipoocorrencia where idplano = ' + plano;

        var sql = 'select *, CASE WHEN classe IS NULL THEN true ELSE false END as isclass';
        sql += ' from ppgis.tipoocorrencia where idplano = ' + plano;
        sql += ' order by CASE WHEN classe IS NULL THEN id ELSE classe END, classe DESC';

        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals from ppgis.tipoocorrencia where idplano = ' + plano;
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals // rowsTotal[0].totals
                        });
                    }
                });
            }
        });
    },
    createPlano: function (params, callback, sessionID, request) {
        // falta proteger user loginado
        // falta proteger só para grupo admin
        /*
         createPlano:  { id: 0,
         idpromotor: 1,
         designacao: 'Plano',
         descricao: 'Descrição do plano ou projeto',
         responsavel: 'Pessoa a contactar',
         email: 'pessoa@entidade.pt',
         site: 'http://www.entidade.pt/plano',
         inicio: '2014-09-21T13:30:59',
         fim: '2014-10-21T13:30:59',
         wkt: '',
         geojson: '' }
         */

        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        if (request.session.userid) {
            console.log('createPlano: ', params);
            var i = 1, id, fields = [], buracos = [], values = [];
            // se existir um ID, retira-se da lista
            id = params.id;
            delete params.id;
            for (var key in params) {
                if (key === 'the_geom') {
                    fields.push(key);
                    buracos.push('ST_SetSRID(ST_GeomFromGeoJSON($' + i + '), 900913)');
                    // select ST_SetSRID(ST_GeomFromGeoJSON(''), 900913) // dá erro
                    // select ST_SetSRID(ST_GeomFromGeoJSON(null), 900913) // não dá erro
                    if (params[key] === '') {
                        values.push(null);
                    } else {
                        values.push(params[key]);
                    }
                } else {
                    fields.push(key);
                    buracos.push('$' + i);
                    values.push(params[key]);
                }
                i = i + 1;
            }
            fields.push('datamodificacao');
            buracos.push('$' + i);
            values.push('now()');
            i = i + 1;
            fields.push('idutilizador');
            buracos.push('$' + i);
            values.push(request.session.userid);
            var conn = db.connect();
            conn.query('INSERT INTO ppgis.plano (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
                db.disconnect(conn);
                if (err) {
                    db.debugError(callback, err);
                } else {
                    // console.log(resultInsert);
                    // já tenho um id; já posso criar a pasta
                    var pasta = './public/participation_data/' + params.idpromotor + '/' + resultInsert.rows[0].id;
                    mkdirp(pasta, function (err) {
                        if (err) {
                            console.error(err);
                            callback({
                                success: false,
                                message: 'Error creating forders',
                                data: resultInsert.rows
                            });
                        } else {
                            // cf. DXFormTest.js, filesubmitinstantaneo
                            mkdirp.sync(pasta + '/80x80');
                            mkdirp.sync(pasta + '/_x600');
                            enviarEmailPlan({
                                email: params.email.toLowerCase(),
                                nome: params.responsavel,
                                site: 'http://' + request.headers.host
                            }, {
                                success: true,
                                message: 'Dados atualizados',
                                data: resultInsert.rows
                                // id : resultInsert.rows[0].id
                            }, callback);
                        }
                    });
                }
            });
        }
    },
    updatePlano: function (params, callback, sessionID, request) {
        /*
         { id: 7,
         idpromotor: 12,
         designacao: 'Plano B',
         descricao: 'Descrição do plano ou projeto',
         responsavel: 'Pessoa a contactar',
         email: 'pessoa@entidade.pt',
         site: 'http://www.entidade.pt/plano',
         inicio: '2014-09-21T16:17:09',
         fim: '2014-10-21T16:17:09',
         geojson: '' }

         { designacao: 'Plano B', id: 7 }
         */

        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('updatePlano: ', params);
        var i = 1, id, fields = [], values = [];
        id = params.id;
        delete params.id;
        for (var key in params) {
            if (key === 'the_geom') {
                fields.push(key + ' = ' + 'ST_SetSRID(ST_GeomFromGeoJSON($' + i + '), 900913)');
                // select ST_SetSRID(ST_GeomFromGeoJSON(''), 900913) // dá erro
                // select ST_SetSRID(ST_GeomFromGeoJSON(null), 900913) // não dá erro
                if (params[key] === '') {
                    values.push(null);
                } else {
                    values.push(params[key]);
                }
            } else {
                fields.push(key + '= $' + i);
                values.push(params[key]);
            }
            i = i + 1;
        }
        fields.push('datamodificacao = $' + i);
        values.push('now()');
        i = i + 1;
        fields.push('idutilizador = $' + i);
        values.push(request.session.userid);

        if (request.session.userid && request.session.groupid <= 1) {
            var conn = db.connect();
            conn.query('UPDATE ppgis.plano SET ' + fields.join() + ' WHERE id = ' + id, values, function (err, result) {
                if (err) {
                    console.log('UPDATE =' + sql + ' Error: ' + err);
                    db.debugError(callback, err);
                } else {
                    var sql = 'SELECT * FROM ppgis.plano where id = ' + id;
                    conn.query(sql, function (err, resultSelect) {
                        db.disconnect(conn);
                        if (err) {
                            console.log('SQL=' + sql + ' Error: ', err);
                            db.debugError(callback, err);
                        } else {
                            if (params.email) {
                                // mudou o email; vamos mandar um email a dizer que o plano ficou a apontar para este novo email
                                console.log('Está na hora de enviar um email para ' + email);
                                enviarEmailPlan({
                                    email: params.email.toLowerCase(),
                                    nome: resultSelect.rows[0].responsavel,
                                    site: 'http://' + request.headers.host
                                }, {
                                    success: true,
                                    message: 'Dados atualizados',
                                    data: resultSelect.rows
                                }, callback);
                            } else {
                                callback({
                                    success: true,
                                    message: 'Dados atualizados',
                                    data: resultSelect.rows
                                });
                            }
                        }
                    });
                }
            });
        } else {
            callback({
                success: false,
                message: 'Utilizador sem permissão para alterar os dados.'
            });
        }
    },
    destroyPlano: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        // falta remover a pasta que foi criada no método createPlano
        console.log('destroyPlano: ', params.id);
        var conn = db.connect();
        var sql = 'delete FROM ppgis.plano where id = ' + params.id;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                callback({
                    success: true
                });
            }
        });
    },
    readPlano: function (params, callback, sessionID, request) {
        console.log('readPlano: ');
        console.log(params);
        // var promotor = params.params.idpromotor;
        var promotor = params;
        // ???
        var userid = request.session.userid;
        var conn = db.connect();
        var sql = 'SELECT id, idpromotor, designacao, descricao, responsavel, email, site, inicio, fim, datamodificacao, proposta, idutilizador, ST_AsGeoJSON(the_geom) as the_geom FROM ppgis.plano where idpromotor = ' + promotor + ' and active';
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals from ppgis.plano where idpromotor = ' + promotor + ' and active';
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals // rowsTotal[0].totals
                        });
                    }
                });
            }
        });
    },

    /*
     * 		api : {
     create : 'ExtRemote.DXParticipacao.createPromotor',
     read : 'ExtRemote.DXParticipacao.readPromotor'
     update : 'ExtRemote.DXParticipacao.updatePromotor',
     destroy : 'ExtRemote.DXParticipacao.destroyPromotor'
     },
     */
    createPromotor: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        /*
         createPromotor:  { id: 0,
         designacao: 'Nova entidade',
         email: 'info@entidade.pt',
         site: 'http://www.entidade.pt',
         dataregisto: '2014-11-11T09:13:06',
         logotipo: '' }

         O campo idutilizador não vem, porque tem persitent: false no model
         */

        // criar uma pasta para os uploads deste promotor

        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        console.log('createPromotor: ', params);
        var fields = [], values = [];
        // o primeiro parâmetro é a chave (garantido por paramOrder : 'id', em app/model/Promotor.js)
        // o id vem a 0, quando se insere um registo
        for (var key in params) {
            switch (key) {
                case "id":
                    break;
                case "dataregisto":
                    fields.push(key);
                    values.push('now()');
                    break;
                default:
                    fields.push(key);
                    values.push(params[key]);
                    break;
            }
        }
        fields.push('datamodificacao');
        values.push('now()');
        fields.push('idutilizador');
        values.push(request.session.userid);
        var i = 0, buracos = [];
        for (i = 1; i <= fields.length; i++) {
            buracos.push('$' + i);
        }
        var conn = db.connect();
        conn.query('INSERT INTO ppgis.promotor (' + fields.join() + ') VALUES (' + buracos.join() + ') RETURNING id', values, function (err, resultInsert) {
            db.disconnect(conn);
            if (err) {
                db.debugError(callback, err);
            } else {
                callback({
                    success: true,
                    message: 'Dados atualizados',
                    data: resultInsert.rows
                    // id : resultInsert.rows[0].id
                });
            }
        });
    },
    updatePromotor: function (params, callback, sessionID, request) {
        console.log('Session ID = ' + sessionID, request.session.userid, request.session.groupid);
        var fields = [], values = [], i = 0, id = 0;
        // o primeiro parâmetro é a chave (garantido por paramOrder : 'id', em app/model/Promotor.js)
        // Está a deixar alterar a dataregisto, mas depois a ideia é não deixar
        for (var key in params) {
            // if (i==0 && key == 'id') {
            if (i == 0) {
                id = params[key];
            } else {
                fields.push(key + '= $' + i);
                values.push(params[key]);
            }
            i = i + 1;
        }
        fields.push('datamodificacao = $' + i);
        values.push('now()');
        i = i + 1;
        fields.push('idutilizador = $' + i);
        values.push(request.session.userid);
        if (request.session.userid && request.session.groupid <= 1) {
            var conn = db.connect();
            conn.query('UPDATE ppgis.promotor SET ' + fields.join() + ' WHERE id = ' + id, values, function (err, result) {
                if (err) {
                    console.log('UPDATE =' + sql + ' Error: ' + err);
                    db.debugError(callback, err);
                } else {
                    var sql = 'SELECT * FROM ppgis.promotor where id = ' + id;
                    conn.query(sql, function (err, resultSelect) {
                        db.disconnect(conn);
                        if (err) {
                            console.log('SQL=' + sql + ' Error: ', err);
                            db.debugError(callback, err);
                        } else {
                            callback({
                                success: true,
                                message: 'Dados atualizados',
                                data: resultSelect.rows
                            });
                        }
                    });
                }
            });
        } else {
            callback({
                success: false,
                message: 'Utilizador sem permissão para alterar os dados.'
            });
        }
    },
    destroyPromotor: function (params, callback, sessionID, request) {
        // falta proteger só para grupo admin
        console.log('destroyPromotor: ', params.id);
        var conn = db.connect();
        var sql = 'delete FROM ppgis.promotor where id = ' + params.id;
        conn.query(sql, function (err, result) {
            db.disconnect(conn);
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                callback({
                    success: true
                });
            }
        });
    },
    readPromotor: function (params, callback, sessionID, request) {
        console.log(params);
        // { userid: 31, page: 1, start: 0, limit: 5 }
        var userid = request.session.userid;
        var conn = db.connect();
        var sql = 'SELECT * FROM ppgis.promotor where active';
        conn.query(sql, function (err, result) {
            if (err) {
                console.log('SQL=' + sql + ' Error: ', err);
                db.debugError(callback, err);
            } else {
                //get totals for paging
                var totalQuery = 'SELECT count(*) as totals from ppgis.promotor where active';
                conn.query(totalQuery, function (err, resultTotalQuery) {
                    if (err) {
                        console.log('SQL=' + totalQuery + ' Error: ', err);
                        db.debugError(callback, err);
                    } else {
                        db.disconnect(conn);
                        //release connection
                        console.log('Totais: ', result.rows.length, resultTotalQuery.rows[0].totals);
                        callback({
                            success: true,
                            data: result.rows,
                            total: resultTotalQuery.rows[0].totals // rowsTotal[0].totals
                        });
                    }
                });
            }
        });
    }
};

module.exports = DXParticipacao;
