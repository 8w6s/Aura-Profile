# .dual-graph/notifier.py
import subprocess
import platform
import logging

logger = logging.getLogger(__name__)


def send_notification(title: str, message: str):
    """
    Gửi desktop notification.

    Args:
        title: Tiêu đề notification
        message: Nội dung notification
    """
    try:
        if platform.system() == 'Windows':
            # PowerShell toast notification
            ps_script = f"""
$null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
$null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
$xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
$xml.LoadXml(@"
<toast>
    <visual>
        <binding template='ToastText02'>
            <text id='1'>{title}</text>
            <text id='2'>{message}</text>
        </binding>
    </visual>
</toast>
"@)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show($toast)
"""
            subprocess.run(
                ['powershell', '-Command', ps_script],
                capture_output=True,
                timeout=5
            )
            logger.info(f"Notification sent: {title}")
    except Exception as e:
        # Không crash nếu notification fail
        logger.warning(f"Failed to send notification: {e}")
