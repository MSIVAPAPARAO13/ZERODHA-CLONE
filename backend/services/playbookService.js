const { PlaybookModel } = require('../models/PlaybookModel');
const { TradeJournalModel } = require('../models/TradeJournalModel');

const MAX_ACTIVE_PLAYBOOKS = 10;
const MAX_RULES_PER_PLAYBOOK = 20;

class PlaybookService {
  async getPlaybooks(userId) {
    return await PlaybookModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  async getPlaybookStats(userId) {
    const playbooks = await this.getPlaybooks(userId);
    const stats = [];
    
    for (const pb of playbooks) {
      const journals = await TradeJournalModel.find({ user: userId, playbook: pb._id }).lean();
      let tradesFollowed = 0;
      let totalRulesChecked = 0;
      let totalRulesFollowed = 0;

      journals.forEach(j => {
        if (j.checklist && j.checklist.length > 0) {
          const allFollowed = j.checklist.every(c => c.followed);
          if (allFollowed) tradesFollowed++;
          
          j.checklist.forEach(c => {
             totalRulesChecked++;
             if (c.followed) totalRulesFollowed++;
          });
        }
      });

      stats.push({
        id: pb._id,
        name: pb.name,
        rulesCount: pb.rules.length,
        tradesCount: journals.length,
        complianceRate: totalRulesChecked > 0 ? ((totalRulesFollowed / totalRulesChecked) * 100).toFixed(1) : 0
      });
    }
    return stats;
  }

  async getPlaybook(id, userId) {
    return await PlaybookModel.findOne({ _id: id, user: userId });
  }

  async createPlaybook(userId, data) {
    const count = await PlaybookModel.countDocuments({ user: userId, isActive: true });
    if (count >= MAX_ACTIVE_PLAYBOOKS) {
      throw new Error(`Maximum limit of ${MAX_ACTIVE_PLAYBOOKS} active playbooks reached.`);
    }

    const playbook = new PlaybookModel({
      user: userId,
      name: data.name,
      description: data.description,
      strategy: data.strategy,
      rules: this._validateRules(data.rules || [])
    });

    return await playbook.save();
  }

  async updatePlaybook(id, userId, data) {
    const playbook = await PlaybookModel.findOne({ _id: id, user: userId });
    if (!playbook) throw new Error('Playbook not found');

    if (data.name) playbook.name = data.name;
    if (data.description !== undefined) playbook.description = data.description;
    if (data.strategy) playbook.strategy = data.strategy;
    if (data.isActive !== undefined) playbook.isActive = data.isActive;
    
    if (data.rules) {
      playbook.rules = this._validateRules(data.rules);
    }

    return await playbook.save();
  }

  async deletePlaybook(id, userId) {
    const playbook = await PlaybookModel.findOneAndDelete({ _id: id, user: userId });
    if (!playbook) throw new Error('Playbook not found');
    return true;
  }

  _validateRules(rules) {
    if (rules.length > MAX_RULES_PER_PLAYBOOK) {
      throw new Error(`Maximum limit of ${MAX_RULES_PER_PLAYBOOK} rules per playbook exceeded.`);
    }

    const uniqueRules = new Map();
    const validated = [];

    rules.forEach(r => {
      if (!r.text) return;
      const normalized = r.text.trim().toLowerCase();
      if (!uniqueRules.has(normalized)) {
        uniqueRules.set(normalized, true);
        validated.push({
          text: r.text.trim(),
          category: r.category || 'PLANNING',
          required: r.required !== undefined ? r.required : true,
          sortOrder: r.sortOrder || 0
        });
      }
    });

    return validated.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

module.exports = new PlaybookService();
