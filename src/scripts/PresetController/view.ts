import { openHelpPopup } from '@util/components/HelpMarker';
import { SCRIPT_DISPLAY_NAME } from './constants';
import { type ControlLocation, type ControllerConfig, type ControllerOperation } from './schema';
import { type ControllerState, type UiState } from './state';

type ViewRefs = {
  launcher: HTMLElement;
  header: HTMLElement;
  titleNode: HTMLElement;
  titleHelpHost: HTMLElement;
  collapseButton: HTMLButtonElement;
  statusTagNode: HTMLElement;
  statusTextNode: HTMLElement;
  groupsNode: HTMLElement;
  applyButton: HTMLButtonElement;
};

function queryRequired<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`悬浮窗节点初始化失败: ${selector}`);
  }

  return element;
}

function createHelpMarker(doc: Document, title: string, text: string) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'th-help-marker preset-controller-help-marker';
  button.setAttribute('aria-label', title);
  button.title = title;
  button.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openHelpPopup(title, text);
  });
  return button;
}

function replaceHelpMarker(host: HTMLElement, doc: Document, title: string, text?: string) {
  host.innerHTML = '';
  if (!text?.trim()) {
    return;
  }

  host.append(createHelpMarker(doc, title, text));
}

function formatOperation(operation: ControllerOperation) {
  if (operation.type === 'set-prompt-enabled') {
    return `将「${operation.target}」设为${operation.enabled ? '启用' : '禁用'}`;
  }

  return operation.type;
}

function formatOperationsSummary(title: string, operations: ControllerOperation[], description?: string) {
  const lines: string[] = [];
  if (description) {
    lines.push(description);
  }

  lines.push(title);

  if (operations.length === 0) {
    lines.push('未配置操作');
    return lines.join('\n');
  }

  operations.forEach(operation => {
    lines.push(`- ${formatOperation(operation)}`);
  });

  return lines.join('\n');
}

export class PresetControllerView {
  readonly root: HTMLElement;
  readonly refs: ViewRefs;
  private readonly doc: Document;
  private controlLocationMap = new Map<string, ControlLocation>();

  constructor(doc: Document, root: HTMLElement) {
    this.doc = doc;
    this.root = root;

    root.innerHTML = `
      <section class="preset-controller-card" aria-label="${SCRIPT_DISPLAY_NAME}">
        <div
          class="preset-controller-launcher preset-controller-drag-handle"
          data-pc="launcher"
          role="button"
          tabindex="0"
          aria-label="展开 ${SCRIPT_DISPLAY_NAME}"
          title="${SCRIPT_DISPLAY_NAME}"
        >
          <i class="fa-solid fa-sliders"></i>
        </div>
        <div class="preset-controller-panel">
          <header class="preset-controller-header preset-controller-drag-handle" data-pc="drag-handle">
            <div class="preset-controller-title-row">
              <h2 class="preset-controller-title"></h2>
              <span class="preset-controller-title-help" data-pc="title-help"></span>
            </div>
            <div class="preset-controller-header-actions">
              <button
                type="button"
                class="preset-controller-header-btn"
                data-pc="collapse"
                data-pc-no-drag="true"
                aria-label="收起"
                title="收起"
              >
                <i class="fa-solid fa-minus"></i>
              </button>
            </div>
          </header>
          <div class="preset-controller-body">
            <div class="preset-controller-status">
              <span class="preset-controller-status-tag is-idle" data-pc="status-tag">IDLE</span>
              <span class="preset-controller-status-text" data-pc="status-text"></span>
            </div>
            <div data-pc="groups"></div>
            <div class="preset-controller-toolbar">
              <button type="button" class="preset-controller-action-btn" data-pc="apply">应用到 in_use</button>
            </div>
          </div>
        </div>
      </section>
    `;

    this.refs = {
      launcher: queryRequired(root, '[data-pc="launcher"]'),
      header: queryRequired(root, '[data-pc="drag-handle"]'),
      titleNode: queryRequired(root, '.preset-controller-title'),
      titleHelpHost: queryRequired(root, '[data-pc="title-help"]'),
      collapseButton: queryRequired(root, '[data-pc="collapse"]'),
      statusTagNode: queryRequired(root, '[data-pc="status-tag"]'),
      statusTextNode: queryRequired(root, '[data-pc="status-text"]'),
      groupsNode: queryRequired(root, '[data-pc="groups"]'),
      applyButton: queryRequired(root, '[data-pc="apply"]'),
    };
  }

  renderShell(state: ControllerState) {
    this.renderHeader(state.config);
    this.renderCollapsed(state.ui.collapsed);
    this.renderStatus(state);
  }

  renderHeader(config: ControllerConfig) {
    this.refs.titleNode.textContent = config.title || SCRIPT_DISPLAY_NAME;
    replaceHelpMarker(
      this.refs.titleHelpHost,
      this.doc,
      `${config.title || SCRIPT_DISPLAY_NAME} 说明`,
      config.description || '将操作标签映射到 in_use 预设提示词开关',
    );
  }

  renderStatus(state: ControllerState) {
    this.refs.statusTagNode.className = `preset-controller-status-tag is-${state.statusLevel}`;
    this.refs.statusTagNode.textContent = state.statusLevel.toUpperCase();
    this.refs.statusTextNode.textContent = state.statusText;
    this.refs.applyButton.disabled = state.applying;
  }

  renderCollapsed(collapsed: boolean) {
    this.root.classList.toggle('is-collapsed', collapsed);
    this.refs.launcher.setAttribute(
      'aria-label',
      collapsed ? `展开 ${SCRIPT_DISPLAY_NAME}` : `${SCRIPT_DISPLAY_NAME} 已展开`,
    );
  }

  renderGroups(config: ControllerConfig, ui: UiState) {
    this.controlLocationMap.clear();
    this.refs.groupsNode.innerHTML = '';

    if (config.groups.length === 0) {
      const empty = this.doc.createElement('div');
      empty.className = 'preset-controller-empty';
      empty.textContent = '还没有规则，请到扩展设置中导入配置。';
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

      const groupTitleRow = this.doc.createElement('div');
      groupTitleRow.className = 'preset-controller-label-row';

      const groupTitle = this.doc.createElement('div');
      groupTitle.className = 'preset-controller-group-title';
      groupTitle.textContent = group.title;
      groupTitleRow.append(groupTitle);

      if (group.description) {
        groupTitleRow.append(createHelpMarker(this.doc, `${group.title} 说明`, group.description));
      }

      groupMeta.append(groupTitleRow);

      const groupToggle = this.doc.createElement('button');
      groupToggle.type = 'button';
      groupToggle.className = 'preset-controller-group-toggle';
      groupToggle.dataset.groupId = group.id;
      groupToggle.dataset.pcAction = 'toggle-group';
      groupToggle.textContent = ui.groupCollapsed[group.id] ? '展开' : '收起';

      groupHeader.append(groupMeta, groupToggle);

      const groupBody = this.doc.createElement('div');
      groupBody.className = 'preset-controller-group-body';

      group.controls.forEach((control, controlIndex) => {
        this.controlLocationMap.set(control.id, {
          groupIndex,
          controlIndex,
        });

        const controlElement = this.doc.createElement('article');
        controlElement.className = 'preset-controller-item';

        const controlTitle = control.label ?? control.id;
        const controlTitleRow = this.doc.createElement('div');
        controlTitleRow.className = 'preset-controller-label-row';

        const controlLabel = this.doc.createElement('div');
        controlLabel.className = 'preset-controller-item-label';
        controlLabel.textContent = controlTitle;
        controlTitleRow.append(controlLabel);

        if (control.description) {
          controlTitleRow.append(createHelpMarker(this.doc, `${controlTitle} 说明`, control.description));
        }

        controlElement.append(controlTitleRow);

        const controlStack = this.doc.createElement('div');
        controlStack.className = 'preset-controller-control-stack';

        if (control.type === 'toggle') {
          const toggleLabel = this.doc.createElement('label');
          toggleLabel.className = 'preset-controller-toggle';

          const toggleInput = this.doc.createElement('input');
          toggleInput.type = 'checkbox';
          toggleInput.checked = control.value;
          toggleInput.dataset.controlId = control.id;
          toggleInput.dataset.controlType = 'toggle';

          const toggleText = this.doc.createElement('span');
          toggleText.textContent = control.value ? '当前为开启' : '当前为关闭';
          toggleText.title = [
            formatOperationsSummary('开启时执行：', control.operations.on),
            formatOperationsSummary('关闭时执行：', control.operations.off),
          ].join('\n\n');

          toggleLabel.append(toggleInput, toggleText);
          controlStack.append(toggleLabel);
        } else {
          const radioGroup = this.doc.createElement('fieldset');
          radioGroup.className = 'preset-controller-radio-group';

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
            optionText.title = formatOperationsSummary('选中时执行：', option.operations, option.description);

            optionLabel.append(optionInput, optionText);
            radioGroup.append(optionLabel);
          });

          controlStack.append(radioGroup);
        }

        controlElement.append(controlStack);
        groupBody.append(controlElement);
      });

      if (group.controls.length === 0) {
        const empty = this.doc.createElement('div');
        empty.className = 'preset-controller-empty';
        empty.textContent = '该分组暂无操作标签。';
        groupBody.append(empty);
      }

      groupElement.append(groupHeader, groupBody);
      this.refs.groupsNode.append(groupElement);
    });
  }

  getControlLocation(controlId: string): ControlLocation | undefined {
    return this.controlLocationMap.get(controlId);
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
