document.addEventListener("DOMContentLoaded", () => {
    const inputFile = document.getElementById("main_painel_formulario_botoes_anexo_input");
    const labelFile = document.getElementById("main_painel_formulario_botoes_anexo_label");

    if (inputFile && labelFile) {
        inputFile.addEventListener("change", function () {
            if (this.files && this.files.length > 0) {
                labelFile.textContent = this.files[0].name; // mostra o nome do arquivo
            } else {
                labelFile.textContent = "Anexar arquivo"; // volta ao texto padrão
            }
        });
    }
});


function menu_navegacao() {
    const botao_menu = document.getElementById('header_painel_navegacao_fundo_esquerda_menu');
    const navegacao_paginas = document.getElementById('header_painel_navegacao_paginas');

    const aberto = navegacao_paginas.classList.toggle('aberto');

    botao_menu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
}

document.addEventListener('click', function (e) {
  const botao_menu = document.getElementById('header_painel_navegacao_fundo_esquerda_menu');
  const navegacao_paginas = document.getElementById('header_painel_navegacao_paginas');

  // só fecha se o menu estiver aberto
  if (!navegacao_paginas.classList.contains('aberto')) return;

  const clicouDentroDoMenu = navegacao_paginas.contains(e.target);
  const clicouNoBotao = botao_menu.contains(e.target);

  if (!clicouDentroDoMenu && !clicouNoBotao) {
    navegacao_paginas.classList.remove('aberto');
    botao_menu.setAttribute('aria-expanded', 'false');
  }
});

function mostrar_opcoes_lista(setor) {
    const opcoes_listas = document.querySelectorAll('.main_painel_formulario_opcoes_lista');
    opcoes_listas.forEach(section => {
        section.style.display = 'none';
    });

    document.getElementById('main_painel_formulario_opcoes_lista_' + setor).style.display = 'grid';
    document.getElementById('main_painel_formulario_opcoes_lista_' + setor).style.gap = '1svh';
    document.getElementById('main_painel_formulario_opcoes_lista_' + setor).style.gridtemplatecolumns = repeat(1, auto);
    document.getElementById('main_painel_formulario_opcoes_lista_' + setor).style.flexDirection = 'column';
}