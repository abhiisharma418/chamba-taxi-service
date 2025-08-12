import { WalletTransaction } from '../models/walletModel.js';
import { User } from '../models/userModel.js';
import mongoose from 'mongoose';

// Get wallet balance for a user
export async function getWalletBalance(userId) {
  try {
    // Calculate balance from all transactions
    const result = await WalletTransaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'credit'] },
                '$amount',
                { $multiply: ['$amount', -1] }
              ]
            }
          }
        }
      }
    ]);

    return result.length > 0 ? Math.max(0, result[0].balance) : 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return 0;
  }
}

// Add money to wallet (credit)
export async function addToWallet(userId, amount, description, referenceId = null) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Create credit transaction
      const transaction = new WalletTransaction({
        userId,
        type: 'credit',
        amount,
        description,
        referenceId,
        balanceBefore: await getWalletBalance(userId),
        status: 'completed'
      });
      
      transaction.balanceAfter = transaction.balanceBefore + amount;
      await transaction.save({ session });

      // Update user's cached wallet balance
      await User.findByIdAndUpdate(
        userId,
        { $inc: { 'wallet.balance': amount } },
        { session }
      );
    });

    return {
      success: true,
      transactionId: `WALLET_${Date.now()}`,
      newBalance: await getWalletBalance(userId)
    };
  } catch (error) {
    console.error('Error adding to wallet:', error);
    return {
      success: false,
      error: 'Failed to add money to wallet'
    };
  } finally {
    await session.endSession();
  }
}

// Deduct money from wallet (debit)
export async function deductFromWallet(userId, amount, description, referenceId = null) {
  const session = await mongoose.startSession();
  
  try {
    const currentBalance = await getWalletBalance(userId);
    
    if (currentBalance < amount) {
      return {
        success: false,
        error: 'Insufficient wallet balance'
      };
    }

    let transactionId;

    await session.withTransaction(async () => {
      // Create debit transaction
      const transaction = new WalletTransaction({
        userId,
        type: 'debit',
        amount,
        description,
        referenceId,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - amount,
        status: 'completed'
      });
      
      await transaction.save({ session });
      transactionId = transaction._id;

      // Update user's cached wallet balance
      await User.findByIdAndUpdate(
        userId,
        { $inc: { 'wallet.balance': -amount } },
        { session }
      );
    });

    return {
      success: true,
      transactionId: transactionId.toString(),
      newBalance: currentBalance - amount
    };
  } catch (error) {
    console.error('Error deducting from wallet:', error);
    return {
      success: false,
      error: 'Failed to deduct money from wallet'
    };
  } finally {
    await session.endSession();
  }
}

// Transfer money between wallets
export async function transferBetweenWallets(fromUserId, toUserId, amount, description) {
  const session = await mongoose.startSession();
  
  try {
    const fromBalance = await getWalletBalance(fromUserId);
    const toBalance = await getWalletBalance(toUserId);
    
    if (fromBalance < amount) {
      return {
        success: false,
        error: 'Insufficient balance for transfer'
      };
    }

    let transferId;

    await session.withTransaction(async () => {
      transferId = `TRANSFER_${Date.now()}`;

      // Debit from sender
      const debitTransaction = new WalletTransaction({
        userId: fromUserId,
        type: 'debit',
        amount,
        description: `Transfer to user: ${description}`,
        referenceId: transferId,
        balanceBefore: fromBalance,
        balanceAfter: fromBalance - amount,
        status: 'completed',
        metadata: {
          transferType: 'outgoing',
          toUserId: toUserId
        }
      });
      
      await debitTransaction.save({ session });

      // Credit to receiver
      const creditTransaction = new WalletTransaction({
        userId: toUserId,
        type: 'credit',
        amount,
        description: `Transfer from user: ${description}`,
        referenceId: transferId,
        balanceBefore: toBalance,
        balanceAfter: toBalance + amount,
        status: 'completed',
        metadata: {
          transferType: 'incoming',
          fromUserId: fromUserId
        }
      });
      
      await creditTransaction.save({ session });

      // Update both users' cached balances
      await User.findByIdAndUpdate(
        fromUserId,
        { $inc: { 'wallet.balance': -amount } },
        { session }
      );
      
      await User.findByIdAndUpdate(
        toUserId,
        { $inc: { 'wallet.balance': amount } },
        { session }
      );
    });

    return {
      success: true,
      transferId,
      fromBalance: fromBalance - amount,
      toBalance: toBalance + amount
    };
  } catch (error) {
    console.error('Error transferring between wallets:', error);
    return {
      success: false,
      error: 'Transfer failed'
    };
  } finally {
    await session.endSession();
  }
}

// Get wallet transaction history
export async function getWalletTransactions(userId, page = 1, limit = 20, type = null) {
  try {
    let query = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('referenceId')
      .lean();

    const total = await WalletTransaction.countDocuments(query);

    return {
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    return {
      success: false,
      error: 'Failed to get transaction history'
    };
  }
}

// Process wallet refund
export async function processWalletRefund(userId, amount, reason, originalTransactionId) {
  try {
    const result = await addToWallet(
      userId, 
      amount, 
      `Refund: ${reason}`, 
      originalTransactionId
    );

    if (result.success) {
      // Mark the refund transaction with special metadata
      await WalletTransaction.findOneAndUpdate(
        { 
          userId, 
          referenceId: originalTransactionId,
          type: 'credit',
          description: { $regex: /^Refund:/ }
        },
        {
          $set: {
            'metadata.isRefund': true,
            'metadata.refundReason': reason,
            'metadata.originalTransactionId': originalTransactionId
          }
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error processing wallet refund:', error);
    return {
      success: false,
      error: 'Refund processing failed'
    };
  }
}

// Freeze/unfreeze wallet (for security purposes)
export async function freezeWallet(userId, reason) {
  try {
    await User.findByIdAndUpdate(userId, {
      'wallet.isFrozen': true,
      'wallet.freezeReason': reason,
      'wallet.frozenAt': new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error freezing wallet:', error);
    return { success: false, error: 'Failed to freeze wallet' };
  }
}

export async function unfreezeWallet(userId) {
  try {
    await User.findByIdAndUpdate(userId, {
      'wallet.isFrozen': false,
      'wallet.freezeReason': null,
      'wallet.unfrozenAt': new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error unfreezing wallet:', error);
    return { success: false, error: 'Failed to unfreeze wallet' };
  }
}

// Get wallet statistics for a user
export async function getWalletStats(userId, days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const stats = await WalletTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const result = {
      period: `${days} days`,
      totalCredit: 0,
      totalDebit: 0,
      creditCount: 0,
      debitCount: 0,
      avgCreditAmount: 0,
      avgDebitAmount: 0,
      netAmount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'credit') {
        result.totalCredit = stat.totalAmount;
        result.creditCount = stat.transactionCount;
        result.avgCreditAmount = stat.avgAmount;
      } else {
        result.totalDebit = stat.totalAmount;
        result.debitCount = stat.transactionCount;
        result.avgDebitAmount = stat.avgAmount;
      }
    });

    result.netAmount = result.totalCredit - result.totalDebit;

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error getting wallet stats:', error);
    return {
      success: false,
      error: 'Failed to get wallet statistics'
    };
  }
}

// Validate wallet transaction
export async function validateWalletTransaction(userId, amount, type) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { isValid: false, error: 'User not found' };
    }

    if (user.wallet && user.wallet.isFrozen) {
      return { isValid: false, error: 'Wallet is frozen' };
    }

    if (type === 'debit') {
      const currentBalance = await getWalletBalance(userId);
      if (currentBalance < amount) {
        return { isValid: false, error: 'Insufficient balance' };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating wallet transaction:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}
