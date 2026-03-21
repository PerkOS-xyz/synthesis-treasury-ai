# TreasuryAI User Guide

## 🎯 Getting Started

### Who Uses TreasuryAI?
- **CFOs:** Strategic oversight and governance approval
- **Treasury Directors:** Daily monitoring and strategy adjustment  
- **Treasury Analysts:** Performance analysis and reporting
- **Risk Managers:** Risk monitoring and compliance tracking

### Access Levels
- **Executive Dashboard:** High-level performance and risk metrics
- **Operations Console:** Detailed portfolio management and controls
- **Analytics Workbench:** Deep-dive analysis and reporting tools
- **Governance Portal:** Strategy approval and risk parameter setting

## 🖥️ Dashboard Overview

### Executive Summary View
```
┌─ Portfolio Overview ─────────────────────────────┐
│ Total Treasury: $127.3M                         │
│ Deployed Capital: $95.2M (74.8%)                │
│ Current Yield: 11.2% APY                        │
│ 30-day Return: +$923K (+0.73%)                  │
└──────────────────────────────────────────────────┘

┌─ Risk Metrics ──────────┐ ┌─ Protocol Distribution ──┐
│ VaR (1-day): -$127K     │ │ Lido stETH: 35%          │
│ Max Drawdown: -0.23%    │ │ Locus USDC: 28%          │
│ Volatility: 2.1%        │ │ Uniswap V3: 22%          │
│ Sharpe Ratio: 4.8       │ │ Reserve Cash: 15%        │
└─────────────────────────┘ └──────────────────────────┘
```

### Alert Center
```
🟢 Portfolio healthy - all metrics within targets
⚠️  Lido yields declining - rebalancing recommended
🔔 New governance proposal available for review
```

## 📱 Daily Operations

### Morning Treasury Review (5 minutes)
1. **Check overnight performance** - any significant moves?
2. **Review risk alerts** - are any metrics outside targets?
3. **Confirm agent actions** - what decisions were made automatically?
4. **Update cash flow forecasts** - any new liquidity needs?

### Weekly Strategy Review (30 minutes)
1. **Performance analysis** - compare to benchmarks and targets
2. **Risk assessment** - review VaR and exposure metrics
3. **Market conditions** - assess any needed strategy adjustments
4. **Governance queue** - approve or reject agent recommendations

### Monthly Board Reporting (Automated)
- **Treasury performance summary** generated automatically
- **Risk compliance report** with all governance approvals
- **Benchmark comparisons** vs traditional money markets
- **Forward-looking strategy recommendations** from AI analysis

## ⚙️ Configuration & Controls

### Setting Risk Parameters
```markdown
### Yield Optimization Agent
- Target allocation: 60-80% of treasury
- Maximum single protocol: 25%
- Minimum yield threshold: 5% APY
- Rebalancing trigger: 15% deviation

### Risk Management Agent  
- Daily VaR limit: $500K (0.4% of treasury)
- Maximum monthly drawdown: -2%
- Protocol risk rating: A- minimum
- Emergency liquidation: <4 hours

### Governance Agent
- Multi-sig threshold: 2 of 3 executives
- Strategy change approval: CFO required
- Large position approval: >$10M moves
- Emergency action: CRO override available
```

### Protocol Approval Process
1. **AI Analysis:** Agent identifies new yield opportunity
2. **Risk Assessment:** Automated protocol scoring and risk analysis
3. **Treasury Review:** Manual review of opportunity and risk metrics
4. **Executive Approval:** CFO/CRO approval for new protocol integration
5. **Gradual Deployment:** Phased rollout with monitoring checkpoints

## 📊 Monitoring & Analytics

### Key Performance Indicators
- **Absolute Yield:** Current APY vs traditional alternatives
- **Risk-Adjusted Returns:** Sharpe ratio and Sortino ratio
- **Protocol Performance:** Individual strategy contribution
- **Cost Efficiency:** Total fees vs value generated

### Risk Dashboards
- **Value at Risk (VaR):** Daily and weekly exposure estimates
- **Stress Testing:** Portfolio performance under adverse scenarios
- **Correlation Analysis:** Cross-protocol risk concentration
- **Liquidity Metrics:** Time-to-liquidity for all positions

### Compliance Reporting
- **Governance Log:** All approvals and decision audit trails
- **Risk Compliance:** Adherence to board-approved parameters
- **Performance Attribution:** Source of returns by strategy/protocol
- **Regulatory Updates:** Automated compliance with evolving standards

## 🚨 Emergency Procedures

### Circuit Breaker Activation
When portfolio drawdown exceeds -2% in 24 hours:
1. **Automatic suspension** of new position entry
2. **Risk team notification** with detailed loss analysis
3. **Executive escalation** for immediate review
4. **Manual override options** for continued operations

### Liquidity Emergency
When immediate liquidity needed (>$10M in 24 hours):
1. **Automated assessment** of most liquid positions
2. **Optimal exit strategy** to minimize slippage
3. **Execution with approval** based on urgency level
4. **Real-time monitoring** of liquidation progress

### Protocol Risk Events
When protocol experiences security incident:
1. **Immediate position assessment** and exposure calculation
2. **Automated protective measures** if available (pause, withdraw)
3. **Executive notification** with recommendation options
4. **Decision tracking** for audit and learning

## 🎓 Best Practices

### Gradual Deployment Strategy
- **Start small:** Begin with 5-10% of treasury
- **Monitor closely:** Daily review for first 30 days
- **Scale gradually:** Increase based on performance and comfort
- **Maintain reserves:** Keep 20-30% in traditional instruments

### Risk Management
- **Diversification is key:** Never >40% in any single strategy
- **Know your protocols:** Understand risks and mechanics
- **Regular review:** Weekly assessment of all positions
- **Emergency planning:** Practice liquidity scenarios

### Team Communication
- **Daily standup:** 10-minute treasury team sync
- **Weekly deep dive:** Performance and risk analysis
- **Monthly executive brief:** Strategic assessment and planning
- **Quarterly board update:** Comprehensive performance review

## 🔧 Troubleshooting

### Common Issues
**Q: Agent stopped rebalancing positions**
A: Check risk parameters - may have hit exposure limits

**Q: Yields suddenly dropped across all protocols**
A: Market-wide DeFi rate compression - consider strategy adjustment

**Q: Unable to approve new strategy**
A: Verify multi-sig wallet connectivity and approval thresholds

**Q: Emergency liquidation not working**
A: Check protocol-specific pause conditions and gas price settings

### Support Contacts
- **Technical Issues:** PerkOS technical support team
- **Strategy Questions:** Treasury operations consultant
- **Risk Concerns:** Risk management specialist
- **Emergency:** 24/7 crisis management hotline

---

*For detailed technical documentation, see the full README.md and technical specifications.*