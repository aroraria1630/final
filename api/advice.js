import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { crop, moisture } = req.body;

  if (!crop) {
    return res.status(400).json({ error: 'Crop is required' });
  }

  try {
    const filePath = path.join(process.cwd(), 'api', 'cropData.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const crops = JSON.parse(data);

    const cropInfo = crops[crop.toLowerCase()];
    if (!cropInfo) {
      return res.status(404).json({ error: 'No data for this crop.' });
    }

    let prompt = `For ${crop}, ideal soil moisture is between ${cropInfo.moisture_min} and ${cropInfo.moisture_max}.`;
    if (moisture !== undefined) {
      prompt += ` Current soil moisture is ${moisture}. What should the farmer do?`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    res.status(200).json({ advice: completion.choices[0].message.content });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
