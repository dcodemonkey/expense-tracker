package com.expensetracker.app.data.model

import com.expensetracker.app.data.local.*

fun ParsedMessage.toEntity(): ParsedMessageEntity {
    return ParsedMessageEntity(
        id = this.id,
        userId = this.userId,
        deviceId = this.deviceId,
        source = this.source,
        rawContent = this.rawContent,
        sender = this.sender,
        receivedAt = this.receivedAt,
        parsedAmount = this.parsedAmount,
        parsedCurrency = this.parsedCurrency,
        parsedMerchant = this.parsedMerchant,
        parsedCategory = this.parsedCategory,
        parsedDate = this.parsedDate,
        parsedType = this.parsedType,
        confidenceScore = this.confidenceScore,
        isProcessed = this.isProcessed,
        transactionId = this.transactionId,
        createdAt = this.createdAt,
        processedAt = this.processedAt
    )
}

fun ParsedMessageEntity.toDomain(): ParsedMessage {
    return ParsedMessage(
        id = this.id,
        userId = this.userId,
        deviceId = this.deviceId,
        source = this.source,
        rawContent = this.rawContent,
        sender = this.sender,
        receivedAt = this.receivedAt,
        parsedAmount = this.parsedAmount,
        parsedCurrency = this.parsedCurrency,
        parsedMerchant = this.parsedMerchant,
        parsedCategory = this.parsedCategory,
        parsedDate = this.parsedDate,
        parsedType = this.parsedType,
        confidenceScore = this.confidenceScore,
        isProcessed = this.isProcessed,
        transactionId = this.transactionId,
        createdAt = this.createdAt,
        processedAt = this.processedAt
    )
}

fun Transaction.toEntity(): TransactionEntity {
    return TransactionEntity(
        id = this.id,
        userId = this.userId,
        categoryId = this.categoryId,
        amount = this.amount,
        currency = this.currency,
        type = this.type,
        source = this.source,
        status = this.status,
        description = this.description,
        merchantName = this.merchantName,
        transactionDate = this.transactionDate,
        rawMessage = this.rawMessage,
        parsedConfidence = this.parsedConfidence,
        synced = this.synced,
        createdAt = this.createdAt,
        updatedAt = this.updatedAt
    )
}

fun TransactionEntity.toDomain(): Transaction {
    return Transaction(
        id = this.id,
        userId = this.userId,
        amount = this.amount,
        currency = this.currency,
        type = this.type,
        source = this.source,
        status = this.status,
        categoryId = this.categoryId,
        description = this.description,
        merchantName = this.merchantName,
        transactionDate = this.transactionDate,
        rawMessage = this.rawMessage,
        parsedConfidence = this.parsedConfidence,
        createdAt = this.createdAt,
        updatedAt = this.updatedAt,
        synced = this.synced
    )
}

fun Category.toEntity(): CategoryEntity {
    return CategoryEntity(
        id = id,
        userId = userId,
        parentId = parentId,
        name = name,
        icon = icon,
        color = color,
        isDefault = isDefault,
        isActive = isActive,
        createdAt = createdAt
    )
}

fun Budget.toEntity(): BudgetEntity {
    return BudgetEntity(
        id = id,
        userId = userId,
        categoryId = categoryId,
        name = name,
        amount = amount,
        period = period,
        startDate = startDate,
        endDate = endDate,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun Device.toEntity(): DeviceEntity {
    return DeviceEntity(
        id = id,
        userId = userId,
        deviceId = deviceId,
        deviceType = deviceType,
        deviceName = deviceName,
        fcmToken = fcmToken,
        lastSyncAt = lastSyncAt,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

fun DailyInsight.toEntity(): DailyInsightEntity {
    return DailyInsightEntity(
        id = id,
        userId = userId,
        insightDate = insightDate,
        insightType = insightType,
        title = title,
        description = description,
        data = data,
        priority = priority,
        isRead = isRead,
        createdAt = createdAt
    )
}
