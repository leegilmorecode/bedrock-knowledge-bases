import { queryModel } from '@adapters/secondary/query-model';
import { logger } from '@shared/logger';

export async function queryModelUseCase(query: string): Promise<string> {
  logger.info(`Query: ${query}`);

  return await queryModel(query);
}
