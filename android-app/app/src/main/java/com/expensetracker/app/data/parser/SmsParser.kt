package com.expensetracker.app.data.parser

import com.expensetracker.app.data.model.ParsedMessage
import com.expensetracker.app.data.model.Transaction
import com.expensetracker.app.data.model.TransactionSource
import com.expensetracker.app.data.model.TransactionType
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.regex.Matcher
import java.util.regex.Pattern

object SmsParser {

    private val AMOUNT_PATTERNS = listOf(
        Pattern.compile("(?i)(?:rs\\.?|inr|₹)\\s*([\\d,]+\\.?\\d*)"),
        Pattern.compile("(?i)([\\d,]+\\.?\\d*)\\s*(?:rs\\.?|inr|₹)"),
        Pattern.compile("(?i)(?:spent|paid|debited|charged|purchase)\\s+(?:rs\\.?|inr|₹)?\\s*([\\d,]+\\.?\\d*)"),
        Pattern.compile("(?i)(?:credited|received|deposited)\\s+(?:rs\\.?|inr|₹)?\\s*([\\d,]+\\.?\\d*)"),
    )

    private val BALANCE_PATTERNS = listOf(
        Pattern.compile("(?i)(?:bal|balance|avbl|avl)\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+\\.?\\d*)"),
        Pattern.compile("(?i)Available\\s+Credit\\s+Limit\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+\\.?\\d*)")
    )

    private val MERCHANT_PATTERNS = listOf(
        Pattern.compile("(?i)(?:at|from|to|via)\\s+([A-Za-z0-9\\s&\\-.]+?)(?:\\s+(?:on|at|for|using|via|ref|txn|transaction|amount|rs|inr|₹)|$)"),
        Pattern.compile("(?i)(?:merchant|payee):\\s*([A-Za-z0-9\\s&\\-.]+)"),
    )

    private val DATE_PATTERNS = listOf(
        Pattern.compile("(?i)(?:on|dated)\\s+(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})"),
        Pattern.compile("(?i)(?:on|dated)\\s+(\\d{1,2}\\s+\\w{3}\\s+\\d{2,4})"),
    )

    private val CATEGORY_KEYWORDS = mapOf(
        "Food & Dining" to setOf("swiggy", "zomato", "restaurant", "cafe", "food", "dining", "pizza", "burger", "dominos", "kfc", "mcdonalds", "subway", "starbucks", "cafe coffee day", "blinkit", "zepto", "bigbasket"),
        "Transport" to setOf("uber", "ola", "rapido", "metro", "bus", "train", "fuel", "petrol", "diesel", "indian oil", "hp petrol", "bharat petroleum"),
        "Shopping" to setOf("amazon", "flipkart", "myntra", "ajio", "shopping", "purchase", "nykaa", "meesho"),
        "Entertainment" to setOf("netflix", "prime", "hotstar", "bookmyshow", "movie", "entertainment", "sony liv", "zee5", "spotify", "youtube premium", "google play", "apple"),
        "Bills & Utilities" to setOf("electricity", "water", "gas", "broadband", "wifi", "mobile", "recharge", "bill", "airtel", "jio", "vi ", "bsnl", "tatapower", "bescom"),
        "Healthcare" to setOf("hospital", "clinic", "pharmacy", "medical", "health", "doctor", "apollo", "fortis", "max hospital", "medplus", "1mg", "pharmeasy"),
        "Education" to setOf("school", "college", "university", "course", "udemy", "coursera", "education", "byju", "unacademy"),
        "Salary" to setOf("salary", "credited", "salary credited", "payroll"),
        "Investments" to setOf("mutual fund", "sip", "zerodha", "groww", "upstox", "coin", "smallcase", "etmoney", "investment"),
    )

    fun parseSms(content: String, sender: String, receivedAt: LocalDateTime): ParsedMessage? {
        val contentLower = content.lowercase()
        val senderLower = sender.lowercase()

        val amount = extractAmount(contentLower)
        if (amount == null) return null

        val merchant = extractMerchant(contentLower)
        val date = extractDate(contentLower) ?: receivedAt.toLocalDate()
        val type = determineType(contentLower)
        val category = categorizeMerchant(merchant ?: contentLower)
        val confidence = calculateConfidence(amount != null, merchant != null)

        return ParsedMessage(
            userId = 0,
            source = TransactionSource.SMS,
            rawContent = content,
            sender = sender,
            receivedAt = receivedAt,
            parsedAmount = amount,
            parsedCurrency = "INR",
            parsedMerchant = merchant,
            parsedCategory = category,
            parsedDate = date,
            parsedType = type,
            confidenceScore = confidence
        )
    }

    private fun extractAmount(text: String): Double? {
        for (pattern in AMOUNT_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                try {
                    return matcher.group(1).replace(",", "").toDouble()
                } catch (e: NumberFormatException) {
                    continue
                }
            }
        }
        return null
    }

    private fun extractMerchant(text: String): String? {
        for (pattern in MERCHANT_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val merchant = matcher.group(1).trim()
                if (merchant.length >= 2 && merchant.length <= 100) {
                    return merchant.split(" ").joinToString(" ") { it.replaceFirstChar { char -> char.uppercase() } }
                }
            }
        }
        return null
    }

    private fun extractDate(text: String): LocalDate? {
        for (pattern in DATE_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                try {
                    val dateStr = matcher.group(1)
                    return parseDate(dateStr)
                } catch (e: Exception) {
                    continue
                }
            }
        }
        return null
    }

    private fun parseDate(dateStr: String): LocalDate? {
        val formatters = listOf(
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yy"),
            DateTimeFormatter.ofPattern("dd/MM/yy"),
            DateTimeFormatter.ofPattern("d MMM yyyy"),
            DateTimeFormatter.ofPattern("d MMM yy"),
        )
        for (formatter in formatters) {
            try {
                return LocalDate.parse(dateStr, formatter)
            } catch (e: Exception) {
                continue
            }
        }
        return null
    }

    private fun determineType(text: String): TransactionType {
        val creditKeywords = setOf("credited", "received", "deposited", "salary", "refund", "cashback", "reversal")
        return if (creditKeywords.any { text.contains(it) }) TransactionType.INCOME else TransactionType.EXPENSE
    }

    private fun categorizeMerchant(text: String): String {
        val textLower = text.lowercase()
        for ((category, keywords) in CATEGORY_KEYWORDS) {
            if (keywords.any { textLower.contains(it) }) {
                return category
            }
        }
        return "Others"
    }

    private fun calculateConfidence(hasAmount: Boolean, hasMerchant: Boolean): Double {
        return when {
            hasAmount && hasMerchant -> 0.9
            hasAmount -> 0.6
            else -> 0.3
        }
    }
}
