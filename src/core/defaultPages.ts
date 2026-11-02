import { WikiPage } from '../types/wiki';

export const INITIAL_PAGES: Record<string, WikiPage> = {
  'Página_principal': {
    slug: 'Página_principal',
    title: 'Página principal',
    namespace: 'Main',
    author: 'Comunidade WikiWazzimaGiygg',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_wazzima_main',
    categories: ['Portais', 'WikiWazzimaGiygg'],
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
    summary: 'Criação da Página Principal do WikiWazzimaGiygg',
    content: `{{Infobox software
| nome = WikiWazzimaGiygg
| logotipo = /assets/aistudio/image_19fe7a14.png
| desenvolvedor = Comunidade de Código Aberto
| versão_estável = 1.0.0-ts
| linguagem = TypeScript (anteriormente PHP)
| banco_de_dados = Google Cloud Firestore (em tempo real)
| licença = GPL v2.0+ / MIT
| repositório = https://github.com/wikimedia/mediawiki
}}

'''Bem-vindo(a) ao WikiWazzimaGiygg''', a plataforma wiki livre desenvolvida com a interface e experiência clássica do MediaWiki, adaptada para '''TypeScript''' e '''Google Cloud Firestore'''.

Todos os artigos, revisões e discussões deste sistema são armazenados e sincronizados em tempo real diretamente com o banco de dados Firebase Firestore.

== Arquitetura e Tecnologia ==
O WikiWazzimaGiygg substitui o paradigma tradicional por tecnologias modernas:

* '''Do PHP para TypeScript:''' Lógica de negócio, analisador sintático de wikitexto e renderizador de componentes totalmente tipados e modulares.
* '''Do SQL relacional para Firestore NoSQL:''' Dados sincronizados em tempo real com escutas reativas (\`onSnapshot\`).
* '''Sintaxe Wikitexto Completa:''' Cabeçalhos, negrito, itálico, tabelas, notas de rodapé (\`<ref>\` e \`<references />\`), predefinições e links internos com verificação de páginas existentes.
* '''Tema Vector:''' Navegação inspirada no visual clássico com suporte a abas de leitura, edição wikitexto, histórico com comparação de versões (diff) e discussões.

== Páginas Recomendadas ==
{| class="wikitable" style="width:100%; text-align:left;"
! Seção !! Descrição !! Link
|-
| '''Arquitetura do Sistema'''
| Estrutura técnica e comparação do modelo NoSQL
| [[Arquitetura_WikiWazzimaGiygg]]
|-
| '''Manual de Configuração'''
| Como gerenciar opções no LocalSettings.ts
| [[Manual:LocalSettings.ts]]
|-
| '''Guia de Edição'''
| Aprenda a formatar artigos em wikitexto
| [[Ajuda:Wikitexto]]
|-
| '''Índice Geral'''
| Explore todas as páginas armazenadas no Firestore
| [[Especial:Todas_as_páginas]]
|}

[[Categoria:Portais]]
[[Categoria:WikiWazzimaGiygg]]
[[Categoria:TypeScript]]`
  },

  'Arquitetura_WikiWazzimaGiygg': {
    slug: 'Arquitetura_WikiWazzimaGiygg',
    title: 'Arquitetura WikiWazzimaGiygg',
    namespace: 'Main',
    author: 'Equipe de Engenharia',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_wazzima_arch',
    categories: ['Arquitetura', 'TypeScript', 'Firebase'],
    createdAt: '2026-11-01T02:00:00.000Z',
    updatedAt: '2026-11-02T11:00:00.000Z',
    summary: 'Documentação da arquitetura TypeScript e Firestore do WikiWazzimaGiygg',
    content: `{{Infobox software
| título = Arquitetura WikiWazzimaGiygg
| paradigma = Reativo, Componentizado e Orientado a Eventos
| frontend = React 19 + Tailwind CSS + Lucide
| backend = TypeScript + Express
| armazenamento = Google Cloud Firestore (NoSQL em tempo real)
}}

O '''WikiWazzimaGiygg''' foi construído adaptando o núcleo clássico de wikis para o ecossistema moderno de TypeScript e Firebase Firestore.

== Camada de Dados no Firestore ==
Todos os dados residem nas seguintes coleções do banco de dados:

* \`/wiki_pages/{slug}\`: Documento principal de cada artigo.
* \`/wiki_pages/{slug}/revisions/{revId}\`: Histórico de versões imutáveis para auditoria e reversão.
* \`/wiki_pages/{slug}/talks/{talkId}\`: Tópicos de discussão em tempo real.
* \`/recent_changes/{changeId}\`: Registro cronológico de edições.
* \`/wiki_settings/global\`: Configurações globais equivalentes ao antigo LocalSettings.php.

== O Motor de Diffs ==
O sistema inclui um algoritmo comparador de revisões em TypeScript (\`/src/core/diff.ts\`), permitindo comparar qualquer par de revisões no histórico com destaque de linhas e palavras adicionadas ou removidas.

[[Categoria:Arquitetura]]
[[Categoria:TypeScript]]
[[Categoria:Firebase]]`
  },

  'Manual:LocalSettings.ts': {
    slug: 'Manual:LocalSettings.ts',
    title: 'Manual:LocalSettings.ts',
    namespace: 'Manual',
    author: 'Administrador do Sistema',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_settings',
    categories: ['Manual', 'Configuração', 'WikiWazzimaGiygg'],
    createdAt: '2026-11-01T03:00:00.000Z',
    updatedAt: '2026-11-02T08:00:00.000Z',
    summary: 'Configuração central do WikiWazzimaGiygg',
    content: `{{Infobox software
| título = LocalSettings.ts
| função = Arquivo de Configuração Principal
| formato = TypeScript / Objeto JSON Reativo
}}

No '''WikiWazzimaGiygg''', o arquivo de configuração é o \`LocalSettings.ts\`, operando com tipagem rigorosa e sincronização reativa com o Firestore.

== Opções Configuráveis ==
* '''sitename:''' "WikiWazzimaGiygg"
* '''languageCode:''' "pt-br"
* '''allowAnonymousEditing:''' Permite edições de convidados/anônimos.
* '''enableLivePreview:''' Habilita pré-visualização instantânea enquanto digita.
* '''defaultSkin:''' Tema padrão (Vector 2022, Vector Clássico ou Modo Escuro).

Você pode alterar estas configurações clicando em '''Ferramentas > Configurações da Wiki''' na barra lateral!

[[Categoria:Manual]]
[[Categoria:Configuração]]`
  },

  'Ajuda:Wikitexto': {
    slug: 'Ajuda:Wikitexto',
    title: 'Ajuda:Wikitexto',
    namespace: 'Help',
    author: 'Equipe de Documentação',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_help',
    categories: ['Ajuda', 'Documentação', 'Wikitexto'],
    createdAt: '2026-11-01T04:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
    summary: 'Guia completo de formatação de wikitexto',
    content: `{{Aviso|Este guia ensina a formatar artigos no WikiWazzimaGiygg.}}

O '''Wikitexto''' é a linguagem de formatação utilizada para estruturar artigos.

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

== Cabeçalhos e Índice ==
<syntaxhighlight lang="text">
== Seção Principal (H2) ==
=== Subseção (H3) ===
</syntaxhighlight>

== Ligações (Links) ==
* '''Link Interno:''' \`[[Página_principal]]\`
* '''Link com Rótulo:''' \`[[Página_principal|Início]]\`
* Se o artigo não existir no Firebase, o link aparecerá em '''vermelho'''!

[[Categoria:Ajuda]]
[[Categoria:Documentação]]
[[Categoria:Wikitexto]]`
  }
};
