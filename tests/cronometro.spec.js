// Testes do cronômetro (tarefa A5). Contrato: seções 1, 3 e 5 do PLANEJAMENTO.md.
// Relógio falso só neste arquivo: o relógio falso moderno do Jest controla setTimeout/setInterval E Date,
// então estes testes valem para uma implementação por setInterval ou por Date.now().
import { abrirJogo, celula, screen, MINAS_PADRAO } from './helpers.js';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers(); // restaura sempre, para não vazar para os outros specs
});

// Parâmetro de URL `minas` (seção 3): MINAS_PADRAO = 40 minas fixas, inclusive no primeiro clique.
const abrir = () => abrirJogo({ minas: MINAS_PADRAO }, { advanceTimers: jest.advanceTimersByTime });
const esperar = (s) => jest.advanceTimersByTime(s * 1000);
const cronometro = () => screen.getByTestId('cronometro');

test('TC-CM-10 cronômetro começa no 1º clique', async () => {
  const user = await abrir();
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^0$/); // sem clique, não conta
  await user.click(celula('1-9'));
  expect(cronometro()).toHaveTextContent(/^0$/); // no instante do clique ainda 0
  esperar(3);
  expect(cronometro()).toHaveTextContent(/^3$/);
  expect(celula('1-9')).toHaveAttribute('data-estado', 'revelada');
});

test('TC-CM-11 cronômetro para no fim', async () => {
  const user = await abrir();
  await user.click(celula('1-9'));
  esperar(5);
  expect(cronometro()).toHaveTextContent(/^5$/);
  await user.click(celula('1-10'));            // 1-10 é mina: perde
  expect(screen.getByTestId('mensagem')).toHaveTextContent(/^Você perdeu!$/);
  expect(cronometro()).toHaveTextContent(/^5$/);  // no momento da derrota
  esperar(10);
  expect(cronometro()).toHaveTextContent(/^5$/);  // parou
});
