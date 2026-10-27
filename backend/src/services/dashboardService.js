import { Transaction, Prediction, FraudAlert, InvestigationRecord } from '../models/index.js';

export async function getDashboardOverview() {
  // 1. Overall Metric Counts
  const [
    totalTransactions,
    highRiskCount,
    criticalRiskCount,
    totalAlerts,
    openAlerts,
    pendingInvestigations,
  ] = await Promise.all([
    Transaction.countDocuments(),
    Prediction.countDocuments({ riskLevel: 'HIGH' }),
    Prediction.countDocuments({ riskLevel: 'CRITICAL' }),
    FraudAlert.countDocuments(),
    FraudAlert.countDocuments({
      status: { $in: ['OPEN', 'IN_REVIEW', 'ESCALATED'] },
    }),
    InvestigationRecord.countDocuments({
      investigationStatus: 'IN_PROGRESS',
    }),
  ]);

  // 2. Risk Distribution Aggregation
  const riskAgg = await Prediction.aggregate([
    {
      $group: {
        _id: '$riskLevel',
        count: { $sum: 1 },
        avgRiskScore: { $avg: '$riskScore' },
      },
    },
  ]);

  const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const totalPredicted = riskAgg.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const riskDistribution = riskLevels.map((level) => {
    const found = riskAgg.find((r) => r._id === level);
    const count = found ? found.count : 0;
    return {
      level,
      count,
      percentage: Math.round((count / totalPredicted) * 100),
      avgScore: found ? Math.round(found.avgRiskScore) : 0,
    };
  });

  // 3. Volume Over Time (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const volumeAgg = await Transaction.aggregate([
    {
      $match: {
        timestamp: { $gte: fourteenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 4. Recent Suspicious Transactions (with predictions)
  const recentSuspicious = await Prediction.find({
    riskLevel: { $in: ['HIGH', 'CRITICAL'] },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('transactionId')
    .lean();

  const formattedRecentSuspicious = recentSuspicious.map((pred) => {
    const tx = pred.transactionId || {};
    return {
      predictionId: pred._id,
      transactionId: tx._id || pred.transactionId,
      externalTransactionId: tx.externalTransactionId || 'N/A',
      amount: tx.amount ? parseFloat(tx.amount.toString()) : 0,
      currency: tx.currency || 'USD',
      riskScore: pred.riskScore,
      riskLevel: pred.riskLevel,
      fraudProbability: pred.fraudProbability ? parseFloat(pred.fraudProbability.toString()) : 0,
      timestamp: tx.timestamp || pred.createdAt,
    };
  });

  // 5. Recent Alerts
  const recentAlerts = await FraudAlert.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('transactionId')
    .populate('assignedToId', 'name email role')
    .lean();

  const formattedRecentAlerts = recentAlerts.map((alert) => ({
    id: alert._id,
    severity: alert.severity,
    status: alert.status,
    description: alert.description || 'Elevated fraud risk pattern detected',
    transactionId: alert.transactionId?._id,
    externalTransactionId: alert.transactionId?.externalTransactionId || 'N/A',
    amount: alert.transactionId?.amount ? parseFloat(alert.transactionId.amount.toString()) : 0,
    assignedTo: alert.assignedToId?.name || null,
    createdAt: alert.createdAt,
  }));

  return {
    metrics: {
      totalTransactions,
      highRiskTransactions: highRiskCount,
      criticalRiskTransactions: criticalRiskCount,
      totalAlerts,
      openAlerts,
      pendingInvestigations,
    },
    riskDistribution,
    volumeOverTime: volumeAgg.map((v) => ({
      date: v._id,
      transactions: v.count,
    })),
    recentSuspicious: formattedRecentSuspicious,
    recentAlerts: formattedRecentAlerts,
  };
}
