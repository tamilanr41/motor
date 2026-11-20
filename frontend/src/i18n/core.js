import { translations } from './dictionary.js';

const STORAGE_KEY = 'la_language';
const ATTRS = ['placeholder', 'title', 'alt', 'aria-label', 'aria-description'];

const readInitialLanguage = () => {
  try { return localStorage.getItem(STORAGE_KEY) === 'ta' ? 'ta' : 'en'; }
  catch { return 'en'; }
};

let language = readInitialLanguage();
let observer = null;
let scheduled = false;
const textState = new WeakMap();
const attrState = new WeakMap();
const headState = { title: {}, description: {} };
const listeners = new Set();

const translateValue = original => {
  if (typeof original !== 'string') return original;
  const key = original.trim();
  return language === 'ta' && translations[key] ? original.replace(key, translations[key]) : original;
};

function applyTextNode(node) {
  if (node.parentElement?.closest?.('.lang-switch')) return;
  const current = node.nodeValue;
  if (typeof current !== 'string' || !current.trim()) return;
  let state = textState.get(node);
  if (!state || (state.applied !== undefined && current !== state.applied)) {
    state = { original: current };
    textState.set(node, state);
  }
  const next = translateValue(state.original);
  state.applied = next;
  if (current !== next) node.nodeValue = next;
}

function applyElement(el) {
  if (el.closest('.lang-switch')) return;
  let state = attrState.get(el);
  if (!state) { state = {}; attrState.set(el, state); }
  for (const name of ATTRS) {
    const current = el.getAttribute(name);
    if (current === null) continue;
    let field = state[name];
    if (!field || (field.applied !== undefined && current !== field.applied)) {
      field = { original: current };
      state[name] = field;
    }
    const next = translateValue(field.original);
    field.applied = next;
    if (current !== next) el.setAttribute(name, next);
  }
}

function applyHeadField(field, get, set) {
  const current = get();
  if (!current) return;
  if (!field.original || (field.applied !== undefined && current !== field.applied)) field.original = current;
  const next = translateValue(field.original);
  field.applied = next;
  if (current !== next) set(next);
}

function applyHead() {
  applyHeadField(headState.title, () => document.title, value => { document.title = value; });
  const meta = document.querySelector('meta[name="description"]');
  if (meta) applyHeadField(headState.description, () => meta.content, value => { meta.content = value; });
}

function applyAll() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) applyTextNode(walker.currentNode);
  document.querySelectorAll('body *').forEach(applyElement);
  applyHead();
}

function ensureObserver() {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; applyAll(); });
  });
  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ATTRS
  });
  if (document.head) observer.observe(document.head, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['content']
  });
}

export function getLanguage() { return language; }

export function setLanguage(next) {
  language = next === 'ta' ? 'ta' : 'en';
  try { localStorage.setItem(STORAGE_KEY, language); } catch { /* storage unavailable */ }
  document.documentElement.lang = language;
  ensureObserver();
  applyAll();
  listeners.forEach(listener => listener(language));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startTranslator() {
  document.documentElement.lang = language;
  ensureObserver();
  applyAll();
  return () => {
    if (observer) { observer.disconnect(); observer = null; }
  };
}
