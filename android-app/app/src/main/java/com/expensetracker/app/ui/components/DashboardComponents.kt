package com.expensetracker.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.expensetracker.app.ui.theme.*

@Composable
fun SparklineChart(
    data: List<Double>,
    modifier: Modifier = Modifier,
    color: Color = Mint
) {
    if (data.size < 2) return

    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val maxAmount = data.maxOrNull() ?: 1.0
        val minAmount = data.minOrNull() ?: 0.0
        val range = (maxAmount - minAmount).coerceAtLeast(1.0)

        val points = data.mapIndexed { index, amount ->
            val x = index * (width / (data.size - 1))
            val y = height - ((amount - minAmount) / range * height).toFloat()
            Offset(x, y)
        }

        val path = Path().apply {
            moveTo(points.first().x, points.first().y)
            points.drop(1).forEach { lineTo(it.x, it.y) }
        }

        val fillPath = Path().apply {
            addPath(path)
            lineTo(width, height)
            lineTo(0f, height)
            close()
        }

        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.3f), Color.Transparent),
                startY = 0f,
                endY = height
            )
        )

        drawPath(
            path = path,
            color = color,
            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
        )
    }
}

@Composable
fun StatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(Hairline))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = TextLo)
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = TextHi
            )
        }
    }
}

@Composable
fun HeroCard(
    netAmount: Double,
    income: Double,
    expenses: Double,
    trendData: List<Double>,
    modifier: Modifier = Modifier
) {
    val positive = netAmount >= 0
    val totalFlow = (income + expenses).coerceAtLeast(1.0)
    val incomeShare = (income / totalFlow).toFloat()

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(Hairline))
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // Background glow effect
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                if (positive) Mint.copy(alpha = 0.05f) else Flame.copy(alpha = 0.05f),
                                Color.Transparent
                            ),
                            center = Offset(0f, 0f),
                            radius = 500f
                        )
                    )
            )

            Column(modifier = Modifier.padding(24.dp)) {
                Text(text = "Net this month", style = MaterialTheme.typography.labelMedium, color = TextLo)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = (if (positive) "+" else "-") + "₹${kotlin.math.abs(netAmount)}",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        color = if (positive) Mint else Flame
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Income/Expense Progress Bar
                Column {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.05f))
                    ) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .weight(incomeShare.coerceAtLeast(0.01f))
                                    .background(Mint)
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .weight((1f - incomeShare).coerceAtLeast(0.01f))
                                    .background(Flame)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Mint))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Income", style = MaterialTheme.typography.labelSmall, color = TextLo)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "₹$income", style = MaterialTheme.typography.labelSmall, color = TextHi, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Flame))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Spent", style = MaterialTheme.typography.labelSmall, color = TextLo)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "₹$expenses", style = MaterialTheme.typography.labelSmall, color = TextHi, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Trend Sparkline
                Box(modifier = Modifier.fillMaxWidth().height(80.dp)) {
                    SparklineChart(
                        data = trendData,
                        modifier = Modifier.fillMaxSize(),
                        color = if (positive) Mint else Flame
                    )
                }
            }
        }
    }
}
