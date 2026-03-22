import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import winston from 'winston';
import TreasuryAgent from './agents/TreasuryAgent';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

/**
 * TreasuryAI System
 * Autonomous corporate finance system powered by PerkOS STACK
 */
class TreasuryAISystem {
  private app: express.Application;
  private treasuryAgent: TreasuryAgent | null = null;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, { ip: req.ip });
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        agent: {
          running: this.treasuryAgent !== null,
          uptime: process.uptime()
        }
      });
    });

    // Start treasury agent
    this.app.post('/treasury/start', async (req, res) => {
      try {
        if (this.treasuryAgent) {
          return res.status(400).json({
            error: 'Treasury agent already running'
          });
        }

        const privateKey = process.env.TREASURY_PRIVATE_KEY;
        if (!privateKey) {
          return res.status(400).json({
            error: 'Treasury private key not configured'
          });
        }

        this.treasuryAgent = new TreasuryAgent(privateKey);
        
        // Start agent in background
        setImmediate(() => {
          this.treasuryAgent?.start().catch(error => {
            logger.error('Treasury agent crashed:', error);
            this.treasuryAgent = null;
          });
        });

        res.json({
          message: 'Treasury agent started successfully',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Failed to start treasury agent:', error);
        res.status(500).json({
          error: 'Failed to start treasury agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Stop treasury agent
    this.app.post('/treasury/stop', (req, res) => {
      try {
        if (!this.treasuryAgent) {
          return res.status(400).json({
            error: 'Treasury agent not running'
          });
        }

        this.treasuryAgent.stop();
        this.treasuryAgent = null;

        res.json({
          message: 'Treasury agent stopped successfully',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Failed to stop treasury agent:', error);
        res.status(500).json({
          error: 'Failed to stop treasury agent',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Get treasury status
    this.app.get('/treasury/status', (req, res) => {
      res.json({
        running: this.treasuryAgent !== null,
        startTime: process.uptime(),
        // TODO: Add more detailed status from treasury agent
        strategies: {
          active: 3,
          total: 3
        },
        performance: {
          totalAssets: 1000000, // Placeholder
          avgAPY: 650, // Placeholder
          riskScore: 35
        }
      });
    });

    // Get treasury metrics
    this.app.get('/treasury/metrics', async (req, res) => {
      try {
        // TODO: Get actual metrics from treasury agent
        const metrics = {
          totalAssets: 1000000,
          totalYield: 65000,
          avgAPY: 650,
          riskMetrics: {
            volatility: 0.15,
            sharpeRatio: 1.4,
            maxDrawdown: 0.05
          },
          strategies: [
            {
              name: 'Lido Staked ETH',
              allocation: 0.6,
              apy: 400,
              riskScore: 20
            },
            {
              name: 'Locus USDC',
              allocation: 0.3,
              apy: 800,
              riskScore: 45
            },
            {
              name: 'Uniswap V3 LP',
              allocation: 0.1,
              apy: 1200,
              riskScore: 80
            }
          ],
          lastUpdate: new Date().toISOString()
        };

        res.json(metrics);
        
      } catch (error) {
        logger.error('Failed to get treasury metrics:', error);
        res.status(500).json({
          error: 'Failed to get treasury metrics'
        });
      }
    });

    // Emergency stop
    this.app.post('/treasury/emergency-stop', (req, res) => {
      try {
        logger.warn('🚨 EMERGENCY STOP TRIGGERED');
        
        if (this.treasuryAgent) {
          this.treasuryAgent.stop();
          this.treasuryAgent = null;
        }

        // TODO: Trigger emergency withdrawal procedures

        res.json({
          message: 'Emergency stop executed',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Emergency stop failed:', error);
        res.status(500).json({
          error: 'Emergency stop failed'
        });
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
      });
    });

    // Error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
      });
    });
  }

  /**
   * Start the TreasuryAI system
   */
  async start(): Promise<void> {
    try {
      // Create logs directory
      const fs = require('fs');
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
      }

      // Start HTTP server
      this.app.listen(this.port, () => {
        logger.info(`🏦 TreasuryAI System started on port ${this.port}`);
        logger.info('📊 Dashboard: http://localhost:' + this.port + '/health');
        
        // Auto-start treasury agent if private key is provided
        if (process.env.TREASURY_PRIVATE_KEY && process.env.AUTO_START_TREASURY === 'true') {
          logger.info('🤖 Auto-starting treasury agent...');
          this.treasuryAgent = new TreasuryAgent(process.env.TREASURY_PRIVATE_KEY);
          
          setImmediate(() => {
            this.treasuryAgent?.start().catch(error => {
              logger.error('Treasury agent auto-start failed:', error);
              this.treasuryAgent = null;
            });
          });
        }
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        logger.info('🛑 Shutting down TreasuryAI system...');
        
        if (this.treasuryAgent) {
          this.treasuryAgent.stop();
        }
        
        process.exit(0);
      });
      
    } catch (error) {
      logger.error('Failed to start TreasuryAI system:', error);
      process.exit(1);
    }
  }
}

// Start the system
if (require.main === module) {
  const system = new TreasuryAISystem();
  system.start();
}

export default TreasuryAISystem;