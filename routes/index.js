var express = require('express');
var router = express.Router();
let oracledb = require('oracledb');

let configuracion = require('./connection_config');
let config = new configuracion();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Log In' });
});

router.get('/guia', function(req, res, next) {
  res.render('guia', { title: 'Guia' });
});

router.get('/inicio', function(req, res, next) {
  res.render('inicio', { title: 'Bienvenido' });
});

router.get('/precio', function(req, res, next) {
  res.render('precio', { title: 'Precios' });
});


router.get('/service', function(req, res, next) {
  res.render('service', { title: 'Servicios' });
});
router.get('/dservice', function(req, res, next) {
  res.render('dservice', { title: 'Detalle Servicios' });
});

router.get('/users', function(req, res, next) {
  res.render('users', { title: 'Usuarios' });
});
router.get('/in-client', function(req, res, next) {
  res.render('in-client', { title: 'In-Cliente' });
});

router.get('/cuenta', function(req, res, next) {
  oracledb.getConnection({
	  user          : config.user_universidad,
      password      : config.password,
      connectString : config.server
	})
	.then((connection)=>{

		let sql=""
			+" SELECT"
			+" (PARQUEO.CAPACIDAD - (SELECT COUNT(*) FROM C##DBA_UNIVERSIDAD.A_PARQUEO WHERE STATUS = 1 AND A_PARQUEO.ID_PARQUEO = PARQUEO.ID_PARQUEO)) AS DISPONIBLES"
			+",ID_PARQUEO, DESCRIPCION, CAPACIDAD"
			+" FROM"		
			+" C##DBA_UNIVERSIDAD.PARQUEO"
			+" INNER JOIN C##DBA_UNIVERSIDAD.CENTRO_UNIVERSITARIO ON CENTRO_UNIVERSITARIO.ID = C##DBA_UNIVERSIDAD.PARQUEO.ID_SEDE"
			+" INNER JOIN C##DBA_UNIVERSIDAD.PERSONAL ON PERSONAL.CENTRO_UNIVERSITARIO_ID = CENTRO_UNIVERSITARIO.ID"
			+" INNER JOIN C##DBA_SEGURIDAD.USUARIO ON USUARIO.PERS_ALUMN_REF_ANIO = PERSONAL.ANIO AND USUARIO.PERS_ALUMN_REF_CODIGO = PERSONAL.CODIGO"
			+" WHERE"
			+" (PARQUEO.CAPACIDAD - (SELECT COUNT(*) FROM C##DBA_UNIVERSIDAD.A_PARQUEO WHERE STATUS = 1 AND A_PARQUEO.ID_PARQUEO = PARQUEO.ID_PARQUEO)) != 0"
			+" AND USUARIO.ID = "+req.session.user_id;
      console.log(sql)
      connection.execute(sql)
      .then((result) => {

        if(result.rows.length <= 0){
          res.render('universidad/parqueo/asigna_parqueo', {
            title: 'Asignación de Parqueo'
            ,session: req.session}
          ); 
        }
        else{
          let aparqueo = [];
          for(i = 0; i < result.rows.length; i++){
            aparqueo.push({Capacidad: result.rows[i][0], Codigo_Parqueo: result.rows[i][1], Descripcion: result.rows[i][2], Disponibles: result.rows[i][3] });
            if(i+1==result.rows.length){
            	res.render('cuenta', {
                            title: 'cuenta'
                            ,session: req.session
                            ,parqueo: aparqueo}
                          );

            }
          }
        }
	 })
	})
  //res.render('cuenta', { title: 'Cuentas' });
});


module.exports = router;
