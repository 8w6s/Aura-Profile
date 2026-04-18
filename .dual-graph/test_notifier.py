# .dual-graph/test_notifier.py
import unittest
from unittest.mock import patch, MagicMock
import platform
from notifier import send_notification


class TestNotifier(unittest.TestCase):

    @patch('notifier.platform.system')
    @patch('notifier.subprocess.run')
    def test_send_notification_windows(self, mock_run, mock_platform):
        """Test notification gửi thành công trên Windows"""
        mock_platform.return_value = 'Windows'
        mock_run.return_value = MagicMock(returncode=0)

        send_notification("Test Title", "Test Message")

        # Verify subprocess.run được gọi với PowerShell
        mock_run.assert_called_once()
        call_args = mock_run.call_args
        self.assertEqual(call_args[0][0][0], 'powershell')
        self.assertEqual(call_args[0][0][1], '-Command')
        self.assertIn('Test Title', call_args[0][0][2])
        self.assertIn('Test Message', call_args[0][0][2])

    @patch('notifier.platform.system')
    @patch('notifier.subprocess.run')
    def test_send_notification_timeout(self, mock_run, mock_platform):
        """Test notification có timeout để tránh block"""
        mock_platform.return_value = 'Windows'

        send_notification("Title", "Message")

        # Verify timeout được set
        call_kwargs = mock_run.call_args[1]
        self.assertEqual(call_kwargs['timeout'], 5)
        self.assertTrue(call_kwargs['capture_output'])

    @patch('notifier.platform.system')
    @patch('notifier.subprocess.run')
    def test_send_notification_handles_error(self, mock_run, mock_platform):
        """Test notification không crash khi có lỗi"""
        mock_platform.return_value = 'Windows'
        mock_run.side_effect = Exception("PowerShell error")

        # Không nên raise exception
        try:
            send_notification("Title", "Message")
        except Exception:
            self.fail("send_notification should not raise exception")

    @patch('notifier.platform.system')
    @patch('notifier.subprocess.run')
    def test_xml_injection_prevention(self, mock_run, mock_platform):
        """Test XML special characters được escape đúng"""
        mock_platform.return_value = 'Windows'
        mock_run.return_value = MagicMock(returncode=0)

        # Test với XML special characters
        send_notification("Title <tag>", "Message & <xml>")

        # Verify escaped characters trong PowerShell script
        call_args = mock_run.call_args[0][0][2]
        self.assertIn('&lt;tag&gt;', call_args)  # < và > được escape
        self.assertIn('&amp;', call_args)  # & được escape
        self.assertNotIn('<tag>', call_args)  # Raw tags không có
        self.assertNotIn('& <xml>', call_args)  # Raw & không có

    @patch('notifier.platform.system')
    @patch('notifier.subprocess.run')
    def test_xml_injection_quotes(self, mock_run, mock_platform):
        """Test quotes được escape đúng"""
        mock_platform.return_value = 'Windows'
        mock_run.return_value = MagicMock(returncode=0)

        send_notification("Title 'single'", 'Message "double"')

        call_args = mock_run.call_args[0][0][2]
        self.assertIn('&#x27;', call_args)  # Single quote escaped
        self.assertIn('&quot;', call_args)  # Double quote escaped


if __name__ == '__main__':
    unittest.main()
