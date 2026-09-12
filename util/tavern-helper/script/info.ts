export async function loadReadme(url: string): Promise<boolean> {
  const response = await fetch(url);
  if (!response.ok) return false;
  replaceScriptInfo(await response.text());
  return true;
}
