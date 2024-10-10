document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const nombre = document.getElementById('usuario').value;
    const correo = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const rut = document.getElementById('rut').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;
    const imagen_p = document.getElementById('foto').value;
    const errorMessage = document.getElementById('errorMessage');

    // Limpiar el mensaje de error
    // errorMessage.textContent = '';

    // Validaciones (opcional)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(correo)) {
        errorMessage.textContent = 'El correo electrónico no es válido.';
        return;
    }

    // Enviar los datos al servidor
    fetch('http://localhost:3000/registrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, pass, correo, rut, imagen_p, telefono, direccion })
    }).then(response => response.json())
    .then(data => {
        errorMessage.textContent = 'Registro Correcto';
        setTimeout(() => {
            window.location.href = '/';
        },2000);}).catch(error => {
        errorMessage.textContent = 'Algo falló, intenta nuevamente';
    });
});