let express = require('express');
let location = require('location-href');
let oracledb = require('oracledb');
let util = require('util');
let session = require('express-session');
let crypto = require('crypto');

let router = express.Router();

let configuracion = require('./connection_config');
let config = new configuracion();

/* GET home page. */
router.get('/', (req, res, next) => {
	let error = req.query.error;
	let resp = req.query.resp;
	res.render('seguridad/inicio_sesion', {message: error, response: res, session:req.session});	
});

router.post('/', (req, res, next) => {
	let promise = oracledb.getConnection({
		user          : config.user,
		password      : config.password,
		connectString : config.server
	})
	.then((connection) => {
		let user_name = req.body.user_name;
		let hmac = crypto.createHmac('sha256', 'umg');
    hmac.update(req.body.password_user);
    let password_user = hmac.digest('hex');
    let sql = ""
		+" SELECT "
		+"	USUARIO.ID"
		+"	,USUARIO.ROL_ID"
		+" FROM "
		+"	C##DBA_SEGURIDAD.USUARIO"
  	+" WHERE"
  	+"	USUARIO.NICK_NAME = '"+user_name+"'"
  	+"	AND USUARIO.PASSWORD = '"+password_user+"'"
  	+"	AND USUARIO.ACTIVO = 1"
		connection.execute(sql)
		.then((result) => {
			if(result.rows.length <= 0){
				res.redirect('/?error=1');
			}
			result.rows = result.rows[0];
			req.session.user_id = result.rows[0];
			let tipo_usuario = result.rows[1];
			let table_aux;
			if(tipo_usuario == 1){
				table_aux = 'ALUMNO';
			}
			else{
				table_aux = 'PERSONAL';
			}
			let sql = ""
			+" SELECT "
			+"	USUARIO.ID"
			+"	,"+table_aux+".PRIMER_NOMBRE "
			+"		|| ' ' "
			+"		|| "+table_aux+".SEGUNDO_NOMBRE"
			+"		|| ' ' "
			+"		|| "+table_aux+".PRIMER_APELLIDO "
			+"		|| ' ' "
			+"		|| "+table_aux+".SEGUNDO_APELLIDO AS NOMBRE_USUARIO"
			+"	,ROL.NOMBRE AS NOMBRE_ROL"
			+" FROM "
			+"	C##DBA_SEGURIDAD.USUARIO"
			+"	INNER JOIN C##DBA_UNIVERSIDAD."+table_aux+" ON USUARIO.PERS_ALUMN_REF_ANIO = "+table_aux+".ANIO"
    	+"		AND USUARIO.PERS_ALUMN_REF_CODIGO = "+table_aux+".CODIGO"
    	+"	INNER JOIN C##DBA_SEGURIDAD.ROL ON ROL.ID = USUARIO.ROL_ID"
    	+" WHERE"
    	+"	USUARIO.ID = "+req.session.user_id
    	+"	AND USUARIO.ACTIVO = 1"
    	+"	AND ROL.ACTIVO = 1";
			connection.execute(sql)
			.then((result) => {
				if(result.rows.length <= 0){
					res.redirect('/?error=2');
				}
				result.rows = result.rows[0];
				req.session.user_name = result.rows[1];
				req.session.perfil = result.rows[2];
				sql = ""
				+" SELECT"
				+"	OPCION.ID AS ID_OPCION"
				+"	,OPCION.NOMBRE AS NOMBRE_OPCION"
				+"	,OPCION.URL AS LINK_OPCION"
				+" FROM C##DBA_SEGURIDAD.USUARIO"
				+"	INNER JOIN C##DBA_SEGURIDAD.ASIG_ROL_OPCION ON ASIG_ROL_OPCION.ROL_ID = USUARIO.ROL_ID"
				+"	INNER JOIN C##DBA_SEGURIDAD.OPCION ON OPCION.ID = ASIG_ROL_OPCION.OPCION_ID"
				+" WHERE"
				+"	USUARIO.ID = "+req.session.user_id
				+"	AND USUARIO.ACTIVO = 1"
				+"	AND OPCION.NIVEL = 0"
				+"	AND OPCION.ACTIVO = 1"
				+"	AND ASIG_ROL_OPCION.ACTIVO = 1";////
				connection.execute(sql)
				.then((result) => {
					if(result.rows.length <= 0){
						res.redirect('/?resp=privil');
					}
					let data_menu = [];
					for(i = 0; i < result.rows.length; i++){
						data_menu.push({id: result.rows[i][0], nombre: result.rows[i][1], url: result.rows[i][2]});
					}
					let envia = false;
					for(i = 0; i < data_menu.length; i++){
						let parent = data_menu[i].id;
						let position = i;
						sql = ""
						+" SELECT "
						+"	OPCION.ID AS ID_OPCION"
						+"	,OPCION.NOMBRE AS NOMBRE_OPCION"
						+"	,OPCION.URL AS LINK_OPCION"
						+" FROM C##DBA_SEGURIDAD.OPCION"
						+" WHERE"
						+"	OPCION.OPCION_ID = "+parent
						+"	AND OPCION.NIVEL = 1"
						+"	AND OPCION.ACTIVO = 1";
						connection.execute(sql)
						.then((result) => {
							if(result.rows.length > 0){
								let array_aux = [];
								for(j = 0; j < result.rows.length; j++){
									array_aux.push({id: result.rows[j][0], nombre: result.rows[j][1], url: result.rows[j][2]});
								}
								data_menu[position].sub_menu = array_aux;
							}
							if(position+1 == data_menu.length){
								req.session.options = data_menu;
								let url = req.query.url;
								if(typeof(url) != 'undefined'){
									res.redirect(location() + url);
								}
								else{
									res.redirect(location() + '/Universidad');		
								}
							}
						})
						.catch((error) => {
							res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
						});
					}
				})
				.catch((error) => {
					res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
				});
			})
			.catch((error) => {
				res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
			});
		})
		.catch((error) => {
			res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
		});
	})
	.catch((error) => {
		res.send('Error al tratar de conectarse con la base de datos!<br>' + error.message);
	});
});

router.get('/log_out', (req, res, next) => {
	if(typeof req.session.user_id === "undefined"){
		res.redirect('/?resp=auth');
	}
	req.session.destroy();
	res.redirect('/?resp=out');
});

router.get('/get/municipios', (req, res, next) => {
	let promise = oracledb.getConnection({
		user          : config.user_universidad,
		password      : config.password,
		connectString : config.server
	})
	.then((connection) => {
		let departamento = req.query.dep;
		let sql = ""
		+" SELECT"
		+"	MUNICIPIO.ID AS ID_MUNICIPIO"
		+"	,MUNICIPIO.NOMBRE AS NOMBRE_MUNICIPIO"
		+" FROM"
		+"	C##DBA_UNIVERSIDAD.MUNICIPIO"
		+" WHERE"
		+"	MUNICIPIO.ACTIVO = 1"
		+"	AND MUNICIPIO.DEPARTAMENTO_ID = " + departamento;
		connection.execute(sql)
		.then((result) => {
			if(result.rows.length <= 0){
				res.send('No hay datos!');
			}
			else{
				let municipio = [];
				for(i = 0; i < result.rows.length; i++){
					municipio.push({id: result.rows[i][0], nombre: result.rows[i][1]});
				}
				res.send(municipio);
			}
		})
		.catch((error) => {
			res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
		});
	})
	.catch((error) => {
		res.send('Error al tratar de conectarse con la base de datos!<br>' + error.message);
	});
});

router.get('/universidad/consulta/alumno', (req, res, next) => {
	let promise = oracledb.getConnection({
		user          : config.user_universidad,
		password      : config.password,
		connectString : config.server
	})
	.then((connection) => {
		let code = req.query.codigo;
		let an= req.query.anio;
		let sql = ""
		+" SELECT" 
		+" ALUMNO.PRIMER_NOMBRE, ALUMNO.PRIMER_APELLIDO AS NOMBRE_PARQUEO FROM C##DBA_UNIVERSIDAD.ALUMNO"
		+" WHERE ALUMNO.CODIGO = "+code+" AND ALUMNO.ANIO = "+an;
		connection.execute(sql)
		.then((result) => {
			if(result.rows.length <= 0){
				res.send('No hay datos!');
			}
			else{
				let dparqueo = [];
				for(i = 0; i < result.rows.length; i++){
					dparqueo.push({Nombre: result.rows[i][0], Apellido: result.rows[i][1]});
				}
				res.send(dparqueo);
			}
		})
		.catch((error) => {
			res.send('Error al ejecutar la query!<br>' + error.message + "<br>sql: " + sql);
		});
	})
	.catch((error) => {
		res.send('Error al tratar de conectarse con la base de datos!<br>' + error.message);
	});
});




module.exports = router;
