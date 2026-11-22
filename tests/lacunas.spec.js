// Casos adicionais de lacunas de cobertura (tarefa A6). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
// Cada caso fecha uma lacuna achada na auditoria (mutante que a suíte anterior não pegava); ver docs/VALIDACAO-TESTES-HENRIQUE.md.
import { abrirJogo, celula, cliqueDireito, screen, TODAS_AS_CELULAS, MINAS_PADRAO, LISTA_MINAS_PADRAO } from './helpers.js';

afterEach(() => {
  jest.useRealTimers(); // restaura sempre, para não vazar para os outros specs
});

/** Conta as 252 células por data-estado. Estado desconhecido vira chave extra e quebra o toEqual. */
function contarEstados() {
  const contagem = { oculta: 0, revelada: 0, bandeira: 0, mina: 0, explodida: 0, 'bandeira-errada': 0 };
  for (const pos of TODAS_AS_CELULAS) {
    const estado = celula(pos).getAttribute('data-estado');
    contagem[estado] = (contagem[estado] ?? 0) + 1;
  }
  return contagem;
}

/** Posições `linha-coluna` (ordenadas) das células no data-estado indicado. */
const posicoesNoEstado = (estado) => TODAS_AS_CELULAS.filter((pos) => celula(pos).getAttribute('data-estado') === estado).sort();

/** Posições de todas as linhas nas colunas de..ate (ordenadas). */
const posicoesDasColunas = (de, ate) =>
  TODAS_AS_CELULAS.filter((p) => {
    const c = Number(p.split('-')[1]);
    return c >= de && c <= ate;
  }).sort();

const contador = () => screen.getByTestId('contador-minas');
const cronometro = () => screen.getByTestId('cronometro');
const mensagem = () => screen.getByTestId('mensagem');
const mensagemVazia = () => expect(mensagem().textContent.trim()).toBe('');
const esperar = (s) => jest.advanceTimersByTime(s * 1000);
const abrirComRelogio = () => {
  jest.useFakeTimers();
  return abrirJogo({ minas: MINAS_PADRAO }, { advanceTimers: jest.advanceTimersByTime });
};

// TC-CM-36: "Nova partida" volta o cronômetro a 0, para a contagem e deixa o 1º clique do jogo novo começar do zero.
test('TC-CM-36 nova partida zera, para e reinicia o cronômetro', async () => {
  const user = await abrirComRelogio();
  await user.click(celula('1-9'));
  esperar(5);

  // Conferência intermediária: o cronômetro estava rodando.
  expect(cronometro()).toHaveTextContent(/^5$/);

  await user.click(screen.getByTestId('btn-nova-partida'));

  // Positivo: o cronômetro volta a 0 e a partida nova começou (1-9 oculta de novo).
  expect(cronometro()).toHaveTextContent(/^0$/);
  expect(celula('1-9')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: sem clique, o tempo não corre.
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^0$/);

  // Positivo: no 1º clique do jogo novo o cronômetro recomeça do 0 e soma 1 por segundo.
  await user.click(celula('1-9'));
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  esperar(2);
  expect(cronometro()).toHaveTextContent(/^2$/);
});
