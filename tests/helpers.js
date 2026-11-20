// Helpers dos testes de interface (tarefa A1). Contrato: seção 3 do PLANEJAMENTO.md.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Caminho a partir da raiz (no ambiente jsdom, `new URL(..., import.meta.url)` não funciona com o fs).
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const corpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];

/**
 * Abre o jogo como um jogador abriria a página.
 * @param {Record<string,string>} params parâmetros de URL da seção 3 (ex.: { minas: MINAS_PADRAO })
 * @param {object} opcoesUser repassado a userEvent.setup (ex.: { advanceTimers: jest.advanceTimersByTime })
 * @returns user do user-event, para clicar como o jogador
 */
export async function abrirJogo(params = {}, opcoesUser = {}) {
  window.history.replaceState({}, '', '/?' + new URLSearchParams(params));
  document.body.innerHTML = corpo;
  jest.resetModules();
  await import('../js/main.js');
  return userEvent.setup(opcoesUser);
}

/** Clique direito (pôr/tirar bandeira) como o jogador faria. */
export async function cliqueDireito(user, elemento) {
  await user.pointer({ keys: '[MouseRight]', target: elemento });
}

export { screen, within };

export const LINHAS = 14;
export const COLUNAS = 18;
export const TOTAL_MINAS = 40;

/** Todas as 252 posições `linha-coluna`, em ordem (1-1, 1-2, …, 14-18). */
export const TODAS_AS_CELULAS = Array.from({ length: LINHAS }, (_, l) =>
  Array.from({ length: COLUNAS }, (_, c) => `${l + 1}-${c + 1}`)).flat();

/**
 * MINAS_PADRAO (seção 3): coluna 10 inteira (14), coluna 18 inteira (14) e coluna 17 das linhas 1–12 (12) = 40.
 * A coluna 10 divide o campo: clicar 1-1 abre o lado esquerdo (126 células), 1-13 abre o direito (86).
 */
export const LISTA_MINAS_PADRAO = [
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-10`),
  ...Array.from({ length: 14 }, (_, i) => `${i + 1}-18`),
  ...Array.from({ length: 12 }, (_, i) => `${i + 1}-17`),
];
export const MINAS_PADRAO = LISTA_MINAS_PADRAO.join(',');

/** A célula `linha-coluna`, ex.: celula('1-9'). */
export const celula = (pos) => screen.getByTestId(`celula-${pos}`);
/** Todas as células do tabuleiro. */
export const todasAsCelulas = () => screen.getAllByTestId(/^celula-\d+-\d+$/);
/** Células num estado (`oculta`, `revelada`, `bandeira`, `mina`, `explodida`, `bandeira-errada`). */
export const celulasNoEstado = (estado) => todasAsCelulas().filter((c) => c.getAttribute('data-estado') === estado);
/** Posição `linha-coluna` de um elemento de célula. */
export const posicaoDe = (el) => el.getAttribute('data-testid').replace(/^celula-/, '');
