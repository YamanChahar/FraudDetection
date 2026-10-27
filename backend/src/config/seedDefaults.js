import mongoose from 'mongoose';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/tokenUtils.js';
import {
  Transaction,
  ModelVersion,
  Prediction,
  FraudAlert,
  InvestigationRecord,
  DatasetTestingJob,
  AuditLog,
} from '../models/index.js';

/**
 * Seeds default platform users and rich demonstration data.
 * Ensures local development & demo environments always have functional login
 * credentials and a populated dataset across all dashboards and analytics.
 */
export async function seedDefaultUsers() {
  try {
    let lead = await userRepository.findByEmail('lead@trace.local');
    let investigator = await userRepository.findByEmail('investigator@trace.local');
    let analyst = await userRepository.findByEmail('analyst@trace.local');

    if (!lead) {
      const passwordHash = await hashPassword('Password123!');

      lead = await userRepository.create({
        name: 'Security Lead',
        email: 'lead@trace.local',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      });

      investigator = await userRepository.create({
        name: 'Senior Investigator',
        email: 'investigator@trace.local',
        passwordHash,
        role: 'INVESTIGATOR',
        isActive: true,
      });

      analyst = await userRepository.create({
        name: 'Fraud Analyst',
        email: 'analyst@trace.local',
        passwordHash,
        role: 'ANALYST',
        isActive: true,
      });

      console.log('[TRACE Seed] Default platform accounts created: lead@trace.local, investigator@trace.local, analyst@trace.local (Password123!)');
    }

    // Seed comprehensive platform demo data if transactions are empty
    await seedPlatformDemoData({ lead, investigator, analyst });
  } catch (err) {
    console.warn('[TRACE Seed] Seeding error:', err.message);
  }
}

async function seedPlatformDemoData({ lead, investigator, analyst }) {
  try {
    const txCount = await Transaction.countDocuments();
    if (txCount > 0) {
      return; // Data already exists
    }

    console.log('[TRACE Seed] Populating rich demonstration data...');

    // 1. Models (Champion, Challenger, Archived)
    let championModel = await ModelVersion.findOne({ name: 'TRACE-XGBoost-V2', version: '2.4.0' });
    if (!championModel) {
      championModel = await ModelVersion.create({
        name: 'TRACE-XGBoost-V2',
        version: '2.4.0',
        algorithm: 'XGBoost',
        status: 'CHAMPION',
        metrics: {
          roc_auc: 0.9842,
          pr_auc: 0.9125,
          precision: 0.941,
          recall: 0.887,
          f1_score: 0.913,
          latency_p95_ms: 18,
          threshold: 0.50,
        },
        inputSchema: { features: 30, scale: 'standard' },
        isActive: true,
        deployedAt: new Date(Date.now() - 86400000 * 30),
      });

      await ModelVersion.create({
        name: 'TRACE-LightGBM-V1',
        version: '1.8.2',
        algorithm: 'LightGBM',
        status: 'CHALLENGER',
        metrics: {
          roc_auc: 0.9785,
          pr_auc: 0.8992,
          precision: 0.923,
          recall: 0.865,
          f1_score: 0.893,
          latency_p95_ms: 12,
          threshold: 0.48,
        },
        inputSchema: { features: 30, scale: 'standard' },
        isActive: true,
        deployedAt: new Date(Date.now() - 86400000 * 14),
      });

      await ModelVersion.create({
        name: 'TRACE-RandomForest-Legacy',
        version: '1.2.0',
        algorithm: 'RandomForest',
        status: 'ARCHIVED',
        metrics: {
          roc_auc: 0.9412,
          pr_auc: 0.8320,
          precision: 0.875,
          recall: 0.812,
          f1_score: 0.842,
          latency_p95_ms: 45,
          threshold: 0.55,
        },
        inputSchema: { features: 30, scale: 'minmax' },
        isActive: false,
        deployedAt: new Date(Date.now() - 86400000 * 90),
      });
    }

    const now = Date.now();
    const hours = (h) => new Date(now - h * 3600000);

    // 2. Demo Transactions & Corresponding Predictions
    const rawTransactions = [
      {
        externalTransactionId: 'TX-2026-98101',
        amount: mongoose.Types.Decimal128.fromString('9450.00'),
        currency: 'USD',
        transactionTimestamp: hours(2),
        merchant: { id: 'M-CRYPTO-99', name: 'Binance OTC Gateway', category: 'Financial Services' },
        customer: { id: 'CUST-8812', email: 'v.dubois@offshore-holding.ch', phone: '+41 79 123 4567' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-FINGERPRINT-ANOMALOUS',
        ipAddress: '197.210.64.12',
        location: { country: 'NG', city: 'Lagos' },
        metadata: { v14: -8.45, v12: -6.21, v10: -5.11, v4: 4.88, v17: -7.12 },
        pred: { score: 96, prob: '0.965', level: 'CRITICAL', label: 1, latency: 21 },
        alert: { severity: 'CRITICAL', status: 'OPEN', assignedTo: lead?._id, desc: 'High-value offshore crypto gateway transaction with high-risk IP jump and velocity anomaly.' }
      },
      {
        externalTransactionId: 'TX-2026-98102',
        amount: mongoose.Types.Decimal128.fromString('3280.00'),
        currency: 'USD',
        transactionTimestamp: hours(6),
        merchant: { id: 'M-LUX-204', name: 'Geneva Horlogerie', category: 'Luxury Retail' },
        customer: { id: 'CUST-3319', email: 's.kovalev@fin-advisory.ru', phone: '+7 916 555 0199' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-TOR-EXIT-NODE',
        ipAddress: '185.220.101.44',
        location: { country: 'RU', city: 'Moscow' },
        metadata: { v14: -7.12, v12: -5.45, v4: 4.10, v10: -4.33 },
        pred: { score: 91, prob: '0.920', level: 'CRITICAL', label: 1, latency: 19 },
        alert: { severity: 'CRITICAL', status: 'IN_REVIEW', assignedTo: investigator?._id, desc: 'Luxury retail transaction from TOR exit node with severe feature deviation.' }
      },
      {
        externalTransactionId: 'TX-2026-98103',
        amount: mongoose.Types.Decimal128.fromString('1850.50'),
        currency: 'EUR',
        transactionTimestamp: hours(12),
        merchant: { id: 'M-ATM-884', name: 'Euronet ATM Terminal 094', category: 'Cash Withdrawal' },
        customer: { id: 'CUST-7741', email: 'k.weber@berlin-tech.de', phone: '+49 151 2345678' },
        channel: 'ATM',
        cardPresent: true,
        deviceId: 'TERM-EURONET-BUCH',
        ipAddress: '82.137.0.15',
        location: { country: 'RO', city: 'Bucharest' },
        metadata: { v14: -4.89, v17: -3.72, v10: -3.11, v4: 3.45 },
        pred: { score: 84, prob: '0.842', level: 'HIGH', label: 1, latency: 16 },
        alert: { severity: 'HIGH', status: 'IN_REVIEW', assignedTo: investigator?._id, desc: 'Foreign ATM withdrawal velocity anomaly detected outside cardholder registered region.' }
      },
      {
        externalTransactionId: 'TX-2026-98104',
        amount: mongoose.Types.Decimal128.fromString('720.00'),
        currency: 'USD',
        transactionTimestamp: hours(18),
        merchant: { id: 'M-GIFT-112', name: 'Prepaid Digital Cards Ltd', category: 'Digital Goods' },
        customer: { id: 'CUST-1049', email: 'j.miller@acme-corp.com', phone: '+1 415 555 2671' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-EMULATOR-ANDROID',
        ipAddress: '104.28.212.18',
        location: { country: 'US', city: 'Dallas' },
        metadata: { v14: -3.85, v4: 2.95, v12: -2.75 },
        pred: { score: 78, prob: '0.778', level: 'HIGH', label: 1, latency: 18 },
        alert: { severity: 'HIGH', status: 'ESCALATED', assignedTo: analyst?._id, desc: 'Digital prepaid gift card checkout from mobile emulator fingerprint.' }
      },
      {
        externalTransactionId: 'TX-2026-98105',
        amount: mongoose.Types.Decimal128.fromString('540.25'),
        currency: 'USD',
        transactionTimestamp: hours(24),
        merchant: { id: 'M-SEPH-44', name: 'Sephora Flagship', category: 'Cosmetics & Retail' },
        customer: { id: 'CUST-5520', email: 'e.chen@pacific-design.sg', phone: '+65 9123 4567' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-SAFARI-MAC-TRUSTED',
        ipAddress: '118.200.12.98',
        location: { country: 'SG', city: 'Singapore' },
        metadata: { v14: -1.95, v10: -1.45, v4: 1.82 },
        pred: { score: 62, prob: '0.615', level: 'MEDIUM', label: 0, latency: 15 },
        alert: { severity: 'MEDIUM', status: 'OPEN', assignedTo: analyst?._id, desc: 'Moderate risk rating: international e-commerce transaction with new shipping address.' }
      },
      {
        externalTransactionId: 'TX-2026-98106',
        amount: mongoose.Types.Decimal128.fromString('1.00'),
        currency: 'USD',
        transactionTimestamp: hours(28),
        merchant: { id: 'M-PUMP-01', name: 'Shell Express Pump #4', category: 'Automotive Fuel' },
        customer: { id: 'CUST-9901', email: 'probe.test@temp-mail.org', phone: '+1 212 555 0184' },
        channel: 'POS',
        cardPresent: false,
        deviceId: 'TERM-GAS-PUMP-UNATTENDED',
        ipAddress: '66.249.79.11',
        location: { country: 'US', city: 'Houston' },
        metadata: { v14: -7.89, v12: -6.44, v17: -5.92, v4: 4.81 },
        pred: { score: 94, prob: '0.941', level: 'CRITICAL', label: 1, latency: 14 },
        alert: { severity: 'CRITICAL', status: 'RESOLVED', assignedTo: investigator?._id, desc: 'Micro-probing card testing attack pattern confirmed and card blocked at gateway.' }
      },
      {
        externalTransactionId: 'TX-2026-98107',
        amount: mongoose.Types.Decimal128.fromString('1.50'),
        currency: 'USD',
        transactionTimestamp: hours(28),
        merchant: { id: 'M-PUMP-01', name: 'Shell Express Pump #4', category: 'Automotive Fuel' },
        customer: { id: 'CUST-9901', email: 'probe.test@temp-mail.org', phone: '+1 212 555 0184' },
        channel: 'POS',
        cardPresent: false,
        deviceId: 'TERM-GAS-PUMP-UNATTENDED',
        ipAddress: '66.249.79.11',
        location: { country: 'US', city: 'Houston' },
        metadata: { v14: -8.11, v12: -6.82, v17: -6.04, v4: 5.12 },
        pred: { score: 95, prob: '0.952', level: 'CRITICAL', label: 1, latency: 15 },
      },
      {
        externalTransactionId: 'TX-2026-98108',
        amount: mongoose.Types.Decimal128.fromString('1120.00'),
        currency: 'EUR',
        transactionTimestamp: hours(36),
        merchant: { id: 'M-AIR-08', name: 'Lufthansa Airlines Booking', category: 'Travel & Aviation' },
        customer: { id: 'CUST-6621', email: 'm.schmidt@frankfurt-law.de', phone: '+49 69 1234567' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-CHROME-WIN-ENTERPRISE',
        ipAddress: '91.198.174.192',
        location: { country: 'DE', city: 'Frankfurt' },
        metadata: { v14: -0.45, v10: 0.12, v4: 0.88 },
        pred: { score: 42, prob: '0.419', level: 'MEDIUM', label: 0, latency: 17 },
      },
      {
        externalTransactionId: 'TX-2026-98109',
        amount: mongoose.Types.Decimal128.fromString('142.50'),
        currency: 'USD',
        transactionTimestamp: hours(42),
        merchant: { id: 'M-WFM-10', name: 'Whole Foods Market #102', category: 'Grocery Retail' },
        customer: { id: 'CUST-1102', email: 'sarah.j@austin-creative.org', phone: '+1 512 555 9812' },
        channel: 'POS',
        cardPresent: true,
        deviceId: 'TERM-INGENICO-WFM',
        ipAddress: '24.28.101.4',
        location: { country: 'US', city: 'Austin' },
        metadata: { v14: 0.85, v10: 0.92, v4: -0.45 },
        pred: { score: 12, prob: '0.118', level: 'LOW', label: 0, latency: 11 },
      },
      {
        externalTransactionId: 'TX-2026-98110',
        amount: mongoose.Types.Decimal128.fromString('15.75'),
        currency: 'USD',
        transactionTimestamp: hours(48),
        merchant: { id: 'M-SBUX-88', name: 'Starbucks Coffee Pike Place', category: 'Food & Beverage' },
        customer: { id: 'CUST-4419', email: 'dan.m@seattle-design.io', phone: '+1 206 555 7711' },
        channel: 'MOBILE_APP',
        cardPresent: false,
        deviceId: 'DEV-IPHONE15-PRO',
        ipAddress: '73.157.44.18',
        location: { country: 'US', city: 'Seattle' },
        metadata: { v14: 1.25, v10: 1.10, v4: -0.85 },
        pred: { score: 6, prob: '0.054', level: 'LOW', label: 0, latency: 9 },
      },
      {
        externalTransactionId: 'TX-2026-98111',
        amount: mongoose.Types.Decimal128.fromString('1250.00'),
        currency: 'USD',
        transactionTimestamp: hours(60),
        merchant: { id: 'M-AWS-01', name: 'Amazon Web Services Cloud', category: 'B2B Software & Cloud' },
        customer: { id: 'CUST-CORP-91', email: 'billing@scale-fintech.net', phone: '+1 800 555 0100' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'CORP-SERVER-AGENT',
        ipAddress: '54.240.198.1',
        location: { country: 'US', city: 'Seattle' },
        metadata: { v14: 0.95, v10: 1.34, v4: -0.62 },
        pred: { score: 8, prob: '0.076', level: 'LOW', label: 0, latency: 10 },
      },
      {
        externalTransactionId: 'TX-2026-98112',
        amount: mongoose.Types.Decimal128.fromString('65.00'),
        currency: 'USD',
        transactionTimestamp: hours(72),
        merchant: { id: 'M-UBER-55', name: 'Uber Technologies Trips', category: 'Transportation' },
        customer: { id: 'CUST-3312', email: 'maya.patel@sf-consulting.com', phone: '+1 415 555 8899' },
        channel: 'MOBILE_APP',
        cardPresent: false,
        deviceId: 'DEV-PIXEL8-PRO',
        ipAddress: '172.56.21.90',
        location: { country: 'US', city: 'San Francisco' },
        metadata: { v14: 1.05, v10: 0.88, v4: -0.55 },
        pred: { score: 9, prob: '0.088', level: 'LOW', label: 0, latency: 12 },
      },
      {
        externalTransactionId: 'TX-2026-98113',
        amount: mongoose.Types.Decimal128.fromString('3150.00'),
        currency: 'USD',
        transactionTimestamp: hours(80),
        merchant: { id: 'M-JEWEL-77', name: 'Cartier Fifth Avenue E-Boutique', category: 'Luxury Jewelry' },
        customer: { id: 'CUST-8831', email: 'unknown.purchaser@proton.me', phone: '+1 917 555 0142' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-FIREFOX-LINUX-UNRECOGNIZED',
        ipAddress: '194.26.29.110',
        location: { country: 'UA', city: 'Kyiv' },
        metadata: { v14: -5.92, v12: -4.85, v4: 3.92, v17: -4.11 },
        pred: { score: 88, prob: '0.884', level: 'HIGH', label: 1, latency: 18 },
        alert: { severity: 'HIGH', status: 'OPEN', assignedTo: lead?._id, desc: 'High-value luxury jewelry order placed via anonymized web client and European IP jump.' }
      },
      {
        externalTransactionId: 'TX-2026-98114',
        amount: mongoose.Types.Decimal128.fromString('350.00'),
        currency: 'USD',
        transactionTimestamp: hours(96),
        merchant: { id: 'M-APPL-01', name: 'Apple Store Michigan Ave', category: 'Consumer Electronics' },
        customer: { id: 'CUST-1049', email: 'j.miller@acme-corp.com', phone: '+1 415 555 2671' },
        channel: 'POS',
        cardPresent: true,
        deviceId: 'TERM-APPLEPAY-NFC',
        ipAddress: '17.253.144.10',
        location: { country: 'US', city: 'Chicago' },
        metadata: { v14: 0.72, v10: 0.81, v4: -0.32 },
        pred: { score: 14, prob: '0.138', level: 'LOW', label: 0, latency: 13 },
      },
      {
        externalTransactionId: 'TX-2026-98115',
        amount: mongoose.Types.Decimal128.fromString('680.00'),
        currency: 'USD',
        transactionTimestamp: hours(120),
        merchant: { id: 'M-HTL-21', name: 'Park Hyatt Tokyo', category: 'Hospitality & Hotels' },
        customer: { id: 'CUST-8812', email: 'v.dubois@offshore-holding.ch', phone: '+41 79 123 4567' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-SAFARI-IPAD',
        ipAddress: '133.242.18.99',
        location: { country: 'JP', city: 'Tokyo' },
        metadata: { v14: -1.45, v10: -0.85, v4: 1.12 },
        pred: { score: 38, prob: '0.382', level: 'MEDIUM', label: 0, latency: 16 },
      },
      {
        externalTransactionId: 'TX-2026-98116',
        amount: mongoose.Types.Decimal128.fromString('45.30'),
        currency: 'USD',
        transactionTimestamp: hours(144),
        merchant: { id: 'M-CVS-94', name: 'CVS Pharmacy #419', category: 'Health & Pharmacy' },
        customer: { id: 'CUST-7712', email: 'robert.t@boston-med.edu', phone: '+1 617 555 3344' },
        channel: 'POS',
        cardPresent: true,
        deviceId: 'TERM-VERIFONE-CVS',
        ipAddress: '65.51.10.22',
        location: { country: 'US', city: 'Boston' },
        metadata: { v14: 1.10, v10: 1.05, v4: -0.74 },
        pred: { score: 11, prob: '0.105', level: 'LOW', label: 0, latency: 11 },
      },
      {
        externalTransactionId: 'TX-2026-98117',
        amount: mongoose.Types.Decimal128.fromString('89.99'),
        currency: 'USD',
        transactionTimestamp: hours(168),
        merchant: { id: 'M-STRM-01', name: 'Netflix International BV', category: 'Digital Subscription' },
        customer: { id: 'CUST-1102', email: 'sarah.j@austin-creative.org', phone: '+1 512 555 9812' },
        channel: 'ONLINE',
        cardPresent: false,
        deviceId: 'DEV-RECURRING-BILLING',
        ipAddress: '198.38.108.1',
        location: { country: 'US', city: 'Austin' },
        metadata: { v14: 1.45, v10: 1.25, v4: -0.92 },
        pred: { score: 5, prob: '0.045', level: 'LOW', label: 0, latency: 8 },
      },
      {
        externalTransactionId: 'TX-2026-98118',
        amount: mongoose.Types.Decimal128.fromString('520.00'),
        currency: 'USD',
        transactionTimestamp: hours(192),
        merchant: { id: 'M-BBY-12', name: 'Best Buy Retail #291', category: 'Consumer Electronics' },
        customer: { id: 'CUST-6621', email: 'm.schmidt@frankfurt-law.de', phone: '+49 69 1234567' },
        channel: 'POS',
        cardPresent: true,
        deviceId: 'TERM-NCR-BESTBUY',
        ipAddress: '12.180.99.14',
        location: { country: 'US', city: 'Dallas' },
        metadata: { v14: 0.35, v10: 0.42, v4: -0.15 },
        pred: { score: 22, prob: '0.218', level: 'LOW', label: 0, latency: 14 },
      },
    ];

    for (const item of rawTransactions) {
      const { pred, alert: alertData, ...txPayload } = item;

      const tx = await Transaction.create(txPayload);

      const prediction = await Prediction.create({
        transactionId: tx._id,
        modelVersionId: championModel._id,
        fraudProbability: mongoose.Types.Decimal128.fromString(pred.prob),
        riskScore: pred.score,
        riskLevel: pred.level,
        predictionStatus: 'SUCCESS',
        predictionLabel: pred.label,
        latencyMs: pred.latency,
        explanationData: {
          topFactors: [
            { feature: 'V14_AnomalyScore', contribution: pred.score > 50 ? 0.38 : -0.25, description: 'PCA component 14 behavioral deviation' },
            { feature: 'V12_VelocityBurst', contribution: pred.score > 50 ? 0.29 : -0.18, description: 'Rapid sequential transaction frequency' },
            { feature: 'V4_AmountDeviation', contribution: pred.score > 50 ? 0.22 : -0.12, description: 'Amount relative to historical profile' },
            { feature: 'GeoDistance_IP', contribution: pred.score > 70 ? 0.18 : 0.02, description: 'Geolocation distance jump between events' },
          ],
        },
        createdAt: tx.transactionTimestamp,
      });

      if (alertData) {
        const createdAlert = await FraudAlert.create({
          transactionId: tx._id,
          predictionId: prediction._id,
          severity: alertData.severity,
          status: alertData.status,
          assignedToId: alertData.assignedTo || null,
          triggeredRules: [
            'RULE_HIGH_VELOCITY_ANOMALY',
            'RULE_ANOMALOUS_GEO_HOP',
            'RULE_PCA_OUTLIER_THRESHOLD',
          ],
          description: alertData.desc,
          resolvedAt: alertData.status === 'RESOLVED' ? hours(20) : null,
          createdAt: tx.transactionTimestamp,
        });

        // Add investigation record for resolved or in-review alerts
        if (alertData.status === 'RESOLVED') {
          await InvestigationRecord.create({
            alertId: createdAlert._id,
            investigatorId: investigator?._id || lead?._id,
            investigationStatus: 'COMPLETED',
            findings: 'Automated card-testing robot verified attacking terminal. Matched blacklist signature.',
            decision: 'CONFIRMED_FRAUD',
            resolution: 'Blocked card identifier at risk gateway, reversed pending test charges, notified issuer bank.',
            isFraud: true,
            lossAmount: mongoose.Types.Decimal128.fromString('2.50'),
            reviewedAt: hours(20),
          });
        } else if (alertData.status === 'IN_REVIEW') {
          await InvestigationRecord.create({
            alertId: createdAlert._id,
            investigatorId: investigator?._id || lead?._id,
            investigationStatus: 'IN_PROGRESS',
            findings: 'Contacted issuing bank security desk to verify cardholder physical location in Munich vs terminal location.',
            decision: null,
            reviewedAt: hours(4),
          });
        }
      }
    }

    // 3. Batch Testing Dataset Jobs
    await DatasetTestingJob.create({
      datasetName: 'Production_Benchmark_Oct2026.csv',
      datasetFormat: 'CSV',
      status: 'COMPLETED',
      totalRecords: 5000,
      processedRecords: 5000,
      failedRecords: 0,
      fraudCount: 142,
      results: {
        precision: 0.948,
        recall: 0.892,
        f1Score: 0.919,
        processingTimeSec: 14.2,
        riskDistribution: { LOW: 4620, MEDIUM: 238, HIGH: 95, CRITICAL: 47 },
      },
      createdById: lead?._id || null,
      startedAt: hours(48),
      completedAt: hours(47),
    });

    await DatasetTestingJob.create({
      datasetName: 'European_Credit_Card_CrossBorder_Audit.csv',
      datasetFormat: 'CSV',
      status: 'COMPLETED',
      totalRecords: 2848,
      processedRecords: 2848,
      failedRecords: 0,
      fraudCount: 49,
      results: {
        precision: 0.952,
        recall: 0.918,
        f1Score: 0.935,
        processingTimeSec: 8.5,
        riskDistribution: { LOW: 2650, MEDIUM: 149, HIGH: 32, CRITICAL: 17 },
      },
      createdById: investigator?._id || null,
      startedAt: hours(24),
      completedAt: hours(23),
    });

    // 4. Audit Trail Logs
    const auditActions = [
      { action: 'PLATFORM_INITIALIZATION', entityType: 'SYSTEM', entityId: 'TRACE-CORE', desc: 'Platform demo seed loaded successfully' },
      { action: 'USER_LOGIN', entityType: 'AUTH', entityId: lead?._id?.toString(), desc: 'Lead operator authenticated via institutional portal' },
      { action: 'MODEL_EVALUATION', entityType: 'MODEL', entityId: championModel._id?.toString(), desc: 'Champion model V2.4.0 telemetry verified (ROC-AUC 0.984)' },
      { action: 'ALERT_ASSIGNMENT', entityType: 'FRAUD_ALERT', entityId: 'ALERT-CRIT-01', desc: 'Critical offshore alert assigned to Senior Investigator' },
    ];

    for (const a of auditActions) {
      await AuditLog.create({
        actorId: lead?._id || null,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        ipAddress: '127.0.0.1',
        userAgent: 'TRACE-SeedManager/1.0',
        metadata: { note: a.desc },
      });
    }

    console.log('[TRACE Seed] Complete platform demo dataset successfully seeded! (18 Transactions, Predictions, Fraud Alerts, Batch Jobs, Models, Audit Logs)');
  } catch (seedErr) {
    console.error('[TRACE Seed] Failed to seed demo dataset:', seedErr);
  }
}
