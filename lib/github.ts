const GITHUB_API = 'https://api.github.com';
const REPO = 'zawfii/spotto';
const BASE_BRANCH = 'main';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function githubFetch(pathname: string, init?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${pathname}`, { ...init, headers: { ...headers(), ...init?.headers } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${pathname} failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function getRefSha(branch: string): Promise<string> {
  const data = await githubFetch(`/repos/${REPO}/git/ref/heads/${branch}`);
  return data.object.sha;
}

async function createBranch(branchName: string, fromSha: string): Promise<void> {
  await githubFetch(`/repos/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
  });
}

async function getFileSha(filePath: string, branch: string): Promise<string | undefined> {
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${filePath}?ref=${branch}`, { headers: headers() });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub API get contents ${filePath} failed: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

async function putFile(filePath: string, contentBase64: string, message: string, branch: string): Promise<void> {
  const sha = await getFileSha(filePath, branch);
  await githubFetch(`/repos/${REPO}/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: contentBase64, branch, sha }),
  });
}

async function getFileText(filePath: string, branch: string): Promise<string> {
  const data = await githubFetch(`/repos/${REPO}/contents/${filePath}?ref=${branch}`);
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

export type CategoryPRInput = {
  categoryId: string;
  categoryName: string;
  flatIconBase64: string;
  topIconBase64: string;
  reasoning: string;
  occurrenceCount: number;
  exampleDishName: string;
};

export async function openCategoryPR(input: CategoryPRInput): Promise<{ prUrl: string }> {
  const branchName = `bot/new-category-${input.categoryId}`;
  const baseSha = await getRefSha(BASE_BRANCH);
  await createBranch(branchName, baseSha);

  await putFile(
    `assets/icons/${input.categoryId}.png`,
    input.flatIconBase64,
    `feat(categories): add ${input.categoryId} flat icon`,
    branchName
  );
  await putFile(
    `assets/icons/top/${input.categoryId}.png`,
    input.topIconBase64,
    `feat(categories): add ${input.categoryId} top icon`,
    branchName
  );

  // data/mockData.ts — insert one entry before the closing `];` of ALL_CATEGORIES
  const mockData = await getFileText('data/mockData.ts', branchName);
  const newEntry = `  { id: '${input.categoryId}', name: '${input.categoryName}', image: require('../assets/icons/${input.categoryId}.png') as number, topicImage: require('../assets/icons/top/${input.categoryId}.png') as number, icon: null },\n`;
  const categoriesEndMarker = /\n(\];\s*\n\nexport const DEFAULT_CATEGORY_IDS)/;
  if (!categoriesEndMarker.test(mockData)) {
    throw new Error('Could not locate ALL_CATEGORIES closing marker in data/mockData.ts — file shape may have changed');
  }
  const patchedMockData = mockData.replace(categoriesEndMarker, `\n${newEntry}$1`);
  await putFile(
    'data/mockData.ts',
    Buffer.from(patchedMockData).toString('base64'),
    `feat(categories): register ${input.categoryId} in ALL_CATEGORIES`,
    branchName
  );

  // app/(tabs)/add.tsx — new dishToTemplateKey() branch, mapped to the generic 'restaurant' template
  const addTsx = await getFileText('app/(tabs)/add.tsx', branchName);
  const dishKeyword = input.exampleDishName.toLowerCase().split(/\s+/)[0];
  const newBranch = `  if (d.includes('${dishKeyword}')) return 'restaurant'; // ${input.categoryName} — auto-added, generic template pending manual review\n  return null;`;
  const returnNullMarker = /\n(\s*)return null;\n\}\n\nconst SEARCH_SUGGESTIONS/;
  if (!returnNullMarker.test(addTsx)) {
    throw new Error('Could not locate dishToTemplateKey() closing marker in app/(tabs)/add.tsx — file shape may have changed');
  }
  const patchedAddTsx = addTsx.replace(returnNullMarker, `\n${newBranch}\n}\n\nconst SEARCH_SUGGESTIONS`);
  await putFile(
    'app/(tabs)/add.tsx',
    Buffer.from(patchedAddTsx).toString('base64'),
    `feat(categories): match "${dishKeyword}" to new ${input.categoryId} category`,
    branchName
  );

  const pr = await githubFetch(`/repos/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Add "${input.categoryName}" dish category`,
      head: branchName,
      base: BASE_BRANCH,
      body: [
        `AI-suggested new dish category, approved in spotto-admin.`,
        ``,
        `- **Occurrences:** ${input.occurrenceCount}`,
        `- **Example dish:** ${input.exampleDishName}`,
        `- **AI reasoning:** ${input.reasoning}`,
        ``,
        `Uses the generic \`restaurant\` rating template for now — add a bespoke \`CATEGORY_TEMPLATES\` entry by hand in \`app/(tabs)/add.tsx\` if this category deserves custom rating aspects/tags.`,
        ``,
        `Please eyeball the two new icons below against the existing set before merging.`,
      ].join('\n'),
    }),
  });

  return { prUrl: pr.html_url };
}
