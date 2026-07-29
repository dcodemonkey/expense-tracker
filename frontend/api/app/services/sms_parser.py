import re
import dateparser
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from app.models import TransactionType, TransactionSource


SMS_PATTERNS = {
    "amount": [
        r'(?:rs\.?|inr|₹)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
        r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|inr|₹)',
        r'(?:spent|paid|debited|charged|purchase)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
        r'(?:credited|received|deposited)\s+(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
    ],
    "merchant": [
        r'(?:at|from|to|via)\s+([A-Za-z0-9\s&\-.]+?)(?:\s+(?:on|at|for|using|via|ref|txn|transaction|amount|rs|inr|₹)|$)',
        r'(?:merchant|payee):\s*([A-Za-z0-9\s&\-.]+)',
        r'(?:to|paid to)\s+([A-Za-z0-9\s&\-.]+?)(?:\s+(?:rs|inr|₹|\d)|$)',
    ],
    "date": [
        r'(?:on|dated)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(?:on|dated)\s+(\d{1,2}\s+\w{3}\s+\d{2,4})',
    ],
    "card_last4": [
        r'(?:card|ending|xxx)\s*(\d{4})',
        r'(\d{4})\s*(?:debited|credited)',
    ]
}

CATEGORY_KEYWORDS = {
    "Food & Dining": ["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "pizza", "burger", "dominos", "kfc", "mcdonalds", "subway", "starbucks", "cafe coffee day"],
    "Transport": ["uber", "ola", "rapido", "metro", "bus", "train", "fuel", "petrol", "diesel", "indian oil", "hp petrol", "bharat petroleum"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "shopping", "purchase", "nykaa", "meesho"],
    "Entertainment": ["netflix", "prime", "hotstar", "bookmyshow", "movie", "entertainment", "sony liv", "zee5", "spotify", "youtube premium"],
    "Bills & Utilities": ["electricity", "water", "gas", "broadband", "wifi", "mobile", "recharge", "bill", "airtel", "jio", "vi ", "bsnl", "tatapower", "bescom"],
    "Healthcare": ["hospital", "clinic", "pharmacy", "medical", "health", "doctor", "apollo", "fortis", "max hospital", "medplus", "1mg", "pharmeasy"],
    "Education": ["school", "college", "university", "course", "udemy", "coursera", "education", "byju", "unacademy"],
    "Salary": ["salary", "credited", "salary credited", "payroll"],
    "Investments": ["mutual fund", "sip", "zerodha", "groww", "upstox", "coin", "smallcase", "etmoney", "investment"],
}


def parse_sms_message(content: str, sender: str, received_at: datetime) -> Optional[Dict[str, Any]]:
    content_lower = content.lower()
    sender_lower = sender.lower()

    if not any(keyword in content_lower for keyword in ["rs", "inr", "₹", "debited", "credited", "spent", "paid", "charged", "purchase", "received", "deposited", "salary"]):
        return None

    amount = None
    for pattern in SMS_PATTERNS["amount"]:
        match = re.search(pattern, content_lower)
        if match:
            amount = Decimal(match.group(1).replace(",", ""))
            break

    if amount is None:
        return None

    merchant = None
    for pattern in SMS_PATTERNS["merchant"]:
        match = re.search(pattern, content_lower)
        if match:
            merchant = match.group(1).strip().title()
            break

    if not merchant:
        sender_keywords = ["bank", "hdfc", "icici", "sbi", "axis", "kotak", "yes bank", "idfc", "indusind", "federal", "rbl", "citi", "hsbc", "standard chartered"]
        for keyword in sender_keywords:
            if keyword in sender_lower:
                merchant = keyword.title()
                break

    trans_date = received_at.date()
    for pattern in SMS_PATTERNS["date"]:
        match = re.search(pattern, content_lower)
        if match:
            try:
                trans_date = dateparser.parse(match.group(1)).date()
                break
            except:
                pass

    txn_type = TransactionType.EXPENSE
    if any(word in content_lower for word in ["credited", "received", "deposited", "salary", "refund", "cashback", "reversal"]):
        txn_type = TransactionType.INCOME

    category = "Others"
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in content_lower for kw in keywords):
            category = cat
            break

    if merchant:
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in merchant.lower() for kw in keywords):
                category = cat
                break

    confidence = 0.8 if amount and merchant else (0.6 if amount else 0.3)

    return {
        "amount": amount,
        "currency": "INR",
        "type": txn_type,
        "merchant_name": merchant,
        "transaction_date": trans_date,
        "description": content[:500],
        "category": category,
        "confidence": confidence,
        "raw_message": content
    }


def parse_email_message(subject: str, body: str, sender: str, received_at: datetime) -> Optional[Dict[str, Any]]:
    content = f"{subject} {body}"
    return parse_sms_message(content, sender, received_at)


async def get_or_create_category(name: str, user, db) -> int:
    from app.models import Category
    from sqlalchemy import select

    result = await db.execute(select(Category).where(Category.name == name, Category.user_id == user.id))
    cat = result.scalar_one_or_none()
    if cat:
        return cat.id

    cat = Category(name=name, user_id=user.id, is_default=False)
    db.add(cat)
    await db.flush()
    return cat.id