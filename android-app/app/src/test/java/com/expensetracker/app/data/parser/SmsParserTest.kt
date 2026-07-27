package com.expensetracker.app.data.parser

import com.expensetracker.app.data.model.TransactionType
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDateTime

class SmsParserTest {

    @Test
    fun testParseDebitSms() {
        val sms = "Rs. 500.00 spent on your HDFC Bank Card ending 1234 at ZOMATO on 27-07-2026. Ref: 123456"
        val sender = "HDFCBK"
        val receivedAt = LocalDateTime.now()
        
        val parsed = SmsParser.parseSms(sms, sender, receivedAt)
        
        assertNotNull(parsed)
        assertEquals(500.0, parsed?.parsedAmount)
        assertEquals("Zomato", parsed?.parsedMerchant)
        assertEquals(TransactionType.EXPENSE, parsed?.parsedType)
        assertEquals("Food & Dining", parsed?.parsedCategory)
    }

    @Test
    fun testParseCreditSms() {
        val sms = "Your a/c no. XXXXXX1234 is credited with Rs. 50000.00 on 01-07-2026 by NEFT. Info: SALARY"
        val sender = "SBIBNK"
        val receivedAt = LocalDateTime.now()
        
        val parsed = SmsParser.parseSms(sms, sender, receivedAt)
        
        assertNotNull(parsed)
        assertEquals(50000.0, parsed?.parsedAmount)
        assertEquals(TransactionType.INCOME, parsed?.parsedType)
        assertEquals("Salary", parsed?.parsedCategory)
    }
}
