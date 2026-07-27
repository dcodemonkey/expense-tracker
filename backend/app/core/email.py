"""
Email delivery abstraction.

When no SMTP host is configured (the default in development), links and tokens
are logged to the console instead of sent — so email-verification and
password-reset flows are fully exercisable with zero infrastructure. Configure
SMTP_* in the environment to send real mail in production.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def _send(self, to: str, subject: str, body: str) -> None:
        if not settings.smtp_enabled:
            logger.warning(
                "\n"
                "──────────────── EMAIL (dev console) ────────────────\n"
                "To:      %s\n"
                "Subject: %s\n"
                "%s\n"
                "──────────────────────────────────────────────────────",
                to, subject, body,
            )
            return

        msg = EmailMessage()
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
            server.send_message(msg)

    def send_verification(self, to: str, token: str) -> None:
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        self._send(
            to,
            "Verify your email",
            "Welcome to Expense Tracker! Confirm your email to activate your "
            f"account:\n\n{link}\n\n"
            f"This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours.",
        )

    def send_password_reset(self, to: str, token: str) -> None:
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        self._send(
            to,
            "Reset your password",
            "We received a request to reset your Expense Tracker password. "
            f"Choose a new one here:\n\n{link}\n\n"
            f"This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours. "
            "If you didn't request this, you can safely ignore this email.",
        )


email_service = EmailService()
