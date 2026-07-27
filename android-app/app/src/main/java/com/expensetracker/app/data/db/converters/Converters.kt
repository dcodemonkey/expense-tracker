package com.expensetracker.app.data.db.converters

import androidx.room.TypeConverter
import com.expensetracker.app.data.model.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class Converters {

    @TypeConverter
    fun fromLocalDateTime(value: LocalDateTime?): String? {
        return value?.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }

    @TypeConverter
    fun toLocalDateTime(value: String?): LocalDateTime? {
        return value?.let { LocalDateTime.parse(it, DateTimeFormatter.ISO_LOCAL_DATE_TIME) }
    }

    @TypeConverter
    fun fromLocalDate(value: LocalDate?): String? {
        return value?.format(DateTimeFormatter.ISO_LOCAL_DATE)
    }

    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? {
        return value?.let { LocalDate.parse(it, DateTimeFormatter.ISO_LOCAL_DATE) }
    }

    @TypeConverter
    fun fromTransactionType(value: TransactionType?): String? {
        return value?.name
    }

    @TypeConverter
    fun toTransactionType(value: String?): TransactionType? {
        return value?.let { TransactionType.valueOf(it) }
    }

    @TypeConverter
    fun fromTransactionSource(value: TransactionSource?): String? {
        return value?.name
    }

    @TypeConverter
    fun toTransactionSource(value: String?): TransactionSource? {
        return value?.let { TransactionSource.valueOf(it) }
    }

    @TypeConverter
    fun fromBudgetPeriod(value: BudgetPeriod?): String? {
        return value?.name
    }

    @TypeConverter
    fun toBudgetPeriod(value: String?): BudgetPeriod? {
        return value?.let { BudgetPeriod.valueOf(it) }
    }

    @TypeConverter
    fun fromInsightType(value: InsightType?): String? {
        return value?.name
    }

    @TypeConverter
    fun toInsightType(value: String?): InsightType? {
        return value?.let { InsightType.valueOf(it) }
    }

    @TypeConverter
    fun fromDeviceType(value: DeviceType?): String? {
        return value?.name
    }

    @TypeConverter
    fun toDeviceType(value: String?): DeviceType? {
        return value?.let { DeviceType.valueOf(it) }
    }
}