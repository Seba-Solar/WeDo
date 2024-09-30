const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const path = require('path');
// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola, Mundo!');
});

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

app.use(express.static(path.join(__dirname, 'public')));

// Profile

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});