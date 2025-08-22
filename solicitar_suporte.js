// ================== DADOS DO USUÁRIO ==================
const cpf_usuario = '00000000000';
const nome_usuario = 'JOAO SILVA SOUZA JUNIOR';
const contato_usuario = '73999982509';

// ================== CONFIG BITRIX ==================
const WEBHOOK_BASE = 'https://chocosul.bitrix24.com.br/rest/270/mwze5xa0wbsh91l1/';


// ================== FILE INPUT (mostra nome do anexo) ==================
document.addEventListener("DOMContentLoaded", () => {
  const inputFile = document.getElementById("main_painel_formulario_botoes_anexo_input");
  const labelFile = document.getElementById("main_painel_formulario_botoes_anexo_label");

  if (inputFile && labelFile) {
    inputFile.addEventListener("change", function () {
      if (this.files && this.files.length > 0) {
        labelFile.textContent = this.files[0].name; // mostra o nome do arquivo
      } else {
        labelFile.textContent = "Anexar arquivo";   // volta ao texto padrão
      }
    });
  }
});


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


// ================== SHEETS (GViz JSONP) ==================
function gvizJSONP({ sheetId, gid, tq, onData, onError }) {
  const cb = 'cb_' + Math.random().toString(36).slice(2);
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tq=${encodeURIComponent(tq)}&tqx=out:json;responseHandler:${cb}`;

  window[cb] = (data) => {
    try {
      if (!data || data.status === 'error' || !data.table) {
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
  const cols = (table.cols || []).map(c => c.label || c.id || '');
  const rows = (table.rows || []).map(r => r.c.map(c => c ? c.v : null));
  return rows.map(row => Object.fromEntries(cols.map((c, i) => [c || `col_${i}`, row[i]])));
}

function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/\s+/g, '_')          // espaços -> _
    .replace(/[^a-z0-9_]/g, '')    // remove símbolos
    .replace(/_+/g, '_')           // colapsa _
    .replace(/^_+|_+$/g, '');
}

// desmarca qualquer radio do grupo (garantia)
function desmarcarTodasOpcoes() {
  document.querySelectorAll("input[name='main_painel_formulario_opcoes_lista']").forEach(i => {
    i.checked = false;
    i.defaultChecked = false;
    i.removeAttribute('checked');
  });
}


// ================== UI DINÂMICA (SETOR + LISTAS) ==================
function criarBotoesSetor(registros) {
  const container = document.getElementById('main_painel_formulario_setor');
  if (!container) return;

  container.innerHTML = '';
  const setoresUnicos = [...new Set(registros.map(r => r.SETOR))].sort();

  setoresUnicos.forEach(setor => {
    const slug = slugify(setor);
    const btn = document.createElement('button');
    btn.className = 'main_painel_formulario_setor';
    btn.id = `main_painel_formulario_setor_${slug}`;
    btn.textContent = setor;
    btn.onclick = () => {
      desmarcarTodasOpcoes();     // ao trocar de setor, nada fica marcado
      mostrar_opcoes_lista(slug); // usa função já existente
    };
    container.appendChild(btn);
  });
}

function criarListasOpcoesPorSetor(registros) {
  const containerPai = document.getElementById('main_painel_formulario_opcoes_lista');
  if (!containerPai) return;

  containerPai.innerHTML = '';

  // agrupar por SETOR
  const grupos = registros.reduce((acc, item) => {
    (acc[item.SETOR] ||= []).push(item);
    return acc;
  }, {});

  Object.entries(grupos).forEach(([setor, lista]) => {
    const slug = slugify(setor);
    const div = document.createElement('div');
    div.className = 'main_painel_formulario_opcoes_lista';
    div.id = `main_painel_formulario_opcoes_lista_${slug}`;
    div.style.display = 'none'; // começa escondida

    lista.forEach(item => {
      const label = document.createElement('label');
      label.className = 'main_painel_formulario_opcoes_lista_opcao';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'main_painel_formulario_opcoes_lista';
      input.value = item['DESCRIÇÃO']; // value = DESCRIÇÃO exata da planilha
      input.checked = false;
      input.defaultChecked = false;

      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + item['DESCRIÇÃO']));

      div.appendChild(label);
    });

    containerPai.appendChild(div);
  });
}

// carrega tudo ao abrir a página (apenas para construir botões e radios)
document.addEventListener('DOMContentLoaded', () => {
  const sheetId = '1RZunfCM7nKOyWXcNh42v2WEpPHsGSBqdRN55h7u3MNM';
  const gid = '0';
  const tq = 'select *';

  gvizJSONP({
    sheetId, gid, tq,
    onData: (data) => {
      const registros = parseTableToObjects(data.table);

      criarBotoesSetor(registros);
      criarListasOpcoesPorSetor(registros);

      // Garante que nada está visível ou marcado ao abrir:
      desmarcarTodasOpcoes();
      document.querySelectorAll('.main_painel_formulario_opcoes_lista').forEach(el => el.style.display = 'none');
    },
    onError: (err, raw) => {
      console.error('Erro ao carregar dados do Google Sheets:', err, raw);
    }
  });
});


// ================== BUSCA ÚNICA NA HORA DE SALVAR ==================
function buscarRegistroPorDescricaoJSONP(descricao) {
  return new Promise((resolve, reject) => {
    const sheetId = '1RZunfCM7nKOyWXcNh42v2WEpPHsGSBqdRN55h7u3MNM';
    const gid = '0';
    const seguro = String(descricao).replace(/'/g, "\\'");

    // Filtra exatamente pela coluna B (DESCRIÇÃO). Case-insensitive:
    const tq = `select * where lower(B) = lower('${seguro}') limit 1`;

    gvizJSONP({
      sheetId, gid, tq,
      onData: (data) => {
        const linhas = parseTableToObjects(data.table);
        resolve(linhas[0] || null);
      },
      onError: (err) => reject(err)
    });
  });
}


// ================== BITRIX: NOTIFICAÇÕES ==================
function getTaskIdFromResult(data) {
  // tenta várias formas comuns de retorno
  return (
    data?.result?.task?.id ??
    data?.result?.task?.ID ??
    data?.result?.taskId ??
    data?.result ??
    null
  );
}

function taskLinkForUser(userId, taskId) {
  return `https://chocosul.bitrix24.com.br/company/personal/user/${userId}/tasks/task/view/${taskId}/`;
}

