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
    return {
      score: 50,
      classification: 'Error',
      insight: 'Could not generate AI insights at this time.',
    };
  }
};
