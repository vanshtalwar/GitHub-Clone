// Language dot colours from GitHub Linguist. C#, C++, JavaScript and TypeScript were checked against the
// live profile page on 22 Oct 2026 (C# is now purple, #7355dd).
const LANGUAGE_COLORS: Record<string, string> = {
  C: '#555555',
  'C#': '#7355dd',
  'C++': '#f34b7d',
  Clojure: '#db5855',
  CSS: '#663399',
  Dart: '#00b4ab',
  Dockerfile: '#384d54',
  Elixir: '#6e4a7e',
  Go: '#00add8',
  Haskell: '#5e5086',
  HCL: '#844fba',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  'Jupyter Notebook': '#da5b0b',
  Kotlin: '#a97bff',
  Lua: '#000080',
  Makefile: '#427819',
  'Objective-C': '#438eff',
  Perl: '#0298c3',
  PHP: '#4f5d95',
  PowerShell: '#012456',
  Python: '#3572a5',
  R: '#198ce7',
  Ruby: '#701516',
  Rust: '#dea584',
  Scala: '#c22d40',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Solidity: '#aa6746',
  Svelte: '#ff3e00',
  Swift: '#f05138',
  TypeScript: '#3178c6',
  Vue: '#41b883',
};

const FALLBACK_COLOR = '#8b949e';

export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? FALLBACK_COLOR;
}
