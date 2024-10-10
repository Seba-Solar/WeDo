const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

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
app.get('/publicacion',(req,res) => {
  res.sendFile(path.join(__dirname,'views','publicacion_detalle.html'));
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