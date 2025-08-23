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


// ================== DEBUG ==================
const DEBUG_SHEETS = true;
function log(...args){ if (DEBUG_SHEETS) console.log('[AUT]', ...args); }
function warn(...args){ if (DEBUG_SHEETS) console.warn('[AUT]', ...args); }


// ================== MÁSCARA / SANITIZAÇÃO CPF ==================
function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

function sanitizarCPF(cpf) {
  return String(cpf || '').replace(/\D/g, '');
}

// converte valor da planilha (string ou number) para 11 dígitos
function normalizarCPFDoSheets(val) {
  if (val == null) return '';
  if (typeof val === 'number') {
    // se veio como número, pode ter perdido zeros à esquerda → padStart
    return String(Math.trunc(val)).padStart(11, '0');
  }
  // se veio como string, tira tudo que não é dígito
  const dig = String(val).replace(/\D/g, '');
  // se tiver menos de 11 e parecer número, também padStart
  return dig.length < 11 ? dig.padStart(11, '0') : dig;
}

document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('main_painel_autenticacao_cpf');
  if (input) {
    input.addEventListener('input', function (event) {
      event.target.value = formatarCPF(event.target.value);
    });
  }
});


// ================== UI DE ALERTA ==================
function setAlerta(msg = '', cor = 'red') {
  const p = document.getElementById('main_painel_autenticacao_alerta');
  if (!p) return;
  p.textContent = msg;
  p.style.display = msg ? 'flex' : 'none';     // importante: flex para centralizar vertical
  p.style.alignItems = 'center';
  p.style.justifyContent = 'center';
  if (cor === 'red') {
    p.style.color = 'var(--var_cor_branco)';
    p.style.backgroundColor = 'red';
  } else if (cor === 'green') {
    p.style.color = 'var(--var_cor_branco)';
    p.style.backgroundColor = 'green';
  } else {
    p.style.backgroundColor = 'transparent';
  }
}


