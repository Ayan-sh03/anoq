import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function GetFormAIPH(product: any) {
  const model = google('gemini-2.5-flash-preview-04-17', {
    useSearchGrounding: true,
  });
  const { text } = await generateText({
    model,
    prompt: `Task: Create a comprehensive feedback form for ${product}, a product hunt app. Analyze the content from their product hunt page and the internet to generate a feedback form that captures user opinions and suggestions.

Output: Return a JSON output in the following format:

{
  "title": "",
  "description": "",
  "questions": [
    {
      "question_text": "",
      "description": ""
    },
    ...
  ],
  "multiplechoicequestions": [
    {
      "question_text": "",
      "description": "",
      "choices": ["", "", ""]
    },
    ...
  ]
}
DO NOT WRAP THE RESPONSE IN CODE BLOCK SYNTAX, just RETURN the document`
  });

  const output = JSON.parse(text);
  console.dir(output, { depth: null, colors: true });

  return output;
}

export async function GetFormAIDescription(description: any) {

  const model = google('gemini-2.5-flash-preview-04-17', {
    useSearchGrounding: true,
  });
  const { text } = await generateText({
    model,
    prompt: `Task: Create a comprehensive feedback form for
    ${description}
    , an app. Analyze the content throughly to generate a detailed feedback form that captures user opinions and suggestions.

Output: Return a JSON output in the following format:

{
  "title": "",
  "description": "",
  "questions": [
    {
      "question_text": "",
      "description": ""
    },
    ...
  ],
  "multiplechoicequestions": [
    {
      "question_text": "",
      "description": "",
      "choices": ["", "", ""]
    },
    ...
  ]
}`
  });

  // Remove the code block syntax from the response
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
  const output = JSON.parse(cleanedText);
  console.dir(output, { depth: null, colors: true });

  return output;
}