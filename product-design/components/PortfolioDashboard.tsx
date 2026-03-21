/**
 * PortfolioDashboard - Executive Treasury Overview Component
 * Autonomous treasury management dashboard
 * 🌿 Designed by Idunn for PerkOS Council
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  AlertTriangle, 
  Activity,
  DollarSign,
  BarChart3,
  Settings,
  Pause,
  Play,
  AlertCircle
} from 'lucide-react';

interface PortfolioData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  riskScore: number; // 1-10 scale
  totalYield: number;
  totalYieldPercent: number;
  positions: {
    protocol: string;
    value: number;
    allocation: number;
    yield: number;
    yieldPercent: number;
    color: string;
  }[];
  agentActivity: {
    timestamp: Date;
    agent: string;
    action: string;
    amount: number;
    reasoning: string;
    impact: string;
  }[];
  riskMetrics: {
    liquidityRisk: number;
    protocolRisk: number;
    marketRisk: number;
    concentrationRisk: number;
  };
  isAutonomous: boolean;
}

interface PortfolioDashboardProps {
  data: PortfolioData;
  onEmergencyStop: () => void;
  onPauseStrategy: () => void;
  onResumeStrategy: () => void;
  onAdjustRisk: () => void;
  onViewDetails: (protocol: string) => void;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  data,
  onEmergencyStop,
  onPauseStrategy,
  onResumeStrategy,
  onAdjustRisk,
  onViewDetails
}) => {
  const [showAgentActivity, setShowAgentActivity] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-green-400';
    if (risk <= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskLevel = (risk: number) => {
    if (risk <= 3) return 'Low';
    if (risk <= 6) return 'Medium';
    return 'High';
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Treasury Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Autonomous portfolio management powered by PerkOS AI agents
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Autonomous Status */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-primary rounded-lg border border-border-primary">
            <div className={`w-2 h-2 rounded-full ${data.isAutonomous ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span className="text-sm font-medium text-text-primary">
              {data.isAutonomous ? 'Autonomous' : 'Manual Control'}
            </span>
          </div>

          {/* Emergency Controls */}
          <div className="flex gap-2">
            {data.isAutonomous ? (
              <Button
                onClick={onPauseStrategy}
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={onResumeStrategy}
                variant="outline"
                size="sm"
                className="border-green-400 text-green-400 hover:bg-green-400/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            
            <Button
              onClick={onEmergencyStop}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <Card className="p-6 bg-surface-primary border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Total Portfolio Value</h3>
            <DollarSign className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-text-primary">
              {formatCurrency(data.totalValue)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              data.dayChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.dayChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{formatCurrency(Math.abs(data.dayChange))}</span>
              <span>({formatPercent(data.dayChangePercent)})</span>
            </div>
          </div>
        </Card>

        {/* Total Yield */}
        <Card className="p-6 bg-surface-primary border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Total Yield (Annual)</h3>
            <BarChart3 className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-400">
              {formatPercent(data.totalYieldPercent)}
            </div>
            <div className="text-sm text-text-secondary">
              {formatCurrency(data.totalYield)} annually
            </div>
          </div>
        </Card>

        {/* Risk Score */}
        <Card className="p-6 bg-surface-primary border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">Risk Level</h3>
            <Shield className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getRiskColor(data.riskScore)}`}>
              {data.riskScore}/10
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${getRiskColor(data.riskScore)}`}>
                {getRiskLevel(data.riskScore)} Risk
              </span>
              <Button
                onClick={onAdjustRisk}
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-text-secondary hover:text-text-primary"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* AI Status */}
        <Card className="p-6 bg-surface-primary border-border-primary">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-secondary">AI Agent Status</h3>
            <Activity className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm text-text-primary">Yield Agent Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm text-text-primary">Risk Agent Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm text-text-primary">Rebalance Agent Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Protocol Positions */}
      <Card className="p-6 bg-surface-primary border-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-primary">Protocol Positions</h3>
          <Badge variant="secondary" className="bg-surface-elevated">
            {data.positions.length} Active Protocols
          </Badge>
        </div>
        
        <div className="grid gap-4">
          {data.positions.map((position, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-bg-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
              onClick={() => onViewDetails(position.protocol)}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: position.color }}
                />
                <div>
                  <div className="font-semibold text-text-primary">{position.protocol}</div>
                  <div className="text-sm text-text-secondary">
                    {position.allocation}% allocation
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-text-primary">
                  {formatCurrency(position.value)}
                </div>
                <div className="text-sm text-green-400">
                  +{formatPercent(position.yieldPercent)} APY
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface-primary border-border-primary">
          <h3 className="text-xl font-semibold text-text-primary mb-4">Risk Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Liquidity Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.riskMetrics.liquidityRisk <= 3 ? 'bg-green-400' : data.riskMetrics.liquidityRisk <= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${(data.riskMetrics.liquidityRisk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {data.riskMetrics.liquidityRisk}/10
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Protocol Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.riskMetrics.protocolRisk <= 3 ? 'bg-green-400' : data.riskMetrics.protocolRisk <= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${(data.riskMetrics.protocolRisk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {data.riskMetrics.protocolRisk}/10
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Market Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.riskMetrics.marketRisk <= 3 ? 'bg-green-400' : data.riskMetrics.marketRisk <= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${(data.riskMetrics.marketRisk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {data.riskMetrics.marketRisk}/10
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Concentration Risk</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.riskMetrics.concentrationRisk <= 3 ? 'bg-green-400' : data.riskMetrics.concentrationRisk <= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${(data.riskMetrics.concentrationRisk / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {data.riskMetrics.concentrationRisk}/10
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Agent Activity */}
        <Card className="p-6 bg-surface-primary border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text-primary">AI Agent Activity</h3>
            <Button
              onClick={() => setShowAgentActivity(!showAgentActivity)}
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary"
            >
              {showAgentActivity ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showAgentActivity && (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {data.agentActivity.map((activity, index) => (
                <div key={index} className="border-l-2 border-perkos-primary pl-4 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-perkos-primary">
                      {activity.agent}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-text-primary mb-1">
                    {activity.action} - {formatCurrency(activity.amount)}
                  </div>
                  
                  <div className="text-xs text-text-secondary mb-1">
                    Reasoning: {activity.reasoning}
                  </div>
                  
                  <div className="text-xs text-green-400">
                    Impact: {activity.impact}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PortfolioDashboard;