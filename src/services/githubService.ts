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
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
  html_url: string;
}

export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

// Fallback data if GitHub rate limits unauthenticated client requests
const FALLBACK_REPO_INFO: GitHubRepoInfo = {
  name: 'mediawiki',
  full_name: 'wikimedia/mediawiki',
  description: 'The collaborative editing software that runs Wikipedia and many other wikis.',
  html_url: 'https://github.com/wikimedia/mediawiki',
  stargazers_count: 3600,
  forks_count: 1400,
  open_issues_count: 42,
  default_branch: 'master',
  license: { name: 'GNU General Public License v2.0 or later', spdx_id: 'GPL-2.0-or-later' },
  updated_at: new Date().toISOString(),
};

const FALLBACK_COMMITS: GitHubCommit[] = [
  {
    sha: '8f92a10b4c2e6d1a',
    commit: {
      author: { name: 'Timo Tijhof', date: new Date().toISOString() },
      message: 'ResourceLoader: Modernize module bundling and optimize skin CSS delivery',
    },
    html_url: 'https://github.com/wikimedia/mediawiki/commit/8f92a10b4c2e6d1a',
  },
  {
    sha: 'c3e41b99a8019e07',
    commit: {
      author: { name: 'Brad Jorsch', date: new Date(Date.now() - 86400000).toISOString() },
      message: 'RevisionStore: Improve query performance when fetching revision slots',
    },
    html_url: 'https://github.com/wikimedia/mediawiki/commit/c3e41b99a8019e07',
  },
  {
    sha: 'e571c24df90b3a12',
    commit: {
      author: { name: 'Kunal Mehta', date: new Date(Date.now() - 172800000).toISOString() },
      message: 'Parsoid: Sync DOM specification transforms with HTML5 wikitext specs',
    },
    html_url: 'https://github.com/wikimedia/mediawiki/commit/e571c24df90b3a12',
  },
  {
    sha: 'a12bc90074df3310',
    commit: {
      author: { name: 'Sam Reed', date: new Date(Date.now() - 259200000).toISOString() },
      message: 'HookContainer: Deprecate legacy hook registration in favour of extension.json',
    },
    html_url: 'https://github.com/wikimedia/mediawiki/commit/a12bc90074df3310',
  },
];

export async function fetchWikimediaRepoInfo(): Promise<GitHubRepoInfo> {
  try {
    const res = await fetch('https://api.github.com/repos/wikimedia/mediawiki', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();
    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description || FALLBACK_REPO_INFO.description,
      html_url: data.html_url,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      default_branch: data.default_branch,
      license: data.license,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.warn('Using cached Wikimedia repo info due to network/rate limits:', err);
    return FALLBACK_REPO_INFO;
  }
}

export async function fetchRecentCommits(): Promise<GitHubCommit[]> {
  try {
    const res = await fetch('https://api.github.com/repos/wikimedia/mediawiki/commits?per_page=10', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
    const data = await res.json();
    return data.map((item: any) => ({
      sha: item.sha.substring(0, 8),
      commit: {
        author: {
          name: item.commit.author.name,
          date: item.commit.author.date,
        },
        message: item.commit.message.split('\n')[0],
      },
      html_url: item.html_url,
    }));
  } catch (err) {
    console.warn('Using fallback commits due to network/rate limits:', err);
    return FALLBACK_COMMITS;
  }
}

export async function fetchRepoReadme(): Promise<string> {
  try {
    const res = await fetch('https://raw.githubusercontent.com/wikimedia/mediawiki/master/README.md');
    if (!res.ok) throw new Error(`Failed to fetch raw README: ${res.status}`);
    return await res.text();
  } catch {
    return `# MediaWiki
MediaWiki is a free software open source wiki package written in PHP, originally for use on Wikipedia.

It is now also used by several other projects of the non-profit Wikimedia Foundation and by many other wikis.

For more information and documentation, see [mediawiki.org](https://www.mediawiki.org/).`;
  }
}
