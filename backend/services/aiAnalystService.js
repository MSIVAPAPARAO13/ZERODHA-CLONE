const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure this uses environment variables safely
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

class AIAnalystService {
  async generateAnalysis(contextPayload) {
    if (!genAI) {
      throw new Error('AI_UNAVAILABLE');
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    let prompt = "";
    if (contextPayload.type === 'TRADE_REVIEW') {
      prompt = this._buildTradeReviewPrompt(contextPayload);
    } else if (contextPayload.type === 'PORTFOLIO_REVIEW') {
      prompt = this._buildPortfolioReviewPrompt(contextPayload);
    } else if (contextPayload.type === 'PATTERN_REVIEW') {
      prompt = this._buildPatternReviewPrompt(contextPayload);
    } else if (contextPayload.type === 'DAILY_DEBRIEF') {
      prompt = this._buildDailyDebriefPrompt(contextPayload);
    } else if (contextPayload.type === 'BEHAVIOR_REVIEW') {
      prompt = this._buildBehaviorReviewPrompt(contextPayload);
    } else if (contextPayload.type === 'PLAYBOOK_SUGGESTION') {
      prompt = this._buildPlaybookSuggestionPrompt(contextPayload);
    } else if (contextPayload.type === 'PLAYBOOK_REVIEW') {
      prompt = this._buildPlaybookReviewPrompt(contextPayload);
    } else {
      throw new Error('Invalid AI context type');
    }

    const systemInstruction = `You are TradeFlow Analyst, an educational AI. 
Analyze only the structured TradeFlow data supplied to you. 
Do not invent missing facts. Do not provide personalized investment recommendations. 
Distinguish facts from interpretations. If the data does not support a conclusion, explicitly say so.
Return valid JSON matching the requested schema.`;

    const fullPrompt = `${systemInstruction}\n\nDATA:\n${JSON.stringify(contextPayload)}\n\nPROMPT:\n${prompt}`;

    try {
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      return JSON.parse(text); // Strict parsing ensures it's JSON
    } catch (err) {
      console.error('Gemini Generation Error:', err.message);
      throw new Error('AI_INVALID_RESPONSE');
    }
  }

  _buildTradeReviewPrompt() {
    return `Analyze the trade decision against its outcome.
Return JSON strictly in this format:
{
  "summary": "String",
  "decisionContext": "String",
  "whatWentAsPlanned": ["String"],
  "whatDidNotGoAsPlanned": ["String"],
  "evidence": ["String"],
  "learningPoints": ["String"],
  "questionsForReflection": ["String"]
}`;
  }

  _buildPortfolioReviewPrompt() {
    return `Analyze the current portfolio state.
Return JSON strictly in this format:
{
  "summary": "String",
  "portfolioFacts": ["String"],
  "concentrationObservations": ["String"],
  "recentChanges": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }

  _buildPatternReviewPrompt() {
    return `Analyze the user's trading patterns based on their recent journal entries.
Return JSON strictly in this format:
{
  "summary": "String",
  "observedPatterns": ["String"],
  "journalCompleteness": "String",
  "learningPoints": ["String"]
}`;
  }

  _buildDailyDebriefPrompt() {
    return `Summarize what happened today based on the provided transactions and journals.
Return JSON strictly in this format:
{
  "summary": "String",
  "activityCount": "String",
  "notableObservations": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }

  _buildBehaviorReviewPrompt() {
    return `Analyze the user's trading patterns based solely on the provided deterministic analytics data.
The numerical evidence supplied by the application is authoritative. Do not recalculate, alter, infer, or invent numerical values.
Identify observed patterns (behavioral edges or leaks).
Return JSON strictly in this format:
{
  "summary": "String",
  "observedPatterns": [
    {
      "type": "String",
      "title": "String",
      "description": "String",
      "evidence": ["String"],
      "reflectionQuestion": "String"
    }
  ]
}`;
  }

  _buildPlaybookSuggestionPrompt(context) {
    return `Based on the following behavioral pattern observed in the user's trading:
Pattern: ${context.pattern}
Description: ${context.desc}

Suggest a clear, concise process rule for their trading playbook to address this pattern.
The rule should be an actionable directive, not investment advice.
Return JSON strictly in this format:
{
  "title": "String",
  "ruleText": "String",
  "category": "String (one of PLANNING, RISK, ENTRY, EXIT, JOURNAL)"
}`;
  }

  _buildPlaybookReviewPrompt(context) {
    return `Review the following Playbook compliance stats for the user:
${JSON.stringify(context.playbookStats)}

Provide an observational summary of their rule discipline without judging them or inventing statistics.
Return JSON strictly in this format:
{
  "summary": "String",
  "consistentRules": ["String"],
  "frequentlyMissedRules": ["String"],
  "observations": ["String"],
  "reflectionQuestions": ["String"]
}`;
  }
}

module.exports = new AIAnalystService();
