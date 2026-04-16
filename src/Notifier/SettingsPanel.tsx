import { ExtensionSettingDrawer } from '@util/components/extension-setting-drawer';
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
              <div className="notifier-panel-title">后台常驻</div>
              <p className="notifier-copy">
                {runtimeActive
                  ? '当前正在播放静音音频，后台常驻已经生效。'
                  : keepAlivePending
                    ? '正在等待浏览器确认音频播放，启动完成前开始按钮不会重复触发。'
                    : keepAliveEnabled
                      ? '后台常驻已开启，若浏览器拦截了播放，会在下一次用户交互后继续尝试。'
                  : '当前未运行，启动后会尽量维持脚本活跃。'}
              </p>
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
              <div className="notifier-panel-title">生成结束通知</div>
              <p className="notifier-copy">生成完成后弹出系统通知，适合切出页面后继续做别的事。</p>
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
              <div className="notifier-panel-title">快捷入口</div>
              <p className="notifier-copy">把后台常驻的启停按钮同步到QR区域，方便在常用位置直接切换。</p>
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

          <p className="notifier-hint">按钮状态会跟随真实运行状态切换，不需要手动维护。</p>
        </section>
      </div>
    </ExtensionSettingDrawer>
  );
}
