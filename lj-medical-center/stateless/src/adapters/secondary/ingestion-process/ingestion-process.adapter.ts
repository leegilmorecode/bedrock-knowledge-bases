import {
  BedrockAgentClient,
  StartIngestionJobCommand,
  StartIngestionJobCommandInput,
  StartIngestionJobCommandOutput,
} from '@aws-sdk/client-bedrock-agent';

import { config } from '@config';
import { logger } from '@shared/logger';
import { v4 as uuid } from 'uuid';

const client = new BedrockAgentClient();
const knowledgeBaseId = config.get('knowledgeBaseId');
const dataSourceId = config.get('dataSourceId');

export async function ingestionProcess(): Promise<string> {
  const input: StartIngestionJobCommandInput = {
    knowledgeBaseId: knowledgeBaseId,
    dataSourceId: dataSourceId,
    clientToken: uuid(),
  };
  const command: StartIngestionJobCommand = new StartIngestionJobCommand(input);

  const response: StartIngestionJobCommandOutput = await client.send(command);
  logger.info(`response: ${response}`);

  return JSON.stringify({
    ingestionJob: response.ingestionJob,
  });
}