// ================== SHEETS (GViz JSONP) ==================
function gvizJSONP({ sheetId, tq, sheet, gid, onData, onError }) {
  const cb = 'cb_' + Math.random().toString(36).slice(2);
  const params = [
    'tqx=' + encodeURIComponent(`out:json;responseHandler:${cb}`),
    'tq=' + encodeURIComponent(tq || 'select *')
  ];
  if (sheet) params.push('sheet=' + encodeURIComponent(sheet));
  if (gid !== undefined && gid !== null) params.push('gid=' + encodeURIComponent(gid));

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?` + params.join('&');
  log('Chamando Sheets GViz:', url);

  window[cb] = (data) => {
    try {
      if (!data || data.status === 'error' || !data.table) {
        warn('Resposta inválida do GViz:', data);
        const err = (data && data.errors && data.errors[0]) ? data.errors[0] : { message: 'Resposta sem table' };
        onError?.(err, data);
      } else {
        onData?.(data);
      }
    } finally {
      delete window[cb];
      script.remove();
    }
  };

  const script = document.createElement('script');
  script.src = url;
  script.onerror = () => { onError?.(new Error('Falha ao carregar JSONP')); delete window[cb]; };
  document.head.appendChild(script);
}

function parseTableToObjects(table) {
  let cols = (table.cols || []).map(c => (c.label || c.id || '').trim());
  let rows = (table.rows || []).map(r => r.c.map(c => (c ? c.v : null)));

  // LOGS
  log('Colunas (brutas) do GViz:', cols);
  if (rows.length) log('Primeira linha (valores brutos):', rows[0]);

  // Detecta se os rótulos são genéricos (A, B, C, D, ...)
  const genericos = cols.length > 0 && cols.every(c => /^[A-Z]+$/.test(c));

  if (genericos && rows.length) {
    // 1) Tenta usar a primeira linha como cabeçalho "de verdade"
    const headerCandidate = rows[0].map(v => (v == null ? '' : String(v).trim()));
    const temCabecalhoValido =
      headerCandidate.some(v => /cpf/i.test(v)) ||
      headerCandidate.some(v => /nome/i.test(v)) ||
      headerCandidate.some(v => /telefone/i.test(v)) ||
      headerCandidate.some(v => /tipo.*cargo/i.test(v));

    if (temCabecalhoValido) {
      cols = headerCandidate.map((h, i) => h || cols[i]);
      rows = rows.slice(1); // remove a linha de cabeçalho dos dados
      log('Cabeçalho detectado a partir da primeira linha:', cols);
    } else {
      // 2) Mapeamento fixo para a aba AUTENTICACAO (A,B,C,D)
      const mapping = { A: 'TIPO_CARGO', B: 'NOME', C: 'CPF', D: 'TELEFONE' };
      cols = cols.map(c => mapping[c] || c);
      log('Aplicado mapeamento fixo A→TIPO_CARGO, B→NOME, C→CPF, D→TELEFONE:', cols);
    }
  }

  const objetos = rows.map(row => Object.fromEntries(cols.map((c, i) => [c || `col_${i}`, row[i]])));
  log('Total de linhas parseadas:', objetos.length, 'Exemplo (até 5):', objetos.slice(0, 5));
  return objetos;
}

// encontra a chave/cabeçalho que representa o CPF (tenta variações)
function obterChaveCPF(obj) {
  const keys = Object.keys(obj);
  const candidato = keys.find(k => k.trim().toLowerCase().replace(/\s+/g,'') === 'cpf');
  if (candidato) return candidato;
  // planos B (às vezes vem "CPF " com espaço, etc.)
  const fallback = keys.find(k => k.toLowerCase().includes('cpf'));
  return fallback || 'CPF';
}


// ================== AUTENTICAÇÃO NO SHEETS ==================
async function buscarColaboradorPorCPF(cpfDigits) {
  const SHEET_ID = '1RZunfCM7nKOyWXcNh42v2WEpPHsGSBqdRN55h7u3MNM';

  // 1) tenta por nome da aba
  const porNome = await new Promise((resolve) => {
    gvizJSONP({
      sheetId: SHEET_ID,
      sheet: 'AUTENTICACAO',
      tq: 'select *',
      onData: (data) => {
        const linhas = parseTableToObjects(data.table);
        resolve({ ok: true, linhas });
      },
      onError: (err) => {
        warn('Erro consultando por nome de aba AUTENTICACAO:', err);
        resolve({ ok: false, linhas: [] });
      }
    });
  });

  let linhas = porNome.ok ? porNome.linhas : [];

  // 2) se falhou/zerado, tenta fallback no gid=0 (primeira aba)
  if (!linhas.length) {
    const porGid0 = await new Promise((resolve) => {
      gvizJSONP({
        sheetId: SHEET_ID,
        gid: 0,
        tq: 'select *',
        onData: (data) => {
          const linhas2 = parseTableToObjects(data.table);
          resolve({ ok: true, linhas: linhas2 });
        },
        onError: (err) => {
          warn('Erro consultando por gid=0:', err);
          resolve({ ok: false, linhas: [] });
        }
      });
    });
    if (porGid0.ok) linhas = porGid0.linhas;
  }

  if (!linhas.length) {
    warn('Nenhuma linha retornada da planilha.');
    return null;
  }

  // detecta chave CPF na primeira linha
  const chaveCPF = obterChaveCPF(linhas[0]);
  log('Chave CPF detectada:', chaveCPF);

  // procura o CPF
  const alvo = String(cpfDigits);
  for (let i = 0; i < linhas.length; i++) {
    const row = linhas[i];
    const cpfRow = normalizarCPFDoSheets(row[chaveCPF]);
    log(`Comparando linha ${i}: planilhaCPF=${cpfRow} vs input=${alvo}`);
    if (cpfRow && cpfRow === alvo) {
      log('CPF encontrado na linha', i, row);
      return row;
    }
  }

  warn('CPF não encontrado na planilha.');
  return null;
}


// ================== FLUXO DE AUTENTICAÇÃO ==================
function sucesso_validacao(colaborador) {
  // guarda objeto completo
  const obj = {
    tipo_cargo: colaborador['TIPO_CARGO'] || colaborador['tipo_cargo'] || '',
    nome: colaborador['NOME'] || colaborador['nome'] || '',
    cpf: normalizarCPFDoSheets(colaborador['CPF'] ?? colaborador['cpf']),
    telefone: colaborador['TELEFONE'] || colaborador['telefone'] || ''
  };
  localStorage.setItem('colaborador', JSON.stringify(obj));

  // compatibilidade: também guarda só o cpf (como seu código antigo fazia)
  localStorage.setItem('cpf_colaborador', JSON.stringify(obj.cpf));

  window.location.href = 'menu_colaborador.html';
}

function erro_validacao(msg = 'CPF inválido ou não encontrado.') {
  setAlerta(msg, 'red');
}

async function validacao_cpf_colaborador() {
  try {
    setAlerta('Validando CPF...', 'green');

    const input = document.getElementById('main_painel_autenticacao_cpf');
    const cpfFormatado = input ? input.value : '';
    const cpfDigits = sanitizarCPF(cpfFormatado);

    log('CPF digitado (sanitizado):', cpfDigits);

    // validação mínima (11 dígitos)
    if (!cpfDigits || cpfDigits.length !== 11) {
      erro_validacao('Informe um CPF válido');
      return;
    }

    const colaborador = await buscarColaboradorPorCPF(cpfDigits);

    if (colaborador) {
      setAlerta('', '');
      sucesso_validacao(colaborador);
    } else {
      erro_validacao('CPF não autenticado');
    }
  } catch (e) {
    console.error('Erro na autenticação:', e);
    erro_validacao('Erro ao validar. Tente novamente.');
  }
}
