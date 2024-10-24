const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

//Para la creacion de imagenes y guardar la memoria y su buffer usaremos
//Multer Storage y Upload
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Middleware para analizar el cuerpo de las solicitudes JSON
app.use(express.json());
// Para cargar los detalles de las publicaciones
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

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

//Carga de los estaticos
app.use(express.static(path.join(__dirname, 'public')));
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

//Necesarios para manipular la session del usuario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth', function(request, response) {
	// Capture the input fields
	let correo = request.body.correo;
	let pass = request.body.pass;
	// Ensure the input fields exists and are not empty
	if (correo && pass) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		conexion.query('SELECT * FROM cliente WHERE correo = ? AND pass = ?', [correo, pass], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.correo = correo;
        request.session.userId = results[0].id;
        request.session.nombre = results[0].nombre;
				// Redirect to home page
				response.redirect('/publicaciones');
			} else {
				response.send('Verifica que las credenciales esten bien!');
			}			
			response.end();
		});
	} else {
		response.send('Porfavor ingresa ambos campos');
		response.end();
	}
});


// Routing
app.get('/', (req, res) => {
  res.redirect('/index');
});
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
// Acceso con las variables del usuario
app.get('/profile',isLoggedIn, (req, res) => {
  let usuario = {
    correo: req.session.correo,
    nombre: req.session.nombre,
    id_usuario: req.session.userId
  };
  
  console.log('ID USUARIO',usuario.id_usuario);
  res.render('profile', { usuario });
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
      res.send(results);
      
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
      res.send(results);
      
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
  
  const nombre = req.body.usuario;
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

  const query = `INSERT INTO empresa (nombre, pass, imagen_p, rut_empresa, correo, telefono, direccion, razon) 
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

app.post('/publicar', upload.array('imagenes', 10), (req, res) => {
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
app.get('/publicacion/:id/imagenes', (req, res) => {
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
app.get('/imagen/:id', (req, res) => {
  const imagenId = req.params.id;

  const query = 'SELECT imagen FROM IMAGENES WHERE id = ?';
  conexion.query(query, [imagenId], (err, results) => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al obtener la imagen' });
      }
      
      if (results.length === 0) {
          return res.status(404).send({ message: 'Imagen no encontrada' });
      }

      // Configurar el tipo de contenido adecuado (en este caso asumimos que es imagen JPEG)
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(results[0].imagen);
  });
});

app.get('/publicacion/detalle/:id', (req, res) => {
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
