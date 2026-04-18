# .dual-graph/test_orchestrator_notifications.py
import unittest
from unittest.mock import patch, MagicMock
import tempfile
import os
from orchestrator import WorkflowOrchestrator


class TestOrchestratorNotifications(unittest.TestCase):

    def setUp(self):
        """Tạo temporary database cho mỗi test"""
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        self.temp_db.close()
        self.orchestrator = WorkflowOrchestrator(self.temp_db.name)

    def tearDown(self):
        """Xóa temporary database sau test"""
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)

    @patch('orchestrator.send_notification')
    def test_create_workflow_sends_start_notification(self, mock_notify):
        """Test workflow creation gửi start notification"""
        session_id = self.orchestrator.create_workflow(
            "Fix bug in login",
            "/test/path"
        )

        # Verify notification được gọi
        mock_notify.assert_called_once()
        call_args = mock_notify.call_args[0]
        self.assertEqual(call_args[0], "Automation Started")
        self.assertIn(session_id, call_args[1])
        self.assertIn("bug", call_args[1])

    @patch('orchestrator.send_notification')
    def test_notify_workflow_done(self, mock_notify):
        """Test completion notification"""
        session_id = "test1234"
        duration = "2m 30s"

        self.orchestrator.notify_workflow_done(session_id, duration)

        mock_notify.assert_called_once_with(
            "Automation Complete",
            f"Hoàn thành trong {duration} (Session: {session_id})"
        )

    @patch('orchestrator.send_notification')
    def test_notification_failure_does_not_crash_workflow(self, mock_notify):
        """Test workflow vẫn hoạt động khi notification fail"""
        mock_notify.side_effect = Exception("Notification error")

        # Workflow vẫn phải tạo thành công
        try:
            session_id = self.orchestrator.create_workflow(
                "Add new feature",
                "/test/path"
            )
            self.assertIsNotNone(session_id)
        except Exception:
            self.fail("Workflow should not crash when notification fails")


if __name__ == '__main__':
    unittest.main()
