import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
  RetrieveAndGenerateCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime';

import { config } from '@config';

const client = new BedrockAgentRuntimeClient();
const knowledgeBaseId = config.get('knowledgeBaseId');

export async function queryModel(prompt: string): Promise<string> {
  const input: RetrieveAndGenerateCommandInput = {
    input: {
      text: prompt,
    },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: knowledgeBaseId,
        // we are using Anthropic Claude v2 in us-east-1 in this example
        modelArn: `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2`,
      },
    },
  };
  const command: RetrieveAndGenerateCommand = new RetrieveAndGenerateCommand(
    input
  );
  const response: RetrieveAndGenerateCommandOutput = await client.send(command);
  return response.output?.text as string;
}
