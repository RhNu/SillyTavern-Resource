import { ExtensionSettingDrawer } from '@util/components/extension-setting-drawer';
import { HelpMarker } from '@util/components/HelpMarker';
import { useState } from 'react';
import type { NotifierRuntime } from './runtime';
import { useNotifierStore } from './store';

type Props = {
  runtime: NotifierRuntime;
};

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

function getKeepAliveSummary(runtimeActive: boolean, keepAlivePending: boolean) {
  if (runtimeActive) {
    return '当前静音音频正在播放。';
  }

  if (keepAlivePending) {
    return '正在确认浏览器是否允许后台常驻。';
  }

  return '当前未运行。';
}

export default function SettingsPanel({ runtime }: Props) {
  const settings = useNotifierStore(state => state.settings);
  const runtimeActive = useNotifierStore(state => state.runtimeActive);
  const runtimeStarting = useNotifierStore(state => state.runtimeStarting);
  const notificationPermission = useNotifierStore(state => state.notificationPermission);
  const setNotificationsEnabled = useNotifierStore(state => state.setNotificationsEnabled);
  const setShowQrButton = useNotifierStore(state => state.setShowQrButton);
  const [requestingPermission, setRequestingPermission] = useState(false);

  const keepAlivePending = runtimeStarting && !runtimeActive;
  const keepAliveEnabled = settings.keepAliveEnabled;

  const handlePermissionRequest = async () => {
    setRequestingPermission(true);
    try {
      await runtime.requestPermission();
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
                    '启动时会立即检测音频是否真的开始播放；如果浏览器拦截了自动播放，本次启动会直接回退到未运行状态。',
                    '手动点击启动按钮时，会重新发起一次播放尝试。',
                  ].join('\n\n')}
                />
              </div>
              <p className="notifier-copy">{getKeepAliveSummary(runtimeActive, keepAlivePending)}</p>
            </div>
            <span className={`notifier-state ${runtimeActive ? 'is-active' : keepAlivePending ? 'is-pending' : ''}`}>
              <span className="notifier-state-dot"></span>
              <span>{runtimeActive ? '运行中' : keepAlivePending ? '启动中' : '已停止'}</span>
            </span>
          </div>

          <div className="notifier-actions">
            <button
              className="menu_button notifier-primary-action"
              type="button"
              onClick={() => {
                if (keepAliveEnabled) {
                  runtime.stopKeepAlive();
                  return;
                }

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
              onChange={event => setNotificationsEnabled(event.currentTarget.checked)}
            />
            <span>收到生成结束通知</span>
          </label>

          <div className="notifier-actions">
            <button
              className="menu_button notifier-secondary"
              disabled={!settings.notificationsEnabled || notificationPermission === 'denied' || requestingPermission}
              type="button"
              onClick={() => {
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

          <p className="notifier-hint">iOS 设备通常需要添加到主屏幕后以 PWA 形式打开，锁屏通知才更稳定。</p>
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
                    '开启后，会把后台常驻的启停按钮同步到 QR 区域。',
                    '按钮状态会跟随真实运行状态自动切换，不需要额外手动维护。',
                  ].join('\n\n')}
                />
              </div>
              <p className="notifier-copy">把启停按钮同步到 QR 区域。</p>
            </div>
          </div>

          <label className="notifier-switch">
            <input
              checked={settings.showQrButton}
              type="checkbox"
              onChange={event => setShowQrButton(event.currentTarget.checked)}
            />
            <span>在QR区域显示启停按钮</span>
          </label>

          <p className="notifier-hint">按钮状态会跟随真实运行状态切换。</p>
        </section>
      </div>
    </ExtensionSettingDrawer>
  );
}
