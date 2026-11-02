import { WikiPage } from '../types/wiki';

export const INITIAL_PAGES: Record<string, WikiPage> = {
  'Página_principal': {
    slug: 'Página_principal',
    title: 'Página principal',
    namespace: 'Main',
    author: 'Wikimedia Foundation',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_main',
    categories: ['Portais', 'MediaWiki'],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
    summary: 'Criação inicial da Página Principal do MediaWiki TS',
    content: `{{Infobox software
| nome = MediaWiki TS
| logo = MediaWiki-Logo.svg
| desenvolvedor = Wikimedia Foundation & Comunidade de Software Livre
| versão_estável = 1.43.0-ts
| linguagem = TypeScript (anteriormente PHP)
| banco_de_dados = Google Cloud Firestore (anteriormente MySQL / MariaDB)
| licença = GPL v2.0+ / MIT
| repositório = https://github.com/wikimedia/mediawiki
| website = https://www.mediawiki.org
}}

'''Bem-vindo(a) ao MediaWiki TS''', a reimplementação do motor de wiki livre da [[Wikimedia Foundation]], agora portado de '''PHP''' para '''TypeScript''', e de '''SQL relacional''' para '''Google Cloud Firestore'''.

O MediaWiki é o software que alimenta alguns dos maiores repositórios colaborativos de conhecimento da humanidade, incluindo a [[Wikipédia]], o [[Wikimedia Commons]], o [[Wikcionário]] e milhares de wikis independentes ao redor do mundo.

== Sobre a migração tecnológica ==
O projeto oficial [[Repositório_GitHub_Wikimedia|wikimedia/mediawiki]] no GitHub conta com mais de 20 anos de desenvolvimento ativo em PHP. Esta versão em TypeScript traz os seguintes avanços:

* '''Do PHP para TypeScript:''' Tipagem estática rigorosa no backend e frontend, reatividade com componentes modernos e interoperabilidade em tempo real.
* '''Do MySQL/Postgres para Firebase Firestore:''' Modelo de dados NoSQL distribuído com escuta reativa em tempo real (\`onSnapshot\`), permitindo colaboração instantânea sem a sobrecarga de polling SQL.
* '''Motor de Wikitexto Completo:''' Suporte integral à sintaxe de marcação clássica (seções, predefinições, links internos com verificação de páginas existentes, tabelas \`wikitable\`, referências e notas de rodapé).
* '''Arquitetura Vector Skin:''' Fidelidade visual absoluta aos temas clássico e moderno da Wikipédia, com abas de leitura, edição, histórico de revisões com diff colorido e páginas de discussão.

== Navegação rápida ==
{| class="wikitable" style="width:100%; text-align:left;"
! Seção !! Descrição !! Links rápidos
|-
| '''Documentação Central'''
| Visão geral sobre o software e ecossistema
| [[MediaWiki]], [[Wikimedia_Foundation]]
|-
| '''Engenharia & Arquitetura'''
| Comparativo técnico profundo PHP x TypeScript e SQL x Firestore
| [[Arquitetura_MediaWiki_TS]], [[Manual:LocalSettings.ts]]
|-
| '''Repositório Oficial'''
| Informações, branches, commits e componentes importados do GitHub
| [[Repositório_GitHub_Wikimedia]], [[Especial:Versão]]
|-
| '''Guia do Usuário'''
| Como formatar wikitexto, criar predefinições e referenciar fontes
| [[Ajuda:Wikitexto]], [[Especial:Todas_as_páginas]]
|}

== Sabia que... ==
* O primeiro software da Wikipédia em 2001 chamava-se ''UseModWiki'' e era escrito em Perl.
* Em 2002, Magnus Manske escreveu uma nova versão em PHP/MySQL (conhecida como "Fase II").
* Mais tarde, Lee Daniel Crocker reescreveu o motor como "Fase III", que foi oficialmente batizado de '''MediaWiki'''.
* Hoje você pode experimentar o histórico de versões clicando na aba '''Ver histórico''' no topo de qualquer página!

[[Categoria:Portais]]
[[Categoria:MediaWiki]]
[[Categoria:TypeScript]]`
  },

  'MediaWiki': {
    slug: 'MediaWiki',
    title: 'MediaWiki',
    namespace: 'Main',
    author: 'Equipe Editorial Wikimedia',
    authorId: 'wikimedia_system',
    revisionCount: 2,
    latestRevisionId: 'rev_initial_mw',
    categories: ['Software Livre', 'MediaWiki', 'Projetos Wikimedia'],
    createdAt: '2026-11-01T01:00:00.000Z',
    updatedAt: '2026-11-02T10:30:00.000Z',
    summary: 'Artigo enciclopédico abrangente sobre a história e estrutura do MediaWiki',
    content: `{{Infobox software
| nome = MediaWiki
| desenvolvedor = Wikimedia Foundation
| lançamento = 25 de janeiro de 2002
| gênero = Software Wiki / Sistema de Gerenciamento de Conteúdo
| licença = GNU General Public License v2+
| repositório = https://github.com/wikimedia/mediawiki
}}

'''MediaWiki''' é um pacote de software livre de [[wiki]] extremamente escalável e rico em recursos, escrito originalmente em PHP e mantido pela [[Wikimedia_Foundation]] e colaboradores globais de código aberto. Ele é a espinha dorsal tecnológica da [[Wikipédia]] e de todos os projetos irmãos da Wikimedia.

== História ==
Quando a Wikipédia começou em janeiro de 2001, funcionava com o ''UseModWiki'', um script Perl rudimentar que armazenava cada página como um arquivo de texto plano. Conforme o volume de colaboradores aumentava drasticamente, as limitações do Perl tornaram-se evidentes.

=== Fase II: O script PHP de Magnus Manske ===
Em janeiro de 2002, o estudante de biologia e programador alemão '''Magnus Manske''' desenvolveu um substituto baseado em PHP e banco de dados relacional MySQL. Esta transição, ocorrida em 25 de janeiro de 2002, introduziu recursos que hoje são universais na web:
# Espaços nominais (''Namespaces'').
# Histórico granular de revisões com diffs comparativos.
# Páginas especiais como [[Especial:Mudanças_recentes]].

=== Fase III: Reescrita e Batismo como MediaWiki ===
Apesar de revolucionária, a Fase II sofreu gargalos de desempenho com o tráfego acelerado da Wikipédia. Em meados de 2002, '''Lee Daniel Crocker''' reescreveu completamente a arquitetura, introduzindo um sistema robusto de abstração de cache e banco de dados.

Em 2003, o desenvolvedor Daniel Mayer cunhou o nome '''MediaWiki''', um trocadilho inteligente com ''Wikimedia'', que foi rapidamente adotado.

== Características Notáveis ==
* '''Wikitexto e Parsoid:''' Uma gramática flexível de marcação de texto que permite fácil formatação sem a complexidade de tags HTML puras.
* '''Internacionalização (i18n):''' Suporte a centenas de idiomas com o sistema \`languages/messages/\`, permitindo pluralização, conjugação de gênero e direção RTL.
* '''Extensibilidade e Hooks:''' Mais de 2.000 ganchos (''hooks'') permitem injetar comportamento sem alterar o núcleo.
* '''Páginas Especiais:''' Ferramentas administrativas e de visualização geradas dinamicamente (como [[Especial:Todas_as_páginas]] e [[Especial:Versão]]).

== O Port para TypeScript e Firebase ==
Na versão '''MediaWiki TS''', o ecossistema foi refatorado para o ambiente moderno de TypeScript:
* Os antigos arquivos PHP em \`includes/actions/\`, \`includes/parser/\` e \`includes/storage/\` foram mapeados para módulos estritamente tipados em \`/src/core/\`.
* A camada SQL (tabelas \`page\`, \`revision\`, \`text\`, \`recentchanges\`) foi convertida para coleções NoSQL no '''Firebase Firestore''', garantindo sincronização em tempo real e escalabilidade serverless.

Consulte o artigo técnico [[Arquitetura_MediaWiki_TS]] para a análise detalhada de código.

== Referências ==
<ref>Manske, Magnus. "A new script for Wikipedia", Wikimedia-l mailing list, janeiro de 2002.</ref>
<ref>Crocker, Lee Daniel. "MediaWiki Architecture and Scalability", Wikimedia Technical Conference, 2004.</ref>
<ref>Wikimedia Git Mirror. "wikimedia/mediawiki repository", https://github.com/wikimedia/mediawiki.</ref>

<references />

[[Categoria:Software Livre]]
[[Categoria:MediaWiki]]
[[Categoria:Projetos Wikimedia]]`
  },

  'Arquitetura_MediaWiki_TS': {
    slug: 'Arquitetura_MediaWiki_TS',
    title: 'Arquitetura MediaWiki TS',
    namespace: 'Main',
    author: 'Arquiteto de Sistemas',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_arch',
    categories: ['Arquitetura', 'TypeScript', 'Firebase', 'MediaWiki'],
    createdAt: '2026-11-01T02:00:00.000Z',
    updatedAt: '2026-11-02T11:00:00.000Z',
    summary: 'Mapeamento técnico da migração PHP/SQL para TypeScript/Firestore',
    content: `{{Infobox software
| título = Arquitetura MediaWiki TS
| paradigma = Reativo, Componentizado e Orientado a Eventos
| frontend = React 19 + Tailwind CSS + Lucide
| backend = TypeScript + Express / Cloud Functions
| armazenamento = Google Cloud Firestore (NoSQL)
| autenticação = Firebase Auth (Google Sign-In + Guest/IP)
}}

A '''Arquitetura MediaWiki TS''' é a adaptação da clássica base de código PHP do repositório oficial [[Repositório_GitHub_Wikimedia|wikimedia/mediawiki]] para o ecossistema moderno de TypeScript e Firebase.

== Matriz de Mapeamento: PHP vs TypeScript ==
Abaixo está o comparativo entre a árvore original do MediaWiki em PHP e a nova estrutura em TypeScript:

{| class="wikitable" style="width:100%; font-size:13px;"
! Componente PHP Original (\`wikimedia/mediawiki\`) !! Equivalente TypeScript (\`MediaWiki TS\`) !! Responsabilidade
|-
| \`includes/parser/Parser.php\`
| \`/src/core/parser.ts\`
| Analisador sintático de wikitexto, gerador de AST, cabeçalhos, tabelas, predefinições e TOC
|-
| \`includes/Storage/RevisionStore.php\`
| \`/src/services/wikiService.ts\`
| Controle de imutabilidade de versões, snapshot de edições e cálculo de deltas
|-
| \`includes/Title.php\`
| \`/src/core/title.ts\`
| Normalização de URLs, slugificação, detecção de namespaces (Help, Talk, Special, Category)
|-
| \`includes/specials/SpecialRecentchanges.php\`
| \`/src/components/SpecialRecentChanges.tsx\`
| Feed em tempo real de alterações com filtros e deltas de bytes
|-
| \`includes/specials/SpecialVersion.php\`
| \`/src/components/SpecialVersion.tsx\`
| Informações de versão, extensões carregadas e metadados do git
|-
| \`LocalSettings.php\`
| \`/src/Manual/LocalSettings.ts\` & \`/src/components/LocalSettingsModal.tsx\`
| Configuração centralizada de variáveis de ambiente, skins e permissões
|}

== Do Relacional SQL ao NoSQL Firestore ==
Na arquitetura PHP clássica, o MediaWiki utiliza tabelas relacionais com chaves estrangeiras:
* '''page:''' \`page_id\`, \`page_namespace\`, \`page_title\`, \`page_latest\`, \`page_len\`
* '''revision:''' \`rev_id\`, \`rev_page\`, \`rev_comment\`, \`rev_user_text\`, \`rev_timestamp\`
* '''text:''' \`old_id\`, \`old_text\`, \`old_flags\`
* '''recentchanges:''' \`rc_id\`, \`rc_timestamp\`, \`rc_title\`, \`rc_user_text\`

=== Estrutura de Documentos no Firestore ===
No MediaWiki TS, o modelo foi adaptado para documentos e subcoleções:

<syntaxhighlight lang="typescript">
// Coleção: /wiki_pages/{slug}
interface WikiPageDocument {
  slug: string;                 // ex: "MediaWiki"
  title: string;                // ex: "MediaWiki"
  namespace: PageNamespace;     // "Main", "Talk", "Special", etc.
  content: string;              // Wikitext da versão atual
  summary: string;              // Resumo da última edição
  author: string;               // Nome ou IP do autor
  authorId: string;             // UID do Firebase Auth ou hash anônimo
  revisionCount: number;        // Contador total de edições
  latestRevisionId: string;     // ID da revisão mais recente
  categories: string[];         // Categorias extraídas
  updatedAt: string;            // ISO timestamp
  createdAt: string;            // ISO timestamp
}

// Subcoleção: /wiki_pages/{slug}/revisions/{revId}
interface PageRevisionDocument {
  revId: string;                // ID único da revisão
  pageId: string;               // Slug da página
  pageTitle: string;            // Título
  content: string;              // Conteúdo congelado nesta versão
  summary: string;              // Resumo do editor
  timestamp: string;            // Timestamp
  author: string;               // Autor
  byteSize: number;             // Tamanho em bytes
  minorEdit: boolean;           // Marcação de edição menor
}
</syntaxhighlight>

== O Motor de Diffs ==
O MediaWiki clássico invoca o utilitário \`diff\` do GNU/Linux via processo filho em PHP. No MediaWiki TS, utilizamos uma implementação pura em TypeScript (\`/src/core/diff.ts\`), que computa a distância de Levenshtein e o algoritmo de Myers para gerar diffs visuais coloridos (verde para inserções, vermelho para remoções) tanto a nível de linha quanto de palavra.

Você pode conferir essa funcionalidade ao visualizar o histórico de qualquer página com edições e selecionar duas versões para comparar!

[[Categoria:Arquitetura]]
[[Categoria:TypeScript]]
[[Categoria:Firebase]]
[[Categoria:MediaWiki]]`
  },

  'Manual:LocalSettings.ts': {
    slug: 'Manual:LocalSettings.ts',
    title: 'Manual:LocalSettings.ts',
    namespace: 'Manual',
    author: 'Administrador do Sistema',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_settings',
    categories: ['Manual', 'Configuração', 'MediaWiki'],
    createdAt: '2026-11-01T03:00:00.000Z',
    updatedAt: '2026-11-02T08:00:00.000Z',
    summary: 'Documentação do arquivo de configuração central do MediaWiki TS',
    content: `{{Infobox software
| título = LocalSettings.ts
| função = Arquivo de Configuração Principal
| formato = TypeScript / Objeto JSON Reativo
| equivalente_php = LocalSettings.php
}}

No MediaWiki PHP clássico, o arquivo \`LocalSettings.php\` é o coração de qualquer instalação wiki. Ele define variáveis globais iniciadas pelo prefixo \`$wg\`, tais como \`$wgSitename\`, \`$wgLanguageCode\` e \`$wgGroupPermissions\`.

No '''MediaWiki TS''', o arquivo equivalente é o \`LocalSettings.ts\`, operando com tipagem rigorosa e sincronização reativa.

== Configurações Disponíveis ==

<syntaxhighlight lang="typescript">
export interface WikiSettings {
  // Nome da Wiki exibido no cabeçalho e títulos
  sitename: string; // Ex: "MediaWiki TS"

  // Código de linguagem padrão (pt-br, en, es, etc.)
  languageCode: string; // Ex: "pt-br"

  // Permite edições de usuários anônimos (com IP virtual registrado)
  allowAnonymousEditing: boolean; // default: true

  // Habilita previsão instantânea ao vivo enquanto digita
  enableLivePreview: boolean; // default: true

  // Tema padrão da interface ('vector-modern' ou 'vector-legacy')
  defaultSkin: 'vector-modern' | 'vector-legacy' | 'dark-mode';

  // Limite máximo de entradas em Mudanças Recentes
  maxRecentChanges: number; // default: 50

  // URL do repositório upstream oficial
  repositoryUrl: string; // "https://github.com/wikimedia/mediawiki"
}
</syntaxhighlight>

== Como alterar as configurações ==
Você pode abrir o painel interativo de configurações a qualquer momento clicando em '''Ferramentas > Configurações da Wiki''' na barra lateral esquerda! As opções modificadas são salvas e aplicadas em tempo real em toda a interface.

[[Categoria:Manual]]
[[Categoria:Configuração]]
[[Categoria:MediaWiki]]`
  },

  'Ajuda:Wikitexto': {
    slug: 'Ajuda:Wikitexto',
    title: 'Ajuda:Wikitexto',
    namespace: 'Help',
    author: 'Equipe de Documentação',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_help',
    categories: ['Ajuda', 'Documentação', 'Wikitexto'],
    createdAt: '2026-11-01T04:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
    summary: 'Guia completo de sintaxe e formatação de wikitexto',
    content: `{{Aviso|Este guia ensina a formatar artigos utilizando a sintaxe nativa de wikitexto do MediaWiki TS.}}

O '''Wikitexto''' (também conhecido como marcação wiki) é a linguagem de formatação utilizada pelo MediaWiki.

== Formatação de Texto Básica ==
{| class="wikitable"
! Você digita !! Resultado
|-
| \`''itálico''\` || ''itálico''
|-
| \`'''negrito'''\` || '''negrito'''
|-
| \`'''''negrito e itálico'''''\` || '''''negrito e itálico'''''
|-
| \`<s>tachado</s>\` || <s>tachado</s>
|-
| \`<u>sublinhado</u>\` || <u>sublinhado</u>
|}

== Seções e Cabeçalhos ==
Os cabeçalhos criam automaticamente o '''Índice''' (Table of Contents) da página quando há mais de três seções:
<syntaxhighlight lang="text">
== Seção Principal (H2) ==
=== Subseção (H3) ===
==== Nível 4 (H4) ====
</syntaxhighlight>

== Ligações (Links) ==
* '''Link Interno:''' \`[[MediaWiki]]\` produz [[MediaWiki]]. Se a página não existir, o link aparecerá em '''vermelho'''!
* '''Link Interno com Rótulo Personalizado:''' \`[[MediaWiki|o software MediaWiki]]\` produz [[MediaWiki|o software MediaWiki]].
* '''Link Externo:''' \`[https://github.com/wikimedia/mediawiki Repositório GitHub]\` produz [https://github.com/wikimedia/mediawiki Repositório GitHub].

== Listas ==
<syntaxhighlight lang="text">
* Primeiro item não ordenado
** Sub-item com dois asteriscos
* Segundo item

# Item numerado 1
# Item numerado 2
## Sub-item numerado 2.1
</syntaxhighlight>

== Predefinições e Caixas de Destaque ==
* \`{{Aviso|Mensagem de destaque}}\`
* \`{{Infobox ...}}\` para cartões de informação técnica na lateral.

== Citações e Referências ==
Você pode inserir notas de rodapé no meio do texto com:
\`Como demonstrado no repositório oficial.<ref>Documentação Wikimedia 2026.</ref>\`

E exibir a lista com \`<references />\` no final do artigo.

Experimente editar esta ou outra página clicando na aba '''Editar''' no topo!

[[Categoria:Ajuda]]
[[Categoria:Documentação]]
[[Categoria:Wikitexto]]`
  },

  'Repositório_GitHub_Wikimedia': {
    slug: 'Repositório_GitHub_Wikimedia',
    title: 'Repositório GitHub Wikimedia',
    namespace: 'Main',
    author: 'Git Sync Bot',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_repo',
    categories: ['Git', 'Código Fonte', 'Wikimedia', 'MediaWiki'],
    createdAt: '2026-11-01T05:00:00.000Z',
    updatedAt: '2026-11-02T11:45:00.000Z',
    summary: 'Metadados e estrutura importada do repositório oficial wikimedia/mediawiki',
    content: `{{Infobox software
| nome = Repositório wikimedia/mediawiki
| url = https://github.com/wikimedia/mediawiki
| proprietário = Wikimedia Foundation
| linguagem_primária = PHP / TypeScript
| licença = GPL-2.0-or-later
| branch_padrão = master
}}

Este artigo reúne informações sincronizadas a partir do repositório oficial do MediaWiki no GitHub: '''[https://github.com/wikimedia/mediawiki wikimedia/mediawiki]'''.

== Visão Geral do Repositório ==
O MediaWiki é desenvolvido no sistema Gerrit da Wikimedia Foundation (\`gerrit.wikimedia.org\`) e espelhado continuamente no GitHub. Ele possui centenas de milhares de commits e mais de duas décadas de evolução ininterrupta.

=== Estrutura de Pastas Central do Upstream ===
{| class="wikitable"
! Diretório Upstream !! Conteúdo Original !! Adaptação no MediaWiki TS
|-
| \`/includes/\` || Núcleo de lógica de negócios em PHP || Módulos TypeScript em \`/src/core/\` e \`/src/services/\`
|-
| \`/skins/\` || Temas visuais (Vector, Timeless, MinervaNeue) || Componentes React em \`/src/components/skins/\`
|-
| \`/languages/\` || Mensagens de tradução e internacionalização || Dicionários tipados i18n em \`/src/i18n/\`
|-
| \`/maintenance/\` || Scripts de manutenção via CLI || Ferramentas em [[Especial:Versão]] e [[Especial:GitHubSync]]
|-
| \`/docs/\` || Especificações arquiteturais e manuais || Artigos formatados em wikitexto neste wiki
|}

== Sincronização ao Vivo via API ==
Você pode inspecionar e puxar commits recentes, releases e arquivos do repositório upstream em tempo real através da página especial [[Especial:GitHubSync]]!

== Licença e Direitos Autorais ==
O MediaWiki é software livre distribuído sob os termos da licença GNU General Public License versão 2 ou posterior.

[[Categoria:Git]]
[[Categoria:Código Fonte]]
[[Categoria:Wikimedia]]
[[Categoria:MediaWiki]]`
  },

  'Wikimedia_Foundation': {
    slug: 'Wikimedia_Foundation',
    title: 'Wikimedia Foundation',
    namespace: 'Main',
    author: 'Wikimedista Comunitário',
    authorId: 'wikimedia_system',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_wmf',
    categories: ['Wikimedia', 'Organizações', 'Cultura Livre'],
    createdAt: '2026-11-01T06:00:00.000Z',
    updatedAt: '2026-11-02T10:15:00.000Z',
    summary: 'A fundação sem fins lucrativos que mantém a Wikipédia e o MediaWiki',
    content: `{{Infobox organização
| nome = Wikimedia Foundation, Inc.
| tipo = Organização sem fins lucrativos (501(c)(3))
| fundação = 20 de junho de 2003
| fundador = Jimmy Wales
| sede = São Francisco, Califórnia, EUA
| website = https://wikimediafoundation.org
}}

A '''Wikimedia Foundation, Inc.''' (WMF) é uma fundação sem fins lucrativos sediada em São Francisco, dedicada a incentivar o crescimento, desenvolvimento e distribuição de conteúdo livre e multilíngue.

== Projetos Mantidos ==
A fundação opera a infraestrutura global que disponibiliza:
* '''[[Wikipédia]]:''' A enciclopédia livre com mais de 60 milhões de artigos em centenas de idiomas.
* '''[[MediaWiki]]:''' A plataforma de software livre que sustenta todos os projetos.
* '''Wikimedia Commons:''' O repositório central de imagens, áudio e vídeo sob licenças abertas.
* '''Wikidata:''' Base de dados colaborativa estruturada para alimentar conhecimento em máquinas e humanos.
* '''Wikcionário:''' O dicionário e tesauro colaborativo livre.

== Missão ==
"''Capacitar e envolver as pessoas em todo o mundo para coletar e desenvolver conteúdo educacional sob uma licença livre ou no domínio público, e disseminá-lo de forma eficaz e global.''"

[[Categoria:Wikimedia]]
[[Categoria:Organizações]]
[[Categoria:Cultura Livre]]`
  }
};
