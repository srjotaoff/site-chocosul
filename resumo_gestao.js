const colaboradorStr = localStorage.getItem('colaborador');

const colaborador = JSON.parse(colaboradorStr) || {};
COLABORADOR = colaborador;

nome_usuario = colaborador.nome || '';
tipoCargo = colaborador.tipo_cargo || '';
cpf_usuario = colaborador.cpf || '';
contato_usuario = colaborador.telefone || '';



function iframe() {
    var largura = window.innerWidth
    var altura = window.innerHeight
    var iframe = document.createElement('iframe')

    iframe.setAttribute('width', largura)
    iframe.setAttribute('height', altura)
    iframe.setAttribute('src', 'https://lookerstudio.google.com/embed/reporting/f888ed24-0ed5-472a-b53c-7320d96ba3e5/page/ikvXD?params=%7B%22df166%22:%22include%25EE%2580%25800%25EE%2580%2580IN%25EE%2580%2580' + cpf_usuario + '%22%7D')
    
    return iframe
}


function redimensionar() {
    var iframeElement = iframe()
    var main = document.querySelector('main')

    main.innerHTML = ''
    main.appendChild(iframeElement)
}

document.addEventListener('DOMContentLoaded', function() {
    redimensionar()
})