import { createLogger } from '@util/common';
import { ExtensionSettingDrawer } from '@util/react/components/ExtensionSettingDrawer';
import { HelpMarker } from '@util/react/components/HelpMarker';
import { useState } from 'react';
import { SCRIPT_DISPLAY_NAME } from './constants';
import type { NotifierRuntime } from './runtime';
import { useNotifierStore } from './store';

type Props = {
  runtime: NotifierRuntime;
};

const logger = createLogger(SCRIPT_DISPLAY_NAME);

function getPermissionLabel(permission: string) {
  if (permission === 'granted') {
    return '已授权';
  }
  if (permission === 'denied') {
    return '已拒绝';
  }
  if (permission === 'unsupported') {
    return '不支持';
  }
  return '未授权';
}

function getKeepAliveSummary(runtimeActive: boolean, keepAlivePending: boolean, keepAliveEnabled: boolean) {
  if (runtimeActive) {
    return '当前静音音频正在播放。';
  }

  if (keepAlivePending) {
    return '正在确认浏览器是否允许后台常驻。';
  }

  if (keepAliveEnabled) {
    return '等待下一次点击、触摸或按键以恢复静音音频。';
  }

  return '当前未运行。';
}

export default function SettingsPanel({ runtime }: Props) {
  const settings = useNotifierStore(state => state.settings);
  const runtimeActive = useNotifierStore(state => state.runtimeActive);
  const runtimeStarting = useNotifierStore(state => state.runtimeStarting);
  const notificationPermission = useNotifierStore(state => state.notificationPermission);
  const setNotificationsEnabled = useNotifierStore(state => state.setNotificationsEnabled);
  const setShowScriptButton = useNotifierStore(state => state.setShowScriptButton);
  const [requestingPermission, setRequestingPermission] = useState(false);

  const keepAlivePending = runtimeStarting && !runtimeActive;
  const keepAliveEnabled = settings.keepAliveEnabled;

  const handlePermissionRequest = async () => {
    logger.info('设置面板发起通知权限请求。');
    setRequestingPermission(true);
    try {
      const permission = await runtime.requestPermission();
      logger.info(`设置面板通知权限请求完成：${permission}`);
    } finally {
      setRequestingPermission(false);
    }
  };

  return (
    <ExtensionSettingDrawer title="消息提醒与后台常驻">
      <div className="notifier-settings">
        <section className="notifier-panel notifier-panel-summary">
          <div className="notifier-panel-head">
            <div>
              <div className="notifier-panel-title-row">
                <div className="notifier-panel-title">后台常驻</div>
                <HelpMarker
                  className="notifier-help-marker"
                  title="后台常驻说明"
                  text={[
                    '后台常驻会尝试播放静音音频，让脚本在切出页面后更稳定地保持活跃。',
                    '如果脚本载入较晚或浏览器拦截了自动播放，会保留启用状态，并在下一次点击、触摸或按键时自动重试。',
                    '桌面与 Android 通常可在切到后台后继续一段时间；iOS 仍可能按系统策略冻结网页，无法由普通网页脚本完全规避。',
                  ].join('\n\n')}
                />
              </div>
              <p className="notifier-copy">{getKeepAliveSummary(runtimeActive, keepAlivePending, keepAliveEnabled)}</p>
            </div>
            <span className={`notifier-state ${runtimeActive ? 'is-active' : keepAlivePending ? 'is-pending' : ''}`}>
              <span className="notifier-state-dot"></span>
              <span>
                {runtimeActive ? '运行中' : keepAlivePending ? '启动中' : keepAliveEnabled ? '等待唤醒' : '已停止'}
              </span>
            </span>
          </div>

          <div className="notifier-actions">
            <button
              className="menu_button notifier-primary-action"
              type="button"
              onClick={() => {
                if (keepAliveEnabled) {
                  logger.info('设置面板点击：停止后台常驻。');
                  runtime.stopKeepAlive();
                  return;
                }

                logger.info('设置面板点击：启动后台常驻。');
                void runtime.startKeepAlive();
              }}
            >
              {keepAliveEnabled ? '停止后台常驻' : '启动后台常驻'}
            </button>
          </div>
        </section>

        <section className="notifier-panel">
          <div className="notifier-panel-head">
            <div>
              <div className="notifier-panel-title-row">
                <div className="notifier-panel-title">生成结束通知</div>
                <HelpMarker
                  className="notifier-help-marker"
                  title="生成结束通知说明"
                  text={[
                    '生成完成后会尝试发送系统通知，方便你切出酒馆继续做别的事。',
                    '如果系统或浏览器拒绝了通知权限，需要到对应设置里手动重新开启。',
                    'iOS 通常需要添加到主屏幕后以 PWA 形式打开，锁屏通知才更稳定。',
                  ].join('\n\n')}
                />
              </div>
              <p className="notifier-copy">生成完成后发送系统通知。</p>
            </div>
            <span
              className={[
                'notifier-badge',
                notificationPermission === 'granted' ? 'is-positive' : '',
                notificationPermission === 'denied' ? 'is-negative' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {getPermissionLabel(notificationPermission)}
            </span>
          </div>

          <label className="notifier-switch">
            <input
              checked={settings.notificationsEnabled}
              type="checkbox"
              onChange={event => {
                const enabled = event.currentTarget.checked;
                logger.info(`设置面板切换：通知开关=${enabled}`);
                setNotificationsEnabled(enabled);
              }}
            />
            <span>收到生成结束通知</span>
          </label>

          <div className="notifier-actions">
            <button
              className="menu_button notifier-secondary"
              disabled={!settings.notificationsEnabled || notificationPermission === 'denied' || requestingPermission}
              type="button"
              onClick={() => {
                logger.info('设置面板点击：申请通知权限按钮。');
                void handlePermissionRequest();
              }}
            >
              {requestingPermission
                ? '请求中...'
                : notificationPermission === 'granted'
                  ? '通知已可用'
                  : notificationPermission === 'unsupported'
                    ? '当前环境不支持'
                    : '申请通知权限'}
            </button>
          </div>
        </section>

        <section className="notifier-panel">
          <div className="notifier-panel-head">
            <div>
              <div className="notifier-panel-title-row">
                <div className="notifier-panel-title">快捷入口</div>
                <HelpMarker
                  className="notifier-help-marker"
                  title="快捷入口说明"
                  text={[
                    '开启后，会把后台常驻的启停按钮同步到脚本按钮区域。',
                    '按钮状态会跟随真实运行状态自动切换，不需要额外手动维护。',
                  ].join('\n\n')}
                />
              </div>
              <p className="notifier-copy">把启停按钮同步到脚本按钮区域。</p>
            </div>
          </div>

          <label className="notifier-switch">
            <input
              checked={settings.showScriptButton}
              type="checkbox"
              onChange={event => {
                const enabled = event.currentTarget.checked;
                logger.info(`设置面板切换：脚本按钮显示=${enabled}`);
                setShowScriptButton(enabled);
              }}
            />
            <span>在脚本按钮区域显示启停按钮</span>
          </label>
        </section>
      </div>
    </ExtensionSettingDrawer>
  );
}