async function bitrixNotifyUser(userId, titulo, taskId) {
  try {
    const body = {
      USER_ID: userId,
      MESSAGE: `🆕 Nova tarefa: ${titulo}\n${taskLinkForUser(userId, taskId)}`
      // TAG/SUB_TAG poderiam ser usados se quiser evitar duplicatas
      // TAG: `task_new_${taskId}`, SUB_TAG: `task_new_${taskId}_${userId}`
    };
    const resp = await fetch(`${WEBHOOK_BASE}im.notify.personal.add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await resp.json();
    if (j.error) console.warn('Falha ao notificar', userId, j);
  } catch (e) {
    console.warn('Erro na notificação IM para', userId, e);
  }
}


// ================== SALVAR SOLICITAÇÃO (usa somente o radio selecionado) ==================
async function salvar_solicitacao() {
  const opcao_selecionada = document.querySelector('input[name="main_painel_formulario_opcoes_lista"]:checked');

  if (!opcao_selecionada) {
    const alerta = document.getElementById('main_painel_formulario_alerta');
    alerta.style.display = 'flex';
    alerta.style.backgroundColor = 'red';
    alerta.style.color = 'var(--var_cor_branco)';
    alerta.querySelector('p').textContent = 'Por favor, selecione uma opção válida.';
    return;
  }

  const nome_tarefa = opcao_selecionada.value; // exatamente a DESCRIÇÃO da planilha
  const descricaoUsuario = document.getElementById('main_painel_formulario_opcoes_texto').value;

  if (!nome_tarefa || !descricaoUsuario) {
    const alerta = document.getElementById('main_painel_formulario_alerta');
    alerta.style.display = 'flex';
    alerta.style.backgroundColor = 'red';
    alerta.style.color = 'var(--var_cor_branco)';
    alerta.querySelector('p').textContent = 'Selecione uma opção válida e informe detalhes sobre a solicitação.';
    return;
  }

  try {
    // Consulta a planilha AGORA, filtrando pela DESCRIÇÃO escolhida
    const registro = await buscarRegistroPorDescricaoJSONP(nome_tarefa);
    if (!registro) {
      const alerta = document.getElementById('main_painel_formulario_alerta');
      alerta.style.display = 'flex';
      alerta.style.backgroundColor = 'red';
      alerta.style.color = 'var(--var_cor_branco)';
      alerta.querySelector('p').textContent = 'Não foi possível localizar os dados da opção selecionada.';
      return;
    }

    // ===== transforma a linha em variáveis =====
    const setor       = registro['SETOR'] ?? '';
    const plataforma  = registro['PLATAFORMA'] ?? '';
    const instrucoes  = registro['INSTRUÇÕES'] ?? '';
    const tipoVal     = registro['TIPO'];
    const tipo        = Number.isFinite(tipoVal) ? Number(tipoVal) : (Number(tipoVal) || null);

    // tempoHoras (em horas; aceita fracionado)
    {
      const v = registro['TEMPO PARA RESOLUÇÃO'];
      const n = Number.isFinite(v) ? Number(v) : Number(v);
      var tempoHoras = (Number.isFinite(n) && n > 0) ? n : 2; // fallback 2h
    }

    // responsável (inteiro positivo; fallback 270)
    {
      const n = Number(registro['RESPONSÁVEL']);
      var id_responsavel = (Number.isInteger(n) && n > 0) ? n : 270;
    }

    // observadores (IDs inteiros > 0)
    function parseObservadores(v) {
      if (v == null) return [];
      if (Array.isArray(v)) return v.map(Number).filter(n => Number.isInteger(n) && n > 0);
      if (typeof v === 'number') return (Number.isInteger(v) && v > 0) ? [v] : [];
      return String(v)
        .split(/[,\s;]+/)
        .map(s => Number(s))
        .filter(n => Number.isInteger(n) && n > 0);
    }
    let observadores = parseObservadores(registro['OBSERVADORES']);
    observadores = observadores.length ? Array.from(new Set([...observadores, id_responsavel])) : [id_responsavel];

    // prazo: agora + tempoHoras (em horas) -> ISO
    const prazo_tarefa = new Date(Date.now() + tempoHoras * 60 * 60 * 1000).toISOString();

    const descricaoBitrix =
`Nome do solicitante: ${nome_usuario}
Contato: ${contato_usuario}          https://wa.me/${contato_usuario}
CPF: ${cpf_usuario}

Setor: ${setor}
Plataforma: ${plataforma}
Tipo: ${tipo ?? '-'}
Tempo previsto (h): ${tempoHoras}
Instruções: ${instrucoes}

Detalhes do solicitante:
${descricaoUsuario}

Tarefa aberta via atendimento ao colaborador -- site`;

    const parametros_api = {
      fields: {
        TITLE: nome_tarefa,              // Título da tarefa (DESCRIÇÃO)
        DESCRIPTION: descricaoBitrix,    // Texto enviado ao Bitrix
        RESPONSIBLE_ID: id_responsavel,  // Responsável da planilha
        DEADLINE: prazo_tarefa,          // Prazo: agora + TEMPO PARA RESOLUÇÃO (h)
        AUDITORS: observadores           // Observadores da planilha
      }
    };

    // ===== cria tarefa =====
    const resp = await fetch(`${WEBHOOK_BASE}tasks.task.add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametros_api),
    });
    const data = await resp.json();

    const alerta = document.getElementById('main_painel_formulario_alerta');

    if (data.result) {
      // obtem taskId para link/notify
      const taskId = getTaskIdFromResult(data);

      // ===== notifica responsável + observadores =====
      const usuariosParaNotificar = Array.from(new Set([id_responsavel, ...observadores]));
      await Promise.all(
        usuariosParaNotificar.map(uid => bitrixNotifyUser(uid, nome_tarefa, taskId))
      );

      // sucesso visual
      alerta.style.display = 'flex';
      alerta.style.backgroundColor = 'green';
      alerta.style.color = 'var(--var_cor_branco)';
      alerta.querySelector('p').textContent = 'Solicitação registrada. Logo alguém entrará em contato.';
    } else {
      alerta.style.display = 'flex';
      alerta.style.backgroundColor = 'red';
      alerta.style.color = 'var(--var_cor_branco)';
      alerta.querySelector('p').textContent = 'Erro ao criar a tarefa.';
      console.error('Bitrix erro:', data);
    }
  } catch (error) {
    const alerta = document.getElementById('main_painel_formulario_alerta');
    alerta.style.display = 'flex';
    alerta.style.backgroundColor = 'red';
    alerta.style.color = 'var(--var_cor_branco)';
    alerta.querySelector('p').textContent = 'Erro na requisição.';
    console.error(error);
  }
}


// ================== MOSTRAR LISTA DO SETOR ==================
function mostrar_opcoes_lista(setor) {
  const opcoes_listas = document.querySelectorAll('.main_painel_formulario_opcoes_lista');
  opcoes_listas.forEach(section => { section.style.display = 'none'; });

  const alvo = document.getElementById('main_painel_formulario_opcoes_lista_' + setor);
  if (alvo) {
    alvo.style.display = 'grid';
    alvo.style.gap = '1svh';
    alvo.style.flexDirection = 'column';
  }
}
