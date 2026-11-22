// Testes de abrir vizinhos com duplo clique (tarefa F5). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
// Vizinhas de 1-9 (número 2) em MINAS_PADRAO: 1-8, 2-8, 2-9 (sem mina; 1-8 e 2-8 são vazias) e 1-10, 2-10 (minas).
// O user.dblClick dispara dois cliques antes do dblclick. Pela seção 1, clicar numa célula já revelada
// não muda nada, então o duplo clique é sempre feito em 1-9 DEPOIS de revelá-la (nunca numa célula oculta).
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

// TC-CM-23: abrir vizinhos com as bandeiras certas. 1-9 tem 2 minas em volta (1-10 e 2-10), e as duas
// estão com bandeira. Então o duplo clique abre as vizinhas sem bandeira. 1-8 é vazia, então a cascata
// abre o lado esquerdo todo (126 células). 1-11 fica do outro lado da parede (coluna 10).
test('TC-CM-23 abrir vizinhos com bandeiras certas', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  await cliqueDireito(user, celula('1-10'));
  await cliqueDireito(user, celula('2-10'));

  // Conferência intermediária: 1-9 revelada com "2", 1-8 ainda oculta e o contador em 38.
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('1-9')).toHaveTextContent(/^2$/);
  expect(celula('1-8')).toHaveAttribute('data-estado', 'oculta');
  expect(contador()).toHaveTextContent(/^38$/);

  await user.dblClick(celula('1-9'));

  // Positivo: as vizinhas sem bandeira são reveladas (1-8 vazia abre a cascata).
  expect(celula('1-8')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('2-8')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('2-9')).toHaveAttribute('data-estado', 'revelada');

  // Positivo: as duas bandeiras certas (1-10 e 2-10) continuam no lugar.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'bandeira');
  expect(celula('2-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: 1-11 (do outro lado da parede) continua oculta.
  expect(celula('1-11')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: o contador continua em 38 (40 − 2 bandeiras).
  expect(contador()).toHaveTextContent(/^38$/);

  // Positivo: o lado esquerdo todo revelado (126), 124 ocultas, 2 bandeiras, sem minas nem erros.
  expect(contarEstados()).toEqual({
    oculta: 124,
    revelada: 126,
    bandeira: 2,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  mensagemVazia();
});

// TC-CM-24: abrir vizinhos com bandeiras de menos. 1-9 é número 2 e só tem 1 bandeira em volta (1-10).
// Como 1 ≠ 2, o duplo clique não faz nada: nenhuma vizinha abre.
test('TC-CM-24 abrir vizinhos com bandeiras de menos', async () => {
  const user = await abrirJogo({ minas: MINAS_PADRAO });
  await user.click(celula('1-9'));
  await cliqueDireito(user, celula('1-10'));

  await user.dblClick(celula('1-9'));

  // Positivo: as vizinhas sem bandeira continuam ocultas (nada abriu).
  expect(celula('1-8')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('2-8')).toHaveAttribute('data-estado', 'oculta');
  expect(celula('2-9')).toHaveAttribute('data-estado', 'oculta');

  // Positivo: 1-9 continua revelada com "2".
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
  expect(celula('1-9')).toHaveTextContent(/^2$/);

  // Positivo: a bandeira em 1-10 continua no lugar.
  expect(celula('1-10')).toHaveAttribute('data-estado', 'bandeira');

  // Positivo: o contador está em 39 (40 − 1 bandeira).
  expect(contador()).toHaveTextContent(/^39$/);

  // Positivo: só 1-9 revelada, 1 bandeira, as outras 250 ocultas.
  expect(contarEstados()).toEqual({
    oculta: 250,
    revelada: 1,
    bandeira: 1,
    mina: 0,
    explodida: 0,
    'bandeira-errada': 0,
  });

  // Positivo: o jogo não terminou, então a mensagem continua vazia.
  mensagemVazia();
});
