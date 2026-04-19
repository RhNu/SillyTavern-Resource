import { createScriptIdDiv } from '@util/script';
import { ROOT_ELEMENT_ID, SCRIPT_DISPLAY_NAME } from './constants';
import { type ControlLocation, type ControllerConfig, type ControllerState, type UiState } from './schema';

type ViewRefs = {
  header: HTMLElement;
  titleNode: HTMLElement;
  subtitleNode: HTMLElement;
  collapseButton: HTMLButtonElement;
  statusTagNode: HTMLElement;
  statusTextNode: HTMLElement;
  groupsNode: HTMLElement;
  autoApplyInput: HTMLInputElement;
  applyButton: HTMLButtonElement;
  importTextArea: HTMLTextAreaElement;
  importFormatSelect: HTMLSelectElement;
  importTextButton: HTMLButtonElement;
  importFileButton: HTMLButtonElement;
  importFileInput: HTMLInputElement;
};

function queryRequired<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`悬浮窗节点初始化失败: ${selector}`);
  }

  return element;
}

export class PresetControllerView {
  readonly root: HTMLElement;
  readonly refs: ViewRefs;
  private readonly doc: Document;
  private controlLocationMap = new Map<string, ControlLocation>();

  constructor(doc: Document) {
    this.doc = doc;

    const $root = createScriptIdDiv()
      .attr('id', ROOT_ELEMENT_ID)
      .attr('data-preset-controller-root', 'true')
      .addClass('preset-controller-root');
    $root.appendTo(doc.body ?? doc.documentElement);

    const root = $root[0];
    if (!root) {
      throw new Error('悬浮窗挂载失败。');
    }

    root.innerHTML = `
      <section class="preset-controller-card" aria-label="${SCRIPT_DISPLAY_NAME}">
        <header class="preset-controller-header" data-pc="drag-handle">
          <div class="preset-controller-title-wrap">
            <h2 class="preset-controller-title"></h2>
            <div class="preset-controller-subtitle"></div>
          </div>
          <div class="preset-controller-header-actions">
            <button type="button" class="preset-controller-header-btn" data-pc="collapse" aria-label="折叠">▾</button>
          </div>
        </header>
        <div class="preset-controller-body">
          <div class="preset-controller-status">
            <span class="preset-controller-status-tag is-idle" data-pc="status-tag">IDLE</span>
            <span class="preset-controller-status-text" data-pc="status-text"></span>
          </div>
          <div data-pc="groups"></div>
          <div class="preset-controller-toolbar">
            <label class="preset-controller-toggle-inline">
              <input type="checkbox" data-pc="auto-apply" />
              自动应用
            </label>
            <button type="button" class="preset-controller-action-btn" data-pc="apply">应用到 in_use</button>
          </div>
          <details class="preset-controller-import" open>
            <summary class="preset-controller-import-summary">导入规则集</summary>
            <div class="preset-controller-import-body">
              <textarea class="preset-controller-import-textarea" data-pc="import-text" placeholder="粘贴 JSON 或 YAML"></textarea>
              <div class="preset-controller-import-row">
                <select class="preset-controller-import-select" data-pc="import-format">
                  <option value="auto">自动识别</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
                <button type="button" class="preset-controller-action-btn" data-pc="import-text-btn">导入文本</button>
                <button type="button" class="preset-controller-action-btn" data-pc="import-file-btn">导入文件</button>
                <input type="file" accept=".json,.yaml,.yml,.txt" style="display:none" data-pc="import-file" />
              </div>
            </div>
          </details>
        </div>
      </section>
    `;

    this.root = root;
    this.refs = {
      header: queryRequired(root, '[data-pc="drag-handle"]'),
      titleNode: queryRequired(root, '.preset-controller-title'),
      subtitleNode: queryRequired(root, '.preset-controller-subtitle'),
      collapseButton: queryRequired(root, '[data-pc="collapse"]'),
      statusTagNode: queryRequired(root, '[data-pc="status-tag"]'),
      statusTextNode: queryRequired(root, '[data-pc="status-text"]'),
      groupsNode: queryRequired(root, '[data-pc="groups"]'),
      autoApplyInput: queryRequired(root, '[data-pc="auto-apply"]'),
      applyButton: queryRequired(root, '[data-pc="apply"]'),
      importTextArea: queryRequired(root, '[data-pc="import-text"]'),
      importFormatSelect: queryRequired(root, '[data-pc="import-format"]'),
      importTextButton: queryRequired(root, '[data-pc="import-text-btn"]'),
      importFileButton: queryRequired(root, '[data-pc="import-file-btn"]'),
      importFileInput: queryRequired(root, '[data-pc="import-file"]'),
    };
  }

  renderShell(state: ControllerState) {
    this.renderHeader(state.config);
    this.renderCollapsed(state.ui.collapsed);
    this.renderStatus(state);
    this.refs.autoApplyInput.checked = state.ui.autoApply;
    this.refs.importFormatSelect.value = state.ui.importFormat;
  }

  renderHeader(config: ControllerConfig) {
    this.refs.titleNode.textContent = config.title || SCRIPT_DISPLAY_NAME;
    this.refs.subtitleNode.textContent = config.description || '将规则映射到 in_use 预设提示词开关';
  }

  renderStatus(state: ControllerState) {
    this.refs.statusTagNode.className = `preset-controller-status-tag is-${state.statusLevel}`;
    this.refs.statusTagNode.textContent = state.statusLevel.toUpperCase();
    this.refs.statusTextNode.textContent = state.statusText;
    this.refs.applyButton.disabled = state.applying || (!state.dirty && state.ui.autoApply);
  }

  renderCollapsed(collapsed: boolean) {
    this.root.classList.toggle('is-collapsed', collapsed);
    this.refs.collapseButton.textContent = collapsed ? '▸' : '▾';
    this.refs.collapseButton.setAttribute('aria-label', collapsed ? '展开' : '折叠');
  }

  renderGroups(config: ControllerConfig, ui: UiState) {
    this.controlLocationMap.clear();
    this.refs.groupsNode.innerHTML = '';

    if (config.groups.length === 0) {
      const empty = this.doc.createElement('div');
      empty.className = 'preset-controller-empty';
      empty.textContent = '还没有规则，请通过“导入规则集”加载 JSON/YAML 配置。';
      this.refs.groupsNode.append(empty);
      return;
    }

    config.groups.forEach((group, groupIndex) => {
      const groupElement = this.doc.createElement('section');
      groupElement.className = 'preset-controller-group';
      groupElement.dataset.groupId = group.id;
      if (ui.groupCollapsed[group.id]) {
        groupElement.classList.add('is-collapsed');
      }

      const groupHeader = this.doc.createElement('div');
      groupHeader.className = 'preset-controller-group-header';

      const groupMeta = this.doc.createElement('div');
      groupMeta.className = 'preset-controller-group-meta';

      const groupTitle = this.doc.createElement('div');
      groupTitle.className = 'preset-controller-group-title';
      groupTitle.textContent = group.title;
      groupMeta.append(groupTitle);

      if (group.description) {
        const groupDescription = this.doc.createElement('div');
        groupDescription.className = 'preset-controller-group-description';
        groupDescription.textContent = group.description;
        groupMeta.append(groupDescription);
      }

      const groupToggle = this.doc.createElement('button');
      groupToggle.type = 'button';
      groupToggle.className = 'preset-controller-group-toggle';
      groupToggle.dataset.groupId = group.id;
      groupToggle.dataset.pcAction = 'toggle-group';
      groupToggle.textContent = ui.groupCollapsed[group.id] ? '▸' : '▾';

      groupHeader.append(groupMeta, groupToggle);

      const groupBody = this.doc.createElement('div');
      groupBody.className = 'preset-controller-group-body';

      group.items.forEach((item, itemIndex) => {
        const itemElement = this.doc.createElement('article');
        itemElement.className = 'preset-controller-item';

        const itemLabel = this.doc.createElement('div');
        itemLabel.className = 'preset-controller-item-label';
        itemLabel.textContent = item.label;
        itemElement.append(itemLabel);

        if (item.description) {
          const itemDescription = this.doc.createElement('div');
          itemDescription.className = 'preset-controller-item-description';
          itemDescription.textContent = item.description;
          itemElement.append(itemDescription);
        }

        const controlStack = this.doc.createElement('div');
        controlStack.className = 'preset-controller-control-stack';

        item.controls.forEach((control, controlIndex) => {
          this.controlLocationMap.set(control.id, {
            groupIndex,
            itemIndex,
            controlIndex,
          });

          if (control.type === 'switch') {
            const switchLabel = this.doc.createElement('label');
            switchLabel.className = 'preset-controller-switch';

            const switchInput = this.doc.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.checked = control.value;
            switchInput.dataset.controlId = control.id;
            switchInput.dataset.controlType = 'switch';

            const switchText = this.doc.createElement('span');
            switchText.textContent = control.label ?? control.id;
            switchText.title = `绑定: ${control.targets.join('、')}`;

            switchLabel.append(switchInput, switchText);
            controlStack.append(switchLabel);
            return;
          }

          const radioGroup = this.doc.createElement('fieldset');
          radioGroup.className = 'preset-controller-radio-group';

          const radioLabel = this.doc.createElement('div');
          radioLabel.className = 'preset-controller-radio-label';
          radioLabel.textContent = control.label ?? control.id;
          radioGroup.append(radioLabel);

          control.options.forEach(option => {
            const optionLabel = this.doc.createElement('label');
            optionLabel.className = 'preset-controller-radio-option';

            const optionInput = this.doc.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `preset-controller-${control.id}`;
            optionInput.value = option.value;
            optionInput.checked = option.value === control.value;
            optionInput.dataset.controlId = control.id;
            optionInput.dataset.controlType = 'radio';

            const optionText = this.doc.createElement('span');
            optionText.textContent = option.label;
            optionText.title = `绑定: ${option.targets.join('、')}`;

            optionLabel.append(optionInput, optionText);
            radioGroup.append(optionLabel);
          });

          controlStack.append(radioGroup);
        });

        itemElement.append(controlStack);
        groupBody.append(itemElement);
      });

      groupElement.append(groupHeader, groupBody);
      this.refs.groupsNode.append(groupElement);
    });
  }

  getControlLocation(controlId: string): ControlLocation | undefined {
    return this.controlLocationMap.get(controlId);
  }

  getImportText() {
    return this.refs.importTextArea.value;
  }

  clearFileInput() {
    this.refs.importFileInput.value = '';
  }

  setPosition(left: number, top: number) {
    this.root.style.left = `${Math.round(left)}px`;
    this.root.style.top = `${Math.round(top)}px`;
  }

  getRect() {
    return this.root.getBoundingClientRect();
  }

  destroy() {
    this.root.remove();
  }
}
