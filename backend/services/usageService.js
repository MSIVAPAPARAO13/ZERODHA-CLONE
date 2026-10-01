const { UsageEventModel } = require("../models/UsageEventModel");
const { UsageCounterModel } = require("../models/UsageCounterModel");
const { PLANS, getPlan, getPlanLimits } = require("../config/planConfig");

class UsageService {
  /**
   * Current monthly billing period key (YYYY-MM)
   */
  getCurrentPeriod() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * Get user's active plan
   */
  async getUserPlan(userId) {
    const period = this.getCurrentPeriod();
    const record = await UsageCounterModel.findOne({ user: userId, period }).lean();
    const planId = record?.plan || "FREE";
    return getPlan(planId);
  }

  /**
   * Set / Upgrade user's active plan
   */
  async setUserPlan(userId, planId) {
    const period = this.getCurrentPeriod();
    const validPlan = getPlan(planId).id;

    const counter = await UsageCounterModel.findOneAndUpdate(
      { user: userId, period },
      { $set: { plan: validPlan } },
      { upsert: true, new: true }
    );

    return getPlan(validPlan);
  }

  /**
   * Record discrete feature usage
   */
  async recordUsage(userId, feature, quantity = 1, metadata = {}, orgId = null) {
    const period = this.getCurrentPeriod();
    const qty = Math.max(1, Number(quantity) || 1);

    // 1. Audit log event
    await UsageEventModel.create({
      user: userId,
      organization: orgId,
      feature,
      quantity: qty,
      metadata,
      timestamp: new Date()
    });

    // 2. Increment monthly aggregate
    const fieldKey = `counters.${feature}`;
    const updatedCounter = await UsageCounterModel.findOneAndUpdate(
      { user: userId, period },
      {
        $inc: { [fieldKey]: qty },
        $setOnInsert: { organization: orgId, plan: "FREE" }
      },
      { upsert: true, new: true }
    );

    return {
      feature,
      quantityRecorded: qty,
      newTotal: updatedCounter.counters.get(feature) || 0,
      period
    };
  }

  /**
   * Check whether an action is allowed within plan quota
   */
  async checkQuota(userId, feature, requestedQuantity = 1, orgId = null) {
    const period = this.getCurrentPeriod();
    const counterDoc = await UsageCounterModel.findOne({ user: userId, period }).lean();

    const planId = counterDoc?.plan || "FREE";
    const limits = getPlanLimits(planId);
    const limit = limits[feature] ?? Infinity;

    const rawMap = counterDoc?.counters || {};
    const current = (rawMap instanceof Map ? rawMap.get(feature) : rawMap[feature]) || 0;
    const requested = Math.max(1, Number(requestedQuantity) || 1);

    const allowed = (current + requested) <= limit;
    const remaining = Math.max(0, limit - current);

    return {
      allowed,
      feature,
      current,
      requested,
      limit,
      remaining,
      plan: planId
    };
  }

  /**
   * Get current usage summary for user
   */
  async getUsage(userId, orgId = null) {
    const period = this.getCurrentPeriod();
    const counterDoc = await UsageCounterModel.findOne({ user: userId, period }).lean();

    const planId = counterDoc?.plan || "FREE";
    const plan = getPlan(planId);
    const rawCounters = counterDoc?.counters || {};

    const usage = {};
    Object.keys(plan.limits).forEach(feature => {
      usage[feature] = (rawCounters instanceof Map ? rawCounters.get(feature) : rawCounters[feature]) || 0;
    });

    return {
      period,
      plan: plan.id,
      planName: plan.name,
      usage,
      limits: plan.limits
    };
  }

  /**
   * Get quota limits and remaining allowances
   */
  async getLimits(userId, orgId = null) {
    const summary = await this.getUsage(userId, orgId);
    const remaining = {};

    Object.keys(summary.limits).forEach(feature => {
      const used = summary.usage[feature] || 0;
      const limit = summary.limits[feature];
      remaining[feature] = Math.max(0, limit - used);
    });

    return {
      period: summary.period,
      plan: summary.plan,
      limits: summary.limits,
      usage: summary.usage,
      remaining
    };
  }

  /**
   * Reset usage counters (for cycle rollover or testing)
   */
  async resetUsage(userId, feature = null) {
    const period = this.getCurrentPeriod();
    if (feature) {
      await UsageCounterModel.updateOne(
        { user: userId, period },
        { $unset: { [`counters.${feature}`]: 1 } }
      );
    } else {
      await UsageCounterModel.updateOne(
        { user: userId, period },
        { $set: { counters: {} } }
      );
    }
    return { success: true, reset: true, period };
  }
}

module.exports = new UsageService();
