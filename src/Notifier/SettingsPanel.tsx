import { useState } from 'react';
import { ExtensionSettingDrawer } from '@util/components/extension-setting-drawer';
import type { NotifierRuntime } from './runtime';
import { useNotifierStore } from './store';

type Props = {
  runtime: NotifierRuntime;
};

function getModeTitle(mode: 'audio' | 'pip') {
  return mode === 'audio' ? '音频常驻' : 'PiP 常驻';
}

function getModeDescription(mode: 'audio' | 'pip') {
  return mode === 'audio'
    ? '借助静音音频维持活动，保活力度更强，但会占用系统媒体控制。'
    : '使用静音视频与画中画通道，通常不打断音乐播放，更适合移动端。';
}

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
  const notificationPermission = useNotifierStore(state => state.notificationPermission);
  const setKeepAliveEnabled = useNotifierStore(state => state.setKeepAliveEnabled);
  const setKeepAliveMode = useNotifierStore(state => state.setKeepAliveMode);
  const setNotificationsEnabled = useNotifierStore(state => state.setNotificationsEnabled);
  const setShowQrButton = useNotifierStore(state => state.setShowQrButton);
  const [requestingPermission, setRequestingPermission] = useState(false);

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
        <section className="notifier-overview">
          <div>
            <div className="notifier-eyebrow">Notifier</div>
            <h3 className="notifier-title">把提醒、后台常驻和快捷入口收拢到一个面板里</h3>
            <p className="notifier-copy">适合长时间等待回复或图片生成，不必反复回到页面确认进度。</p>
          </div>
          <button
            className="menu_button notifier-toggle"
            type="button"
            onClick={() => setKeepAliveEnabled(!settings.keepAliveEnabled)}
          >
            {runtimeActive ? '停止后台常驻' : '启动后台常驻'}
          </button>
        </section>

        <section className="notifier-grid">
          <article className="notifier-card notifier-card-primary">
            <div className="notifier-card-head">
              <div>
                <div className="notifier-card-title">后台常驻状态</div>
                <p className="notifier-card-copy">
                  {runtimeActive
                    ? `当前正在运行，使用的是${getModeTitle(settings.keepAliveMode)}。`
                    : '当前未运行，启动后会在后台尽量维持脚本活跃。'}
                </p>
              </div>
              <span className={`notifier-state ${runtimeActive ? 'is-active' : ''}`}>
                <span className="notifier-state-dot"></span>
                <span>{runtimeActive ? '运行中' : '已停止'}</span>
              </span>
            </div>

            <div className="notifier-mode-list">
              {(['audio', 'pip'] as const).map(mode => {
                const checked = settings.keepAliveMode === mode;
                return (
                  <label key={mode} className={`notifier-mode-card ${checked ? 'is-selected' : ''}`}>
                    <input
                      checked={checked}
                      name="notifier-keepalive-mode"
                      type="radio"
                      value={mode}
                      onChange={() => setKeepAliveMode(mode)}
                    />
                    <span className="notifier-mode-name">{getModeTitle(mode)}</span>
                    <span className="notifier-mode-copy">{getModeDescription(mode)}</span>
                  </label>
                );
              })}
            </div>
          </article>

          <article className="notifier-card">
            <div className="notifier-card-head">
              <div>
                <div className="notifier-card-title">生成结束通知</div>
                <p className="notifier-card-copy">脚本会在生成完成时弹出系统通知，适合切出页面后继续处理别的事情。</p>
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
          </article>

          <article className="notifier-card notifier-card-wide">
            <div className="notifier-card-head">
              <div>
                <div className="notifier-card-title">快捷入口</div>
                <p className="notifier-card-copy">把后台常驻的启停按钮同步到二维码区域，方便在常用位置直接切换。</p>
              </div>
            </div>

            <label className="notifier-switch">
              <input
                checked={settings.showQrButton}
                type="checkbox"
                onChange={event => setShowQrButton(event.currentTarget.checked)}
              />
              <span>在二维码区域显示启停按钮</span>
            </label>

            <p className="notifier-hint">按钮状态会跟随真实运行状态切换，不需要手动维护。</p>
          </article>
        </section>
      </div>
    </ExtensionSettingDrawer>
  );
}
