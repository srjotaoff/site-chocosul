const cpf_usuario = '00000000000'
const nome_usuario = 'JOAO SILVA SOUZA JUNIOR'
const contato_usuario = '73999982509'


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


async function salvar_solicitacao() {
    const webhookurl = 'https://chocosul.bitrix24.com.br/rest/270/mwze5xa0wbsh91l1/'

    const opcao_selecionada = document.querySelector('input[name="main_painel_formulario_opcoes_lista"]:checked');

    if (!opcao_selecionada) {
        document.getElementById('main_painel_formulario_alerta').style.display = 'flex';
        document.getElementById('main_painel_formulario_alerta').style.backgroundColor = 'red';
        document.getElementById('main_painel_formulario_alerta').style.color = 'var(--var_cor_branco)';
        document.getElementById('main_painel_formulario_alerta').querySelector('p').textContent = 'Por favor, selecione uma opção válida.';
        return; // Interrompe a execução da função
    }

    const nome_tarefa = opcao_selecionada.parentElement.textContent.trim();
    const descricao = document.getElementById('main_painel_formulario_opcoes_texto').value

    if (nome_tarefa && descricao) {
        const id_responsavel = 270
        const prazo_tarefa = new Date(new Date().setHours(new Date().getHours() + 2)).toISOString()
        const observadores = [id_responsavel]

        const parametros_api = {
            fields: {
                TITLE: nome_tarefa, //O título da tarefa.
                DESCRIPTION: `
Nome do solicitante: ${nome_usuario}
Contato: ${contato_usuario}          https://wa.me/${contato_usuario}
CPF: ${cpf_usuario}


${descricao}`, //A descrição da tarefa.
                RESPONSIBLE_ID: id_responsavel, //O ID do usuário responsável pela tarefa.
                DEADLINE: prazo_tarefa, //A data de prazo para a tarefa (no formato YYYY-MM-DDTHH:MM:SSZ)
                AUDITORS: observadores, //Um array com os IDs dos usuários que serão observadores da tarefa.
            }
        }

        try {
            const response = await fetch(`${webhookurl}tasks.task.add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parametros_api),
            })

            const data = await response.json()

            if (data.result) {
                document.getElementById('main_painel_formulario_alerta').style.display = 'flex';
                document.getElementById('main_painel_formulario_alerta').style.backgroundColor = 'green';
                document.getElementById('main_painel_formulario_alerta').style.color = 'var(--var_cor_branco)';
                document.getElementById('main_painel_formulario_alerta').querySelector('p').textContent = 'Solicitação registrada. Logo alguem entrara em contato.';
            } else {
                document.getElementById('main_painel_formulario_alerta').style.display = 'flex';
                document.getElementById('main_painel_formulario_alerta').style.backgroundColor = 'red';
                document.getElementById('main_painel_formulario_alerta').style.color = 'var(--var_cor_branco)';
                document.getElementById('main_painel_formulario_alerta').querySelector('p').textContent = 'Erro ao criar a tarefa.';
            }
        } catch (error) {
            document.getElementById('main_painel_formulario_alerta').style.display = 'flex';
            document.getElementById('main_painel_formulario_alerta').style.backgroundColor = 'red';
            document.getElementById('main_painel_formulario_alerta').style.color = 'var(--var_cor_branco)';
            document.getElementById('main_painel_formulario_alerta').querySelector('p').textContent = 'Erro na requisição: ',error;
        }
    } else {
        document.getElementById('main_painel_formulario_alerta').style.display = 'flex';
        document.getElementById('main_painel_formulario_alerta').style.backgroundColor = 'red';
        document.getElementById('main_painel_formulario_alerta').style.color = 'var(--var_cor_branco)';
        document.getElementById('main_painel_formulario_alerta').querySelector('p').textContent = 'Selecione uma opção válida e informe detalhes sobre a solicitação.';
    }
}

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