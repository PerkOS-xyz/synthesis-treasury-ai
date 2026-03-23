# TreasuryAI API Documentation

## Overview

The TreasuryAI API provides enterprise-grade endpoints for autonomous corporate treasury management on Base Mainnet with real USDC operations.

## Base Configuration

```typescript
// TreasuryAI API Configuration
const TREASURY_CONFIG = {
  baseUrl: 'https://api.treasuryai.perkos.xyz',
  version: 'v1',
  network: 'base-mainnet',
  chainId: 8453,
  baseCurrency: 'USDC'
}
```

## Authentication

### Corporate Authentication
```typescript
import { signMessage } from '@wagmi/core'

const authenticateTreasuryWallet = async (treasuryAddress: string) => {
  const message = `TreasuryAI Corporate Access: ${Date.now()}`
  const signature = await signMessage({ message })
  
  return {
    treasuryAddress,
    message,
    signature,
    timestamp: Date.now(),
    permissions: ['read', 'execute', 'approve']
  }
}
```

### Multi-signature Authentication
```bash
curl -H "Authorization: Bearer TREASURY_API_KEY" \
     -H "X-MultiSig-Address: 0x123...abc" \
     -H "Content-Type: application/json" \
     https://api.treasuryai.perkos.xyz/v1/treasury/balance
```

## Treasury Management Endpoints

### GET /v1/treasury/balance
Retrieve comprehensive treasury balance and asset allocation.

**Response:**
```json
{
  "treasury": {
    "totalValue": "2500000.00",
    "currency": "USD",
    "lastUpdated": "2026-03-23T02:00:00Z",
    "assets": [
      {
        "symbol": "USDC",
        "balance": "2000000.00",
        "value": "2000000.00",
        "percentage": 80.0,
        "contract": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      },
      {
        "symbol": "stETH",
        "balance": "150.45",
        "value": "500000.00",
        "percentage": 20.0,
        "apy": "4.2",
        "protocol": "Lido"
      }
    ],
    "performance": {
      "dailyChange": "+0.15%",
      "weeklyChange": "+1.2%",
      "monthlyChange": "+4.8%",
      "yearlyProjection": "5.2%"
    }
  }
}
```

### POST /v1/treasury/strategy/optimize
Execute AI-driven treasury optimization strategy.

**Request Body:**
```json
{
  "optimizationGoals": {
    "targetApy": "5.0",
    "riskTolerance": "moderate",
    "liquidityRequirement": "500000",
    "complianceProfile": "corporate"
  },
  "constraints": {
    "maxSingleProtocol": "40%",
    "minStablecoinRatio": "60%",
    "allowedProtocols": ["lido", "aave", "compound"]
  },
  "executionMode": "simulation"
}
```

**Response:**
```json
{
  "optimizationResult": {
    "strategyId": "strat_001",
    "expectedApy": "5.15%",
    "riskScore": 3.2,
    "projectedRevenue": "128750",
    "transactions": [
      {
        "action": "stake",
        "protocol": "lido",
        "amount": "300000",
        "asset": "USDC",
        "expectedApy": "4.2%",
        "gasEstimate": "0.003"
      },
      {
        "action": "supply",
        "protocol": "aave",
        "amount": "200000",
        "asset": "USDC",
        "expectedApy": "3.8%",
        "gasEstimate": "0.005"
      }
    ],
    "executionEstimate": "5-10 minutes",
    "totalGasCost": "0.008"
  }
}
```

### POST /v1/treasury/strategy/execute
Execute approved treasury optimization strategy.

**Request Body:**
```json
{
  "strategyId": "strat_001",
  "approvalSignatures": [
    {
      "signer": "0x123...abc",
      "signature": "0xdef...456",
      "role": "treasurer"
    },
    {
      "signer": "0x789...ghi", 
      "signature": "0x321...fed",
      "role": "cfo"
    }
  ],
  "slippageTolerance": "0.5",
  "maxGasPrice": "50"
}
```

### GET /v1/treasury/analytics
Comprehensive treasury performance analytics.

**Parameters:**
- `period` (optional): 1d, 7d, 30d, 90d, 1y
- `metrics` (optional): performance, risk, allocation, compliance
- `format` (optional): json, csv

**Response:**
```json
{
  "analytics": {
    "period": "30d",
    "performance": {
      "totalReturn": "4.2%",
      "sharpeRatio": 1.35,
      "maxDrawdown": "0.8%",
      "volatility": "2.1%",
      "benchmarkOutperformance": "+1.1%"
    },
    "riskMetrics": {
      "valueAtRisk95": "45000",
      "expectedShortfall": "67000",
      "protocolConcentration": {
        "lido": "25%",
        "aave": "15%",
        "compound": "10%"
      }
    },
    "allocation": {
      "stablecoins": "50%",
      "stakingDerivatives": "30%",
      "lendingProtocols": "20%"
    }
  }
}
```

## AI Agent Integration

### GET /v1/ai/recommendations
Get AI-driven treasury recommendations.

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_001",
      "priority": "high",
      "category": "yield_optimization",
      "title": "Increase stETH allocation for higher yield",
      "description": "Current stETH allocation at 20% could be increased to 30% for additional 0.8% APY",
      "impact": {
        "expectedRevenue": "+20000",
        "riskChange": "+0.2",
        "confidenceScore": 0.85
      },
      "requiredActions": [
        "Stake additional 300,000 USDC in Lido",
        "Adjust risk monitoring thresholds"
      ]
    }
  ]
}
```

### POST /v1/ai/analysis
Submit custom treasury analysis request.

**Request Body:**
```json
{
  "analysisType": "scenario_analysis",
  "parameters": {
    "scenarios": [
      {
        "name": "Market Downturn",
        "ethPriceChange": "-30%",
        "stablecoinDepeg": "0.02%",
        "protocolRisk": "elevated"
      },
      {
        "name": "High Yield Environment", 
        "baseRates": "+200bps",
        "defiYields": "+150bps"
      }
    ],
    "timeHorizon": "90d"
  }
}
```

## Risk Management

### GET /v1/risk/assessment
Real-time risk assessment of treasury positions.

**Response:**
```json
{
  "riskAssessment": {
    "overallRiskScore": 3.2,
    "riskFactors": [
      {
        "factor": "smart_contract_risk",
        "score": 2.8,
        "protocols": ["lido", "aave"],
        "mitigation": "Protocol diversification active"
      },
      {
        "factor": "market_risk",
        "score": 3.5,
        "exposure": "500000",
        "hedging": "partial_hedge_active"
      }
    ],
    "alerts": [
      {
        "severity": "medium",
        "message": "Single protocol exposure approaching 40% limit",
        "protocol": "lido",
        "recommendation": "Diversify allocation"
      }
    ]
  }
}
```

### POST /v1/risk/limits/set
Configure treasury risk limits and circuit breakers.

**Request Body:**
```json
{
  "riskLimits": {
    "maxProtocolExposure": "40%",
    "maxVolatilityThreshold": "5%",
    "minLiquidityBuffer": "500000",
    "maxDailyLoss": "100000"
  },
  "circuitBreakers": {
    "enabled": true,
    "triggers": [
      {
        "condition": "daily_loss > 100000",
        "action": "pause_new_investments"
      },
      {
        "condition": "protocol_exploit_detected",
        "action": "emergency_withdrawal"
      }
    ]
  }
}
```

## Compliance and Reporting

### GET /v1/compliance/report
Generate comprehensive compliance report.

**Parameters:**
- `period` (required): reporting period
- `format` (optional): json, pdf, csv
- `standards` (optional): sox, gaap, ifrs

**Response:**
```json
{
  "complianceReport": {
    "period": "Q1-2026",
    "standard": "sox",
    "status": "compliant",
    "sections": {
      "assetClassification": "complete",
      "riskDisclosures": "complete", 
      "performanceReporting": "complete",
      "auditTrail": "complete"
    },
    "auditTrail": {
      "totalTransactions": 156,
      "approvalCompliance": "100%",
      "documentationComplete": true,
      "externalAuditorAccess": true
    }
  }
}
```

### GET /v1/compliance/audit-trail
Detailed audit trail for all treasury operations.

**Response:**
```json
{
  "auditTrail": [
    {
      "transactionId": "tx_001",
      "timestamp": "2026-03-22T14:30:00Z",
      "action": "stake_usdc",
      "amount": "300000",
      "protocol": "lido",
      "approvers": [
        {
          "address": "0x123...abc",
          "role": "treasurer",
          "timestamp": "2026-03-22T14:25:00Z"
        }
      ],
      "transactionHash": "0x6bf7802be7f8a35d6f6e5a034269127d487977333b9fb171a5eff943e34da0fd",
      "gasUsed": "0.003",
      "blockNumber": 12345678
    }
  ]
}
```

## Smart Contract Integration

### TreasuryVault Contract
**Address:** `0x95BbaD1daa5f2a17BF225084c075E4e128226CFC`

#### Key Methods
```solidity
// Deposit USDC to treasury
function depositUSDC(uint256 amount) external onlyAuthorized

// Execute yield strategy
function executeStrategy(
    address protocol,
    uint256 amount,
    bytes calldata strategyData
) external onlyApproved

// Emergency withdrawal
function emergencyWithdraw(address asset) external onlyOwner

// Get treasury balance
function getTreasuryBalance() external view returns (uint256 totalValue)
```

## Webhooks and Events

### Treasury Events
Configure webhooks for real-time treasury notifications.

```json
{
  "webhookEvents": [
    "treasury.balance_updated",
    "strategy.executed", 
    "risk.limit_exceeded",
    "compliance.report_generated",
    "ai.recommendation_generated"
  ]
}
```

### Event Payload Example
```json
{
  "event": "strategy.executed",
  "timestamp": "2026-03-23T02:00:00Z",
  "data": {
    "strategyId": "strat_001",
    "amount": "300000",
    "protocol": "lido",
    "expectedApy": "4.2%",
    "transactionHash": "0x6bf7802be7f8a35d6f6e5a034269127d487977333b9fb171a5eff943e34da0fd",
    "executedBy": "0x123...abc"
  }
}
```

## SDK and Integration

### TypeScript SDK
```bash
npm install @perkos/treasuryai-sdk
```

```typescript
import { TreasuryAIClient } from '@perkos/treasuryai-sdk'

const treasury = new TreasuryAIClient({
  apiKey: process.env.TREASURY_API_KEY,
  network: 'base-mainnet',
  multisigAddress: '0x123...abc'
})

// Get treasury balance
const balance = await treasury.getBalance()

// Execute optimization strategy
const strategy = await treasury.optimizeYield({
  targetApy: '5.0%',
  riskTolerance: 'moderate'
})

// Execute with multi-sig approval
await treasury.executeStrategy(strategy.id, {
  approvals: [signature1, signature2]
})
```

## Error Handling

### Common Error Codes
- `INSUFFICIENT_TREASURY_BALANCE` - Treasury lacks required funds
- `STRATEGY_EXECUTION_FAILED` - Strategy could not be executed
- `RISK_LIMIT_EXCEEDED` - Operation exceeds configured risk limits
- `MULTISIG_APPROVAL_REQUIRED` - Multi-signature approval needed
- `COMPLIANCE_VIOLATION` - Operation violates compliance rules

### Error Response Format
```json
{
  "error": {
    "code": "RISK_LIMIT_EXCEEDED",
    "message": "Protocol exposure would exceed 40% limit",
    "details": {
      "currentExposure": "35%",
      "proposedExposure": "45%",
      "limit": "40%",
      "protocol": "lido"
    },
    "suggestion": "Reduce allocation amount or diversify across protocols"
  }
}
```

## Rate Limits and Quotas

- **Treasury Operations:** 100 per hour
- **Analytics Requests:** 1000 per hour
- **Real-time Data:** 10,000 per hour
- **Webhook Deliveries:** 5 retries with exponential backoff

## Support and Resources

- **Technical Documentation:** https://docs.treasuryai.perkos.xyz
- **API Status:** https://status.treasuryai.perkos.xyz
- **Treasury Support:** treasury-support@perkos.xyz
- **Emergency Contact:** +1-555-TREASURY (24/7)

---

**API Version:** v1.0.0  
**Last Updated:** March 2026  
**Compliance:** SOX, GAAP, IFRS Compatible