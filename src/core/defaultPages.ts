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
    protectionLevel: 'locked',
    isLocked: true,
    protectionReason: 'Página inicial protegida por alta visibilidade e integridade do portal',
    protectedBy: 'Administração',
    protectedByUid: 'system_admin',
    protectedAt: '2026-11-01T00:00:00.000Z',
    protectionExpiry: 'infinity',
    content: `{{Infobox software
| nome = WikiWazzimaGiygg
| logotipo = /assets/aistudio/image_19fe7a14.png
| desenvolvedor = Comunidade de Código Aberto
| versão_estável = 1.0.0-ts
| linguagem = TypeScript (anteriormente PHP)
| banco_de_dados = Google Cloud Firestore (em tempo real)
| licença = GPL v2.0+ / MIT
| repositório = https://github.com/WazzimaGiygg/WikiWazzimaGiygg
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
  },

  'Wiki:Código_Universal_de_Conduta': {
    slug: 'Wiki:Código_Universal_de_Conduta',
    title: 'Wiki:Código Universal de Conduta',
    namespace: 'Wiki',
    author: 'Comitê de Governança',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_ucoc',
    categories: ['Políticas', 'Governança', 'UCoC'],
    createdAt: '2026-11-01T05:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
    summary: 'Instituição do Código Universal de Conduta (UCoC) do WikiWazzimaGiygg',
    protectionLevel: 'semi_protected',
    isLocked: false,
    protectionReason: 'Política oficial de conduta da comunidade',
    content: `{{Aviso|Esta página define a política mandatória de convivência e conduta comunitária no WikiWazzimaGiygg.}}

== Introdução ao Código Universal de Conduta (UCoC) ==
O '''Código Universal de Conduta (UCoC)''' estabelece uma linha de base comum de comportamento aceitável para todos os editores, voluntários, administradores e burocratas do WikiWazzimaGiygg. Nosso objetivo é manter um ambiente seguro, colaborativo e livre de hostilidade.

== Princípios Fundamentais ==
# '''Respeito Mútuo:''' Trate todas as pessoas com civilidade e consideração, mesmo durante disputas editoriais acirradas.
# '''Pressuposição de Boa-fé:''' A menos que haja evidência clara e inequívoca de má intenção, assuma que os colegas editores estão tentando melhorar o projeto.
# '''Inclusão e Diversidade:''' É vedada qualquer forma de preconceito ou discriminação por motivo de raça, etnia, gênero, orientação sexual, crença ou nacionalidade.
# '''Resolução Construtiva de Conflitos:''' Discuta o conteúdo e os argumentos, nunca a pessoa do editor.

== Condutas Inaceitáveis ==
As seguintes práticas são passíveis de bloqueio imediato e sanção pelo Conselho de Arbitragem:
* '''Assédio e Perseguição (Wikihounding):''' Seguir sistematicamente as edições de outro usuário com objetivo de intimidação.
* '''Discurso de Ódio:''' Publicação de ofensas e difamações.
* '''Abuso de Poder:''' Uso indevido de ferramentas administrativas para prevalecer em disputas editoriais.
* '''Doxxing:''' Divulgação não autorizada de dados pessoais reais de qualquer editor.

== Portal de Denúncias ==
Para reportar violações ao UCoC com análise administrativa sigilosa, acesse [[Especial:UCOC]].

[[Categoria:Políticas]]
[[Categoria:Governança]]
[[Categoria:UCoC]]`
  },

  'Wiki:Conselho_de_Arbitragem': {
    slug: 'Wiki:Conselho_de_Arbitragem',
    title: 'Wiki:Conselho de Arbitragem',
    namespace: 'Wiki',
    author: 'Burocratas',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_arbcom',
    categories: ['Políticas', 'ArbCom', 'Governança'],
    createdAt: '2026-11-01T06:00:00.000Z',
    updatedAt: '2026-11-02T10:30:00.000Z',
    summary: 'Regimento do Conselho de Arbitragem (ArbCom)',
    protectionLevel: 'locked',
    isLocked: true,
    protectionReason: 'Regimento do órgão máximo de apelação e disputas comunitárias',
    content: `{{Infobox software
| título = Conselho de Arbitragem (ArbCom)
| atribuição = Última Instância de Resolução de Conflitos
| decisões = Vinculativas para todos os editores
}}

O '''Conselho de Arbitragem (ArbCom)''' atua como o tribunal de última instância para resolver disputas insolúveis de conduta e condutas editoriais graves no WikiWazzimaGiygg.

== Jurisdição ==
O Conselho não julga a veracidade factual de artigos nem atua como autoridade enciclopédica; sua competência restringe-se a:
* Conflitos de conduta persistentes não sanados por mediação regular.
* Recursos contra bloqueios e sanções prolongadas.
* Investigação de abusos de ferramentas avançadas por administradores e burocratas.

== Procedimento de um Caso ==
# '''Abertura do Caso:''' O requerente submete a petição contendo partes envolvidas, evidências e tentativas prévias de resolução.
# '''Fase de Admissibilidade:''' Os árbitros votam aceitar ou rejeitar o caso.
# '''Audiência e Evidências:''' As partes e testemunhas apresentam registros de difs e argumentos.
# '''Deliberação e Veredito:''' O conselho publica determinações e remédios obrigatórios.

Gerencie ou consulte os casos em andamento em [[Especial:Conselho_de_Arbitragem]].

[[Categoria:Políticas]]
[[Categoria:ArbCom]]`
  },

  'Wiki:Verificação_de_contas': {
    slug: 'Wiki:Verificação_de_contas',
    title: 'Wiki:Verificação de contas',
    namespace: 'Wiki',
    author: 'CheckUsers',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_checkuser',
    categories: ['Políticas', 'CheckUser', 'Segurança'],
    createdAt: '2026-11-01T07:00:00.000Z',
    updatedAt: '2026-11-02T11:00:00.000Z',
    summary: 'Política de Verificação de Contas e Contas Fantoche (Sockpuppets)',
    protectionLevel: 'semi_protected',
    isLocked: false,
    protectionReason: 'Política oficial de combate a fantoches',
    content: `{{Aviso|O uso indevido de múltiplas contas (fantoches ou sockpuppets) para forjar consenso ou burlar sanções é expressamente proibido.}}

== O que é a Verificação de Contas? ==
A ferramenta de '''Verificação de Contas''' (equivalente ao ''CheckUser'' do MediaWiki) permite que verificadores credenciados e administradores examinem padrões comportamentais, registros de alterações simultâneas e UIDs para identificar o uso indevido de contas fantoche.

== Uso Permitido vs. Proibido ==
* '''Permitido com aviso:''' Ter contas secundárias devidamente identificadas para testes de interface ou bots automatizados.
* '''Proibido:'''
** Votar mais de uma vez em consultas à comunidade ou votações de desbloqueio.
** Burlar bloqueios ou restrições de edição.
** Criar a ilusão de consenso comunitário em discussões acaloradas.
** Fazer guerras de edições coordenadas.

== Abertura de Investigações ==
Para solicitar uma apuração contra contas suspeitas, visite [[Especial:CheckUser]].

[[Categoria:Políticas]]
[[Categoria:CheckUser]]`
  },

  'Wiki:Discussão_de_bloqueio': {
    slug: 'Wiki:Discussão_de_bloqueio',
    title: 'Wiki:Discussão de bloqueio',
    namespace: 'Wiki',
    author: 'Administração',
    authorId: 'system_admin',
    revisionCount: 1,
    latestRevisionId: 'rev_initial_unblock',
    categories: ['Políticas', 'Administração'],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-02T11:30:00.000Z',
    summary: 'Regras para pedidos de revisão e discussão de desbloqueio',
    protectionLevel: 'semi_protected',
    isLocked: false,
    content: `{{Aviso|Usuários bloqueados possuem o direito de recorrer da decisão através de um pedido formal fundamentado.}}

== Como Funciona a Discussão de Desbloqueio ==
Quando uma conta é submetida a um bloqueio disciplinar, ela pode protocolar um recurso argumentando sobre as circunstâncias da ação, eventuais mal-entendidos ou demonstrando compromisso de adesão ao [[Wiki:Código_Universal_de_Conduta]].

== Fases do Processo ==
# '''Protocolo:''' O usuário bloqueado indica o motivo pelo qual entende que a medida deve ser revogada ou atenuada.
# '''Deliberação Comunitária:''' Administradores e editores ativos emitem votos com justificativas (''Desbloquear'', ''Manter bloqueio'', ''Neutro'').
# '''Decisão e Execução:''' Um burocrata encerra a deliberação. Caso aprovado, o papel \`bloqueado\` é automaticamente revogado no Firestore.

Acesse a lista de pedidos e delibere em [[Especial:Discussão_de_desbloqueio]].

[[Categoria:Políticas]]
[[Categoria:Administração]]`
  }
};

