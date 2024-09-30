const defaultFile = 'https://static.vecteezy.com/system/resources/thumbnails/000/495/460/small/22_Profile.jpg'

const file = document.getElementById('foto');
const img = document.getElementById('imagen_p');
file.addEventListener('change', e =>{
    if (e.target.files[0]){
        const reader = new FileReader();
        reader.onload = function (e){
            img.src = e.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }else{
        img.src = defaultFile;
    }
}); 