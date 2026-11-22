// Testes de fim de jogo: derrota (F3), vitória e nova partida (F4). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
import { abrirJogo, celula, cliqueDireito, screen, TODAS_AS_CELULAS, MINAS_PADRAO, LISTA_MINAS_PADRAO } from './helpers.js';

/**
 * Conta quantas das 252 células (TODAS_AS_CELULAS) estão em cada data-estado.
 * Estado desconhecido vira chave extra e quebra o toEqual. Célula ausente → TestingLibraryElementError (motivo certo).
 */
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

const contador = () => screen.getByTestId('contador-minas');
const mensagem = () => screen.getByTestId('mensagem');
const mensagemVazia = () => expect(mensagem().textContent.trim()).toBe('');

// TC-CM-17: derrota. Clicar na mina 1-10 explode essa mina e mostra as outras 39 minas.
// As 212 células sem mina continuam ocultas (a derrota só mostra as minas, não abre o resto).
test('TC-CM-17 derrota', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-10'));

  // Positivo: a mina clicada fica explodida.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'explodida');

  // Positivo: a derrota é anunciada.
  expect(mensagem()).toHaveTextContent(/^Você perdeu!$/);

  // Positivo: 7-1 (sem mina) continua oculta.
  expect(celula('7-1')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: as outras 39 minas são mostradas como 'mina', e são exatamente as de MINAS_PADRAO menos 1-10.
  expect(posicoesNoEstado('mina')).toEqual([...LISTA_MINAS_PADRAO].filter((p) => p !== '1-10').sort());

  // Positivo: 1 explodida, 39 minas mostradas, 212 ocultas (sem mina), nenhuma revelada ou bandeira.
  expect(contarEstados()).toEqual({
    oculta: 212,
    revelada: 0,
    bandeira: 0,
    mina: 39,
    explodida: 1,
    'bandeira-errada': 0,
  });

  // Positivo: sem bandeiras, o contador continua em 40.
  expect(contador()).toHaveTextContent(/^40$/);
});
