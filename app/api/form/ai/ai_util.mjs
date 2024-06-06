import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, 
});


export async function GetFormAIPH(product) {
    const stream = await cohere.chat({
      model: "command-r",
      message: `Task: Create a comprehensive feedback form for ${product}, a product hunt app. Analyze the content from their product hunt page and the internet to generate a feedback form that captures user opinions and suggestions.
  
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
    DO NOT WRAP THE RESPONSE IN CODE BLOCK SYNTAX, just RETURN the document 
    `,
      temperature: 0.3,
      promptTruncation: "AUTO",
      connectors: [{ id: "web-search" }],
    });
  
    // console.log(stream);
    let text = stream.text
    text = text.replace("```json","")
    text = text.replace("```","")
  
    const output = JSON.parse(text);
    console.dir(output, { depth: null, colors: true });
  
    return output;
}


export async function GetFormAIDescription(description){
  
  const stream = await cohere.chat({
    model: "command-r-plus",
    message: `Task: Create a comprehensive feedback form for
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
} 
 
  `,
    temperature: 0.3,
    promptTruncation: "AUTO",
  });

  // console.log(stream);
  let text = stream.text
  text = text.replace("```json","")
  text = text.replace("```","")

  const output = JSON.parse(text);
  console.dir(output, { depth: null, colors: true });

  return output;
}