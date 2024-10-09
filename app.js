const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// // Conexión a la base de datos
// let conexion = mysql.createConnection({
//     host: "localhost",
//     database: "wedo",
//     user: "root",
//     password: ""
// });

// conexion.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

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