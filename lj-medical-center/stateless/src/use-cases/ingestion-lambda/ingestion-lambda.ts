import { ingestionProcess } from '@adapters/secondary/ingestion-process';
import { logger } from '@shared/logger';

export async function ingestionLambdaUseCase(): Promise<string> {
  logger.info('starting ingestion');

  return await ingestionProcess();
}
