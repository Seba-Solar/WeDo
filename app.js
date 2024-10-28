const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

//Para Guardar la memoria y su buffer de imagenes
//Multer Storage y Upload
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Para usar json
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

//Habilitamos el motor de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

//Carga de los estaticos
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a la base de datos
let conexion = mysql.createConnection({
    host: "localhost",
    database: "wedo",
    user: "root",
    password: ""
});

conexion.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//Hacer uso de la sesiones
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


//Middelware para controlar el acceso a las paginas solamente si el usuario esta logeado
function isLoggedIn(req, res, next) {
  if (req.session.loggedin) {
      next();  
  } else {
      res.redirect('/login');
  }
}

app.post('/auth', function(request, response) {
	let correo = request.body.correo;
	let pass = request.body.pass;

	if (correo && pass) {
		conexion.query('SELECT * FROM cliente WHERE correo = ? AND pass = ?', [correo, pass], function(error, results) {
			if (error) throw error;

			if (results.length > 0) {
				
				request.session.loggedin = true;
				request.session.correo = correo;
				request.session.userId = results[0].id;
				request.session.nombre = results[0].nombre;
				
				return response.redirect('/publicaciones'); 
			} else {
				
				conexion.query('SELECT * FROM empresa WHERE correo = ? AND pass = ?', [correo, pass], function(error, results) {
					if (error) throw error;

					if (results.length > 0) {
						// Company credentials are valid
						request.session.loggedin = true;
						request.session.isEmpresa = true;
						request.session.correo = correo;
						request.session.userId = results[0].id;
						request.session.nombre = results[0].nombre;

						return response.redirect('/publicaciones');
					} else {
						
						return response.send('Credenciales inválidas'); 
					}
				});
			}
		});
	} else {
		response.send('Por favor ingresa ambos campos');
	}
});

// Cerrar session
app.get('/logout', function (req, res, next) {
  req.session.user = null
  req.session.save(function (err) {
    if (err) next(err)
    req.session.regenerate(function (err) {
      if (err) next(err)
      res.redirect('/')
    })
  })
});

// Routing
app.get('/', (req, res) => {
  res.redirect('/index');
});
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/profile',isLoggedIn, (req, res) => {
  let usuario = {
    correo: req.session.correo,
    nombre: req.session.nombre,
    id_usuario: req.session.userId
  };
  console.log('ID USUARIO',usuario.id_usuario);

  //Query para cargar los datos que corresponden al usuario que ingreso.
  const queryPublicacionesPorId = ' SELECT * FROM publicacion WHERE id_cliente = ? OR id_empresa = ?'
  conexion.query(queryPublicacionesPorId,[usuario.id_usuario, usuario.id_usuario], (err, results) =>{
    if  (err ) {
      console.error(err);
    } else if (results.length === 0 ){
      console.log({ message: 'No tiene publicaciones ligada a la cuenta'});
    }
    
    const publicacionesRelacionadas = results;
    res.render('profile', { usuario , publicacionesRelacionadas });
  });
  // conexion.query(queryImagen,[publicacionesRelacionadas.id], (err,results)=>{
  //   if  (err ) {
  //     console.err(err);
  //   }
  //   const imagen = results[0];
  // });
  
});


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/publicaciones',isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'publicaciones.html'));
});
app.get('/crear_publi', isLoggedIn, (req,res) => {
  res.sendFile(path.join(__dirname,'views','crear_publi.html'));
});
app.get('/registrar_empresa',(req,res)=>{
  res.sendFile(path.join(__dirname,'views','register_empresa.html'));
});

//END-POINTS


// ------------------------ END-POINT CLIENTE ------------------ //
app.get('/getClientes', (req, res) => {
  const query = 'SELECT * FROM CLIENTE';
  conexion.query(query, (err, results) => {
    if (err) {  
      console.error(err);
      res.status(500).send({ message: 'Error al obtener datos' });
      console.log(req.query);
    } else {
      res.json(results)
      
    }
  });
});

app.get('/getEmpresas', (req, res) => {
  const query = 'SELECT * FROM EMPRESA';
  conexion.query(query, (err, results) => {
    if (err) {  
      console.error(err);
      res.status(500).send({ message: 'Error al obtener datos' });
      console.log(req.query);
    } else {
      res.json(results)
      
    }
  });
});

