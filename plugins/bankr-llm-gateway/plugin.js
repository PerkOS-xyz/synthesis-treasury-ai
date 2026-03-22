/**
 * Bankr LLM Gateway Plugin for TreasuryAI
 * Multi-model AI intelligence with self-sustaining economics
 */

class BankrLLMGatewayPlugin {
  constructor(config) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: 'https://llm.bankr.bot',
      autoTopUp: config.autoTopUp || {
        enabled: true,
        threshold: 5,
        amount: 25,
        source: 'treasury_yield'
      },
      models: {
        risk: 'claude-opus-4.6',
        market: 'gpt-5.2', 
        optimization: 'gemini-pro',
        coding: 'qwen3-coder',
        discovery: 'kimi-k2.5'
      },
      ...config
    };
    
    this.usage = {
      total: 0,
      byModel: {},
      dailyLimit: 50 // $50 daily limit
    };
  }

  /**
   * Multi-model portfolio analysis
   */
  async analyzePortfolio(portfolioData, marketData) {
    const analyses = await Promise.allSettled([
      this.getRiskAnalysis(portfolioData),
      this.getMarketSignals(marketData),
      this.getOptimizationStrategy(portfolioData)
    ]);

    return this.combineAnalyses(analyses);
  }

  /**
   * Risk analysis using Claude
   */
  async getRiskAnalysis(portfolioData) {
    const response = await this.callModel(this.config.models.risk, {
      role: 'system',
      content: 'You are a conservative risk analyst for a treasury management system.'
    }, {
      role: 'user', 
      content: `Analyze risk for this portfolio and suggest risk mitigation strategies:\n${JSON.stringify(portfolioData, null, 2)}`
    });

    return {
      type: 'risk',
      model: this.config.models.risk,
      analysis: response,
      confidence: this.extractConfidence(response),
      recommendations: this.extractRecommendations(response)
    };
  }

  /**
   * Market analysis using GPT
   */
  async getMarketSignals(marketData) {
    const response = await this.callModel(this.config.models.market, {
      role: 'system',
      content: 'You are an aggressive market analyst focused on identifying trading opportunities.'
    }, {
      role: 'user',
      content: `Generate trading signals and identify opportunities:\n${JSON.stringify(marketData, null, 2)}`
    });

    return {
      type: 'market',
      model: this.config.models.market,
      signals: response,
      opportunities: this.extractOpportunities(response),
      timeframe: this.extractTimeframe(response)
    };
  }

  /**
   * Portfolio optimization using Gemini
   */
  async getOptimizationStrategy(portfolioData) {
    const response = await this.callModel(this.config.models.optimization, {
      role: 'system', 
      content: 'You are a balanced portfolio optimizer focused on yield maximization with controlled risk.'
    }, {
      role: 'user',
      content: `Optimize this portfolio allocation for maximum yield:\n${JSON.stringify(portfolioData, null, 2)}`
    });

    return {
      type: 'optimization',
      model: this.config.models.optimization,
      strategy: response,
      allocation: this.extractAllocation(response),
      expectedYield: this.extractYield(response)
    };
  }

  /**
   * Call Bankr LLM Gateway
   */
  async callModel(model, ...messages) {
    try {
      // Check daily limits
      if (this.usage.total > this.usage.dailyLimit) {
        throw new Error('Daily usage limit reached');
      }

      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.1 // Conservative for financial decisions
        })
      });

      if (!response.ok) {
        throw new Error(`Bankr API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Track usage
      this.trackUsage(model, result.usage);
      
      return result.choices[0].message.content;
    } catch (error) {
      console.error('Bankr LLM Gateway error:', error);
      throw error;
    }
  }

  /**
   * Combine multiple AI analyses into consensus
   */
  combineAnalyses(analyses) {
    const successful = analyses
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const consensus = {
      timestamp: Date.now(),
      models_used: successful.map(a => a.type),
      risk_level: this.calculateConsensusRisk(successful),
      recommended_action: this.calculateConsensusAction(successful),
      confidence: this.calculateConsensusConfidence(successful),
      individual_analyses: successful
    };

    return consensus;
  }

  /**
   * Track AI usage and costs
   */
  trackUsage(model, usage) {
    const cost = this.calculateCost(model, usage);
    
    this.usage.total += cost;
    this.usage.byModel[model] = (this.usage.byModel[model] || 0) + cost;

    // Trigger auto top-up if needed
    if (this.config.autoTopUp.enabled) {
      this.checkAutoTopUp();
    }
  }

  /**
   * Auto top-up from treasury yield
   */
  async checkAutoTopUp() {
    const balance = await this.getBalance();
    
    if (balance < this.config.autoTopUp.threshold) {
      await this.topUpFromTreasury(this.config.autoTopUp.amount);
    }
  }

  /**
   * Get current Bankr credit balance
   */
  async getBalance() {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/balance`, {
        headers: {
          'X-API-Key': this.config.apiKey
        }
      });
      
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Top up credits from treasury yield
   */
  async topUpFromTreasury(amount) {
    // This would integrate with treasury contract to transfer USDC
    console.log(`Auto top-up triggered: $${amount} from treasury yield`);
    
    // Implementation would call treasury contract method
    // await treasuryContract.fundAIOperations(amount);
  }

  /**
   * Calculate estimated cost for model usage
   */
  calculateCost(model, usage) {
    const rates = {
      'claude-opus-4.6': 0.015,  // per 1k tokens
      'gpt-5.2': 0.01,
      'gemini-pro': 0.005,
      'qwen3-coder': 0.003,
      'kimi-k2.5': 0.004
    };

    const rate = rates[model] || 0.01;
    const tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    
    return (tokens / 1000) * rate;
  }

  // Helper methods for extracting structured data from AI responses
  extractConfidence(response) {
    // Extract confidence score from AI response
    const match = response.match(/confidence[:\s]+(\d+)%/i);
    return match ? parseInt(match[1]) : 70;
  }

  extractRecommendations(response) {
    // Extract actionable recommendations
    const lines = response.split('\n');
    return lines.filter(line => 
      line.includes('recommend') || 
      line.includes('suggest') ||
      line.includes('should')
    );
  }

  extractOpportunities(response) {
    // Extract trading/yield opportunities
    const opportunities = [];
    if (response.includes('opportunity')) {
      // Parse opportunity data
    }
    return opportunities;
  }

  extractTimeframe(response) {
    // Extract suggested timeframe for actions
    const timeframes = ['immediate', 'short-term', 'medium-term', 'long-term'];
    return timeframes.find(tf => response.toLowerCase().includes(tf)) || 'medium-term';
  }

  extractAllocation(response) {
    // Extract portfolio allocation recommendations
    const allocations = {};
    // Parse allocation percentages from response
    return allocations;
  }

  extractYield(response) {
    // Extract expected yield estimates
    const match = response.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : null;
  }

  calculateConsensusRisk(analyses) {
    // Calculate consensus risk level from multiple analyses
    const riskScores = analyses.map(a => a.confidence || 50);
    return riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
  }

  calculateConsensusAction(analyses) {
    // Determine consensus action recommendation
    return 'hold'; // Simplified - would implement voting logic
  }

  calculateConsensusConfidence(analyses) {
    // Calculate overall confidence in consensus
    const confidences = analyses.map(a => a.confidence || 50);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
}

module.exports = BankrLLMGatewayPlugin;