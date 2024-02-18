import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { errorHandler, logger } from '@shared/index';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { ValidationError } from '@errors/validation-error';
import middy from '@middy/core';
import { queryModelUseCase } from '@use-cases/query-model';

const tracer = new Tracer();
const metrics = new Metrics();

export const queryModelAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');
    const parsedBody = JSON.parse(body);

    // call our use case for querying the knowledge base
    const response = await queryModelUseCase(parsedBody.query);

    logger.info(`Response: ${response}`);

    metrics.addMetric('SuccessfulQueryModel', MetricUnits.Count, 1);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('QueryModelError', MetricUnits.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(queryModelAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
