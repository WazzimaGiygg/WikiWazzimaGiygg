export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  license: { name: string; spdx_id: string } | null;
  updated_at: string;
  pushed_at?: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
}

export const OFFICIAL_REPO_URL = 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg';
export const OFFICIAL_REPO_NAME = 'WazzimaGiygg/WikiWazzimaGiygg';

// Cached baseline data from https://github.com/WazzimaGiygg/WikiWazzimaGiygg
const FALLBACK_REPO_INFO: GitHubRepoInfo = {
  name: 'WikiWazzimaGiygg',
  full_name: 'WazzimaGiygg/WikiWazzimaGiygg',
  description: 'WikiWazzimaGiygg - Engine Wiki em TypeScript e Google Cloud Firestore em tempo real.',
  html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg',
  stargazers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  default_branch: 'main',
  license: { name: 'GNU General Public License v2.0 or later', spdx_id: 'GPL-2.0-or-later' },
  updated_at: '2026-11-02T16:57:59Z',
  pushed_at: '2026-11-02T15:41:50Z',
};

// Real commits recorded in https://github.com/WazzimaGiygg/WikiWazzimaGiygg
const FALLBACK_COMMITS: GitHubCommit[] = [
  {
    sha: '55cf822',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:41:49Z' },
      message: 'feat(auth): implement automatic user page generation\n\n- Add `ensureUserPagesExist` to automate creation of User and Talk namespaces.\n- Extend `WikiUser` type with user-specific page metadata.\n- Update `slugify` to support parentheses.\n- Integrate user page navigation in UI components.',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/55cf822',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
  {
    sha: '4a42889',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:33:20Z' },
      message: 'feat: enforce authenticated edits for all wiki actions\n\nRestrict page creation, editing, and discussion interactions to authenticated users only. Updated Firestore security rules and UI components to block anonymous contributions and prompt for login.',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/4a42889',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
  {
    sha: '9e9afc6',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:24:10Z' },
      message: 'feat: add project logo and infobox support\n\nIntegrate the project logo into the UI and infoboxes. Added icon assets, updated header/sidebar components, and extended the wikitext parser to support image rendering in infoboxes.',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/9e9afc6',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
  {
    sha: 'a344e8a',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:21:49Z' },
      message: 'chore: rename project to WikiWazzimaGiygg\n\nUpdate all branding, default pages, and site metadata to reflect the new project name.',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/a344e8a',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
  {
    sha: 'fcb7430',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:03:39Z' },
      message: 'feat: scaffold MediaWiki TS application\n\nInitialize the project with React, TypeScript, Vite, and Tailwind CSS. Setup the core configuration, project structure, and global styling to support the MediaWiki-like architecture.',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/fcb7430',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
  {
    sha: '77eedee',
    commit: {
      author: { name: 'WazzimaGiygg', date: '2026-11-02T15:03:27Z' },
      message: 'Initial commit',
    },
    html_url: 'https://github.com/WazzimaGiygg/WikiWazzimaGiygg/commit/77eedee',
    author: {
      login: 'WazzimaGiygg',
      avatar_url: 'https://avatars.githubusercontent.com/u/40279038?v=4',
      html_url: 'https://github.com/WazzimaGiygg',
    },
  },
];

export async function fetchWikiRepoInfo(repo = OFFICIAL_REPO_NAME): Promise<GitHubRepoInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();
    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description || FALLBACK_REPO_INFO.description,
      html_url: data.html_url,
      stargazers_count: data.stargazers_count ?? 0,
      forks_count: data.forks_count ?? 0,
      open_issues_count: data.open_issues_count ?? 0,
      default_branch: data.default_branch || 'main',
      license: data.license,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
    };
  } catch (err) {
    console.warn('Usando dados em cache do repositório WikiWazzimaGiygg:', err);
    return FALLBACK_REPO_INFO;
  }
}

// Backward-compatible alias
export const fetchWikimediaRepoInfo = fetchWikiRepoInfo;

export async function fetchRecentCommits(repo = OFFICIAL_REPO_NAME): Promise<GitHubCommit[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=20`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();
    return data.map((item: any) => ({
      sha: item.sha.substring(0, 7),
      commit: {
        author: {
          name: item.commit.author.name,
          date: item.commit.author.date,
        },
        message: item.commit.message,
      },
      html_url: item.html_url,
      author: item.author
        ? {
            login: item.author.login,
            avatar_url: item.author.avatar_url,
            html_url: item.author.html_url,
          }
        : null,
    }));
  } catch (err) {
    console.warn('Usando commits em cache devido a limites da API do GitHub:', err);
    return FALLBACK_COMMITS;
  }
}

export async function fetchRepoReadme(repo = OFFICIAL_REPO_NAME, branch = 'main'): Promise<string> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/README.md`);
    if (!res.ok) throw new Error(`README.md não encontrado no branch ${branch}`);
    return await res.text();
  } catch {
    return `# WikiWazzimaGiygg
Repositório oficial: [${OFFICIAL_REPO_URL}](${OFFICIAL_REPO_URL})

Engine Wiki completa com renderização wikitext, suporte a extensões dinâmicas sincronizadas no Firebase Firestore, painel de burocratas e controle de permissões.`;
  }
}
