import OpenAI from 'openai';

// Instantiate lazy to avoid build errors if env var is missing
const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
});

export const analyzeProjectRisk = async (data: {
  attendanceTrend: string;
  materialStatus: string;
  budgetStatus: string;
  progressPercent: number;
}) => {
  const prompt = `
    Analyze the following construction project data and provide a risk assessment:
    - Attendance Trend: ${data.attendanceTrend}
    - Material Availability: ${data.materialStatus}
    - Budget Performance: ${data.budgetStatus}
    - Progress Score: ${data.progressPercent}%

    Requirements:
    1. Generate a Risk Score (0-100).
    2. Classify: Safe, Moderate, or High Risk.
    3. Provide human-readable insights (2-3 sentences) on potential delays or issues.
    
    Return the response as JSON in the format: { "score": number, "classification": string, "insight": string }
  `;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    
    // Deterministic Fallback Logic (used if API key is invalid/unfunded)
    let score = 85; 
    let classification = 'Safe';
    let insight = 'Project is proceeding according to timeline specifications. Resource allocation is optimal.';

    if (data.attendanceTrend.includes('low') || data.attendanceTrend.includes('absent')) {
      score -= 20;
      classification = 'Moderate';
      insight = 'Labor shortages detected. Recommend adjusting daily targets to compensate for absence trends.';
    }

    if (data.materialStatus.includes('low') || data.materialStatus.includes('Shortage')) {
      score -= 30;
      classification = 'High Risk';
      insight = 'Critical material shortages identified. Immediate procurement action required to prevent structural delays.';
    }

    if (data.progressPercent < 50) {
      score -= 15;
    }

    if (score < 40) classification = 'High Risk';
    else if (score < 75) classification = 'Moderate';

    return {
      score: Math.max(10, score),
      classification,
      insight,
    };
  }
};
