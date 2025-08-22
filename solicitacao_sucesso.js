// ================== MENU NAV ==================
function menu_navegacao() {
  const botao_menu = document.getElementById('header_painel_navegacao_fundo_esquerda_menu');
  const navegacao_paginas = document.getElementById('header_painel_navegacao_paginas');

  const aberto = navegacao_paginas.classList.toggle('aberto');
  botao_menu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
}

document.addEventListener('click', function (e) {
  const botao_menu = document.getElementById('header_painel_navegacao_fundo_esquerda_menu');
  const navegacao_paginas = document.getElementById('header_painel_navegacao_paginas');

  if (!navegacao_paginas.classList.contains('aberto')) return;

  const clicouDentroDoMenu = navegacao_paginas.contains(e.target);
  const clicouNoBotao = botao_menu.contains(e.target);

  if (!clicouDentroDoMenu && !clicouNoBotao) {
    navegacao_paginas.classList.remove('aberto');
    botao_menu.setAttribute('aria-expanded', 'false');
  }
});