app.get('/getPublicaciones', (req, res) => {
  const query = 'SELECT * FROM PUBLICACION';
  conexion.query(query, (err, results) => {
    if (err) {  
      console.error(err);
      res.status(500).send({ message: 'Error al obtener datos' });
      console.log(req.query);
    } else {
      res.json(results)
      
    }
  });
});

app.get('/getPublicaciones/:titulo', (req, res) => {
  const nombre = req.params.titulo;
  const query = 'SELECT * FROM PUBLICACION WHERE titulo = ?';

  conexion.query(query, [nombre], (err, results) => {
    if (err) {  
      console.error(err);
      res.status(500).send({ message: 'Error al obtener datos' });
    } else if (results.length === 0) {
      res.status(404).send({ message: 'Publicación no encontrada' });
    } else {
      res.send(results);
    }
  });
});
// --------------- Fin de End-Points





// -------------- REGISTER ---------------- //
app.post('/registrar', upload.single('imagen_p'), (req, res) => {
  
  const nombre = req.body.usuario;
  const pass = req.body.pass; 
  const correo = req.body.email;
  const rut = req.body.rut;
  const telefono = req.body.telefono;
  const direccion = req.body.direccion;

  
  const imagen_p = req.file ? req.file.buffer : null;

  
  if (!imagen_p) {
    return res.status(400).send({ message: 'Se requiere una imagen de perfil' });
  }

  const query = `INSERT INTO cliente (nombre, pass, imagen_p, rut, correo, telefono, direccion) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const values = [nombre, pass, imagen_p, rut, correo, telefono, direccion];

  conexion.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'Error al insertar datos' });
    } else {
      res.redirect('/login');
    }
  });
});

// -------------- REGISTER ---------------- //
app.post('/registrar_empresa_datos', upload.single('imagen_p'), (req, res) => {
  
  const nombre = req.body.nombre;
  const pass = req.body.pass; 
  const correo = req.body.email;
  const rut_empresa = req.body.rut;
  const telefono = req.body.telefono;
  const direccion = req.body.direccion;
  const razon = req.body.razon;

  
  const imagen_p = req.file ? req.file.buffer : null;

  
  if (!imagen_p) {
    return res.status(400).send({ message: 'Se requiere una imagen de perfil' });
  }

  const query = `INSERT INTO empresa (nombre, pass, imagen_p, rut, correo, telefono, direccion, razon) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [nombre, pass, imagen_p, rut_empresa, correo, telefono, direccion, razon];

  conexion.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'Error al insertar datos' });
    } else {
      res.redirect('/login');
    }
  });
});


// Update de datos del usuario
// app.post('/update_profile', (req,res) =>{
//   //Query de usuario
//   let profile_form_data = {
//     nombre: xxx,
//     correo: xxx,
//     pass: xxx,
//     telefono: xxx,
//     direccion: xxx,
//     imagen_p: xxxx
//   }
//   const queryUpdateUser = `UPDATE cliente SET nombre = ${profile_form
//     _data.nombre}, pass, imagen_p, rut, correo, telefono, direccion`;
//   //Retorno
// });



// PUBLICAR

app.post('/publicar', upload.array('imagenes', 10),isLoggedIn, (req, res) => {
  const { titulo, descripcion, precioestimado } = req.body;
  const imagenes = req.files; // Array de imágenes como buffers
  let usuario = {
    correo: req.session.correo,
    nombre: req.session.nombre,
    id_usuario: req.session.userId
  };
  // Comenzamos una transacción para garantizar la atomicidad
  conexion.beginTransaction(err => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al iniciar la transacción' });
      }

      // Primero insertamos los datos de la publicación
      const queryPublicacion = 'INSERT INTO PUBLICACION (titulo, descripcion, precio_estimado, id_cliente, nombre_cliente) VALUES (?, ?, ?, ?, ?)';
      const valuesPublicacion = [titulo, descripcion, precioestimado,usuario.id_usuario,usuario.nombre];

      conexion.query(queryPublicacion, valuesPublicacion, (err, results) => {
          if (err) {
              console.error(err);
              return conexion.rollback(() => {
                  res.status(500).send({ message: 'Error al guardar la publicación' });
              });
          }

          const publicacionId = results.insertId; // Obtener el ID de la publicación insertada

          // Insertar las imágenes relacionadas
          const queryImagen = 'INSERT INTO IMAGENES (publicacion_id, imagen) VALUES (?, ?)';
          const promises = imagenes.map(imagen => {
              return new Promise((resolve, reject) => {
                  const valuesImagen = [publicacionId, imagen.buffer];
                  conexion.query(queryImagen, valuesImagen, (err, results) => {
                      if (err) {
                          return reject(err);
                      }
                      resolve(results);
                  });
              });
          });

          // Ejecutar todas las promesas de inserción de imágenes
          Promise.all(promises)
              .then(() => {
                  // Confirmar la transacción si todo ha ido bien
                  conexion.commit(err => {
                      if (err) {
                          return conexion.rollback(() => {
                              res.status(500).send({ message: 'Error al confirmar la transacción' });
                          });
                      }
                      res.redirect('/publicaciones');
                  });
              })
              .catch(err => {
                  console.error(err);
                  conexion.rollback(() => {
                      res.status(500).send({ message: 'Error al guardar las imágenes' });
                  });
              });
      });
  });
});

// Ruta para obtener todas las imágenes de una publicación específica
app.get('/publicacion/:id/imagenes',isLoggedIn, (req, res) => {
  const publicacionId = req.params.id;

  // Consulta para obtener las IDs de las imágenes de la publicación
  const query = 'SELECT id FROM IMAGENES WHERE publicacion_id = ?';
  conexion.query(query, [publicacionId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al obtener las imágenes' });
      }

      // Si no se encuentran imágenes
      if (results.length === 0) {
          return res.status(404).send({ message: 'No se encontraron imágenes para esta publicación' });
      }

      // Enviar las IDs de las imágenes en formato JSON
      res.json(results);
  });
});

// Ruta para obtener las imágenes de una publicación
app.get('/imagen/:id' , isLoggedIn,(req, res) => {
  const imagenId = req.params.id;

  const query = 'SELECT imagen FROM IMAGENES WHERE publicacion_id = ?';
  conexion.query(query, [imagenId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al obtener la imagen' });
      }
      
      if (results.length === 0) {
          return res.status(404).send({ message: 'Imagen no encontrada' });
      }

     
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(results[0].imagen);
  });
});

app.get('/publicacion/detalle/:id', isLoggedIn,(req, res) => {
  const idPublicacion = req.params.id;

  const queryPublicacion = 'SELECT id, titulo, descripcion, precio_estimado FROM publicacion WHERE id = ?';
  const queryImagen = 'SELECT imagen FROM IMAGENES WHERE publicacion_id = ?'; // Cambia esto si es necesario

  conexion.query(queryPublicacion, [idPublicacion], (err, resultadosPublicacion) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al obtener la publicación' });
      }

      if (resultadosPublicacion.length === 0) {
          return res.status(404).send({ message: 'Publicación no encontrada' });
      }

      const publicacion = resultadosPublicacion[0];

      conexion.query(queryImagen, [idPublicacion], (err, resultadosImagen) => {
          if (err) {
              console.error(err);
              return res.status(500).send({ message: 'Error al obtener las imágenes' });
          }

          // Extraer las imágenes
          const imagenes = resultadosImagen.map(row => row.imagen);

          res.render('publicacion_detalle', { publicacion, imagenes });
      });
  });
});
app.get('/borrar_publicacion/:id', isLoggedIn,(req, res)=>{
  //Guardamos el id de la publicacion en un parametro para acceder a ella
  const idPublicacion = req.params.id;
  const queryDeletePublicacion = 'DELETE FROM publicacion WHERE id = ?';
  const queryDeleteImagenesPublicacion ='DELETE FROM imagenes WHERE publicacion_id = ?';

  //Primero se elimina las imagenes por relacion.
  conexion.query(queryDeleteImagenesPublicacion, [idPublicacion], (err) => {
    if (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error al eliminar la imagen las imágenes' });
    }
  });
  conexion.query(queryDeletePublicacion, [idPublicacion], (err) => {
    if (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error al eliminar la imagen las imágenes' });
    }
  });
  res.redirect('/publicaciones');
});