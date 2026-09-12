import { compare } from 'compare-versions';

export async function checkMinimumVersion(expected: string, title: string): Promise<void> {
  if (compare(await getTavernHelperVersion(), expected, '<')) {
    toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
  }
}
