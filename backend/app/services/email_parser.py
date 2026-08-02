import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any

class EmailTransactionParser:
    """
    Parses transaction details from email bodies of common banks (HDFC, SBI, ICICI, etc.)
    """

    PATTERNS = [
        # HDFC Bank
        {
            "bank": "HDFC",
            "regex": r"debited\s+from\s+your\s+account\s+.*?(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*).*?at\s+(.*?)\s+on",
            "type": "expense"
        },
        # ICICI Bank
        {
            "bank": "ICICI",
            "regex": r"(?:spent|paid)\s+(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*).*?at\s+(.*?)\.",
            "type": "expense"
        },
        # SBI
        {
            "bank": "SBI",
            "regex": r"(?:credited|received)\s+(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*).*?from\s+(.*?)\.",
            "type": "income"
        },
        # Credit Card Limit Alerts
        {
            "bank": "Generic",
            "regex": r"Available\s+Credit\s+Limit\s+is\s+(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)",
            "type": "limit_info"
        }
    ]

    @classmethod
    def parse_email_body(cls, body: str, sender: str) -> Optional[Dict[str, Any]]:
        body_clean = body.replace("\n", " ").replace("\r", " ")

        for p in cls.PATTERNS:
            match = re.search(p["regex"], body_clean, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(",", "")
                try:
                    amount = Decimal(amount_str)
                except:
                    continue

                merchant = match.group(2).strip() if len(match.groups()) > 1 else None

                return {
                    "amount": amount,
                    "type": p["type"],
                    "merchant_name": merchant,
                    "bank_name": p["bank"],
                    "confidence": 0.95
                }
        return None
