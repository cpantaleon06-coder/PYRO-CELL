import { createElement, Fragment, type ReactNode } from "react";

/** Rellena una plantilla con {0}, {1}… usando texto plano (para atributos y props string). */
export function f(tpl: string, ...vals: (string | number)[]): string {
  return tpl.replace(/\{(\d+)\}/g, (whole, i) => {
    const v = vals[Number(i)];
    return v === undefined ? whole : String(v);
  });
}

/** Como f(), pero intercala nodos React: permite resaltar cifras dentro de una frase sin
 *  fijar el orden de las palabras, que cambia de un idioma a otro. */
export function fill(tpl: string, ...nodes: ReactNode[]): ReactNode[] {
  return tpl.split(/(\{\d+\})/).map((part, k) => {
    const m = part.match(/^\{(\d+)\}$/);
    return createElement(Fragment, { key: k }, m ? nodes[Number(m[1])] : part);
  });
}

/** Mayúscula inicial respetando el locale (los meses van en minúscula en es/fr/pt). */
export function cap(s: string, locale: string): string {
  return s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s;
}
