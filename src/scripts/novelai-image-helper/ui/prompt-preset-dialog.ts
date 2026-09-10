/** Open the naming dialog used by prompt-preset "Save as" actions. */
export async function requestPromptPresetName(): Promise<string | undefined> {
  if (typeof SillyTavern?.callGenericPopup !== 'function' || typeof SillyTavern?.POPUP_TYPE === 'undefined') {
    throw new Error('命名弹窗接口不可用，请检查酒馆版本');
  }

  const result = await SillyTavern.callGenericPopup(
    $('<div>').text('请输入新的图像提示词预设名称'),
    SillyTavern.POPUP_TYPE.INPUT,
    '',
    { okButton: '保存', cancelButton: '取消' },
  );
  return typeof result === 'string' ? result : undefined;
}
