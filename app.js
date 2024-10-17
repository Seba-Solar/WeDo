const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
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

//Con este use podemos cargar archivos como javascripts personales para cada interaccion de la pagina
app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.get('/', (req, res) => {
  res.redirect('/index');
});
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/publicaciones', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'publicaciones.html'));
});
// app.get('/publicacion',(req,res) => {
//   res.sendFile(path.join(__dirname,'views','publicacion_detalle.html'));
// });
app.get('/crear_publi',(req,res) => {
  res.sendFile(path.join(__dirname,'views','crear_publi.html'));
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


// -------------- REGISTER ---------------- //
app.post('/registrar', (req, res) => {
  const nombre = req.body.nombre;
  const pass = req.body.pass; 
  const correo = req.body.correo;
  const rut = req.body.rut;
  const imagen_p = req.body.imagen_p;
  const telefono = req.body.telefono;
  const direccion = req.body.direccion;

  const query = `INSERT into cliente (nombre, pass, imagen_p, rut, correo, telefono, direccion) 
  VALUES ('${nombre}','${pass}','${imagen_p}','${rut}','${correo}','${telefono}','${direccion}')`;

  conexion.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: 'Error al insertar datos' });
    } else {
      res.redirect('/login');
    }
  });
});

// -------------- LOGIN ---------------- //
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
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

// CREACION DE PUBLICACION CON IMAGENES BLOB USANDO BUFFER PARA GUARDARLAS BINARIAMENTE
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Manejar la ruta para publicar con múltiples imágenes
app.post('/publicar', upload.array('imagenes', 10), (req, res) => {
  const { titulo, descripcion, precioestimado } = req.body;
  const imagenes = req.files; // Array de imágenes como buffers

  // Comenzamos una transacción para garantizar la atomicidad
  conexion.beginTransaction(err => {
      if (err) {
          console.error(err);
          return res.status(500).send({ message: 'Error al iniciar la transacción' });
      }

      // Primero insertamos los datos de la publicación
      const queryPublicacion = 'INSERT INTO PUBLICACION (titulo, descripcion, precio_estimado) VALUES (?, ?, ?)';
      const valuesPublicacion = [titulo, descripcion, precioestimado];

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
                      res.send({ message: 'Publicación y imágenes guardadas exitosamente' });
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

// app.get('/publicacion/detalle/:id',(req,res) =>{

//   const idPublicacion = req.params.id;
//   console.log(idPublicacion)
//   const query = 'SELECT id, titulo, descripcion, precio_estimado FROM publicacion WHERE id = ?';
//   conexion.query(query, idPublicacion,(err,results)=>{
//     if (err){
//       console.error(err);
//       return res.status(500).send({ message: 'Publicacion no encontrada'});
//     }

//      // Suponiendo que results tiene al menos un elemento
//      const publicacion = results[0];

//      // Renderiza la vista con los datos obtenidos
//      res.render('publicacion_detalle', { publicacion });
//   })
// })
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
