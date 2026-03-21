/**
 * LidoStakingFlow - Autonomous ETH Staking with Lido
 * Following ETHSkills patterns for DeFi transaction flows and stETH handling
 * 🌿 Enhanced by Idunn with ETHSkills best practices
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, formatUnits, Address } from 'viem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Coins, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  BarChart3,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';

interface StakingParams {
  ethAmount: string;
  expectedStEth: string;
  currentAPR: number;
  slippage: number;
  autonomousMode: boolean;
}

interface LidoStakingFlowProps {
  params: StakingParams;
  onStakeComplete: (txHash: string, stEthAmount: string) => void;
  onStakeCancel: () => void;
  className?: string;
}

// Lido stETH contract ABI (simplified)
const LIDO_ABI = [
  {
    name: 'submit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_referral', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getTotalPooledEther',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getTotalShares',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

const LIDO_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address; // Mainnet stETH

export const LidoStakingFlow: React.FC<LidoStakingFlowProps> = ({
  params,
  onStakeComplete,
  onStakeCancel,
  className = ''
}) => {
  const { address, isConnected } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stakingStrategy, setStakingStrategy] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  // ETHSkills Rule 1: Separate loading state per action
  const {
    writeContract: writeStakeContract,
    data: stakeTxHash,
    error: stakeError,
    isPending: isStakePending
  } = useWriteContract();

  const {
    isLoading: isStakeConfirming,
    isSuccess: isStakeSuccess,
    error: stakeReceiptError
  } = useWaitForTransactionReceipt({
    hash: stakeTxHash,
  });

  // Read current stETH balance
  const { data: stEthBalance } = useReadContract({
    address: LIDO_ADDRESS,
    abi: LIDO_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read current Lido statistics
  const { data: totalPooledEther } = useReadContract({
    address: LIDO_ADDRESS,
    abi: LIDO_ABI,
    functionName: 'getTotalPooledEther',
  });

  const { data: totalShares } = useReadContract({
    address: LIDO_ADDRESS,
    abi: LIDO_ABI,
    functionName: 'getTotalShares',
  });

  // ETHSkills Rule 4: Show USD Context for Token Values
  const formatAmountWithUSD = (ethAmount: string) => {
    const eth = parseFloat(ethAmount);
    const usd = eth * 2000; // Approximate ETH price
    return `${eth.toFixed(6)} ETH (~$${usd.toFixed(2)})`;
  };

  // Calculate stETH/ETH exchange rate
  const getStEthRate = () => {
    if (!totalPooledEther || !totalShares) return 1.0;
    return Number(formatUnits(totalPooledEther, 18)) / Number(formatUnits(totalShares, 18));
  };

  // Calculate projected annual earnings
  const getProjectedEarnings = () => {
    const ethAmount = parseFloat(params.ethAmount);
    const annualReturn = ethAmount * (params.currentAPR / 100);
    return {
      eth: annualReturn,
      usd: annualReturn * 2000
    };
  };

  // ETHSkills Rule 2: Four-State Action Flow
  const getActionState = () => {
    if (!isConnected) return 'not-connected';
    if (!showConfirmation) return 'needs-confirmation';
    if (parseFloat(params.ethAmount) <= 0) return 'invalid-amount';
    return 'ready-to-stake';
  };

  // Handle staking transaction
  const handleStaking = async () => {
    if (confirmationInput !== 'STAKE ETH') {
      alert('Please type "STAKE ETH" to confirm');
      return;
    }

    try {
      await writeStakeContract({
        address: LIDO_ADDRESS,
        abi: LIDO_ABI,
        functionName: 'submit',
        args: ['0x0000000000000000000000000000000000000000'], // No referral
        value: parseEther(params.ethAmount)
      });
    } catch (error) {
      console.error('Staking failed:', error);
      // ETHSkills Rule 7: Contract Error Translation
      alert('Staking transaction failed. Please check your ETH balance and try again.');
    }
  };

  // Handle successful staking
  useEffect(() => {
    if (isStakeSuccess && stakeTxHash) {
      onStakeComplete(stakeTxHash, params.expectedStEth);
    }
  }, [isStakeSuccess, stakeTxHash, params.expectedStEth, onStakeComplete]);

  const projectedEarnings = getProjectedEarnings();
  const actionState = getActionState();

  return (
    <Card className={`p-6 bg-surface-primary border-border-primary ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Lido ETH Staking</h2>
              <p className="text-sm text-text-secondary">Autonomous yield optimization</p>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            {params.currentAPR.toFixed(2)}% APR
          </Badge>
        </div>

        {/* Staking Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-surface-elevated border-border-primary">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium text-text-primary">Stake Amount</h3>
            </div>
            <p className="text-lg font-semibold text-text-primary">
              {formatAmountWithUSD(params.ethAmount)}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              → {formatAmountWithUSD(params.expectedStEth)} stETH
            </p>
          </Card>

          <Card className="p-4 bg-surface-elevated border-border-primary">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h3 className="font-medium text-text-primary">Annual Earnings</h3>
            </div>
            <p className="text-lg font-semibold text-green-400">
              {projectedEarnings.eth.toFixed(4)} ETH
            </p>
            <p className="text-xs text-text-secondary mt-1">
              ~${projectedEarnings.usd.toFixed(2)} annually
            </p>
          </Card>

          <Card className="p-4 bg-surface-elevated border-border-primary">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="font-medium text-text-primary">Exchange Rate</h3>
            </div>
            <p className="text-lg font-semibold text-text-primary">
              1 ETH = {getStEthRate().toFixed(6)} stETH
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Current Lido rate
            </p>
          </Card>
        </div>

        {/* AI Strategy Selection */}
        {params.autonomousMode && (
          <Card className="p-4 bg-surface-elevated border-border-primary">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-perkos-primary" />
              <h3 className="font-medium text-text-primary">AI Staking Strategy</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {(['conservative', 'balanced', 'aggressive'] as const).map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => setStakingStrategy(strategy)}
                  className={`p-3 rounded-lg text-sm transition-colors ${
                    stakingStrategy === strategy
                      ? 'bg-perkos-primary text-white'
                      : 'bg-surface-primary border border-border-primary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="font-medium mb-1 capitalize">{strategy}</div>
                  <div className="text-xs opacity-80">
                    {strategy === 'conservative' && 'Low risk, steady yields'}
                    {strategy === 'balanced' && 'Moderate risk, good returns'}
                    {strategy === 'aggressive' && 'Higher risk, max yields'}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Current Holdings */}
        {stEthBalance && Number(formatUnits(stEthBalance, 18)) > 0 && (
          <Card className="p-4 bg-surface-elevated border-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-medium text-text-primary">Current stETH Balance</h3>
                  <p className="text-sm text-text-secondary">Earning {params.currentAPR.toFixed(2)}% APR</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-text-primary">
                  {parseFloat(formatUnits(stEthBalance, 18)).toFixed(6)} stETH
                </p>
                <p className="text-xs text-text-secondary">
                  ~${(parseFloat(formatUnits(stEthBalance, 18)) * 2000).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Confirmation Flow */}
        {!showConfirmation ? (
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={actionState !== 'needs-confirmation'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Coins className="w-4 h-4 mr-2" />
            Review Staking Transaction
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-400 mb-2">Confirm ETH Staking</p>
                  <p className="text-text-secondary mb-3">
                    You are about to stake <strong>{formatAmountWithUSD(params.ethAmount)}</strong> to Lido. 
                    You will receive liquid stETH tokens that earn staking rewards.
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-text-secondary">Expected stETH:</p>
                        <p className="font-medium text-text-primary">{params.expectedStEth} stETH</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Annual Yield:</p>
                        <p className="font-medium text-green-400">{params.currentAPR.toFixed(2)}% APR</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-text-secondary mb-1">
                        Type <code className="bg-surface-primary px-1 rounded">STAKE ETH</code> to confirm:
                      </p>
                      <Input
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        placeholder="STAKE ETH"
                        className="bg-surface-primary border-border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmationInput('');
                }}
                variant="outline"
                className="flex-1 border-border-primary text-text-secondary hover:text-text-primary"
              >
                Review Details
              </Button>
              <Button
                onClick={handleStaking}
                disabled={isStakePending || confirmationInput !== 'STAKE ETH'}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isStakePending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Staking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Staking
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {isStakeConfirming && (
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <div>
              <p className="font-medium text-blue-400">Transaction Confirming</p>
              <p className="text-xs text-text-secondary">
                Your ETH is being staked with Lido...
              </p>
            </div>
          </div>
        )}

        {(stakeError || stakeReceiptError) && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Staking Failed</p>
              <p className="text-xs text-text-secondary">
                {stakeError?.message || stakeReceiptError?.message || 'Please try again'}
              </p>
            </div>
          </div>
        )}

        {isStakeSuccess && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium text-green-400">Staking Successful!</p>
              <p className="text-xs text-text-secondary">
                Your ETH is now earning {params.currentAPR.toFixed(2)}% APR with Lido
              </p>
            </div>
          </div>
        )}

        {/* Risk Disclaimer */}
        <div className="text-xs text-text-secondary bg-surface-elevated p-3 rounded-lg border border-border-primary">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-400 mb-1">Staking Risks</p>
              <p>
                Ethereum staking involves risks including potential slashing and smart contract risks. 
                stETH is a liquid staking token that may trade at a small discount to ETH. 
                The AI treasury agent will monitor and optimize your staking positions automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LidoStakingFlow;