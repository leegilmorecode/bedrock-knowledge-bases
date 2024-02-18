import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as path from 'path';

import { Construct } from 'constructs';

export class LjMedicalCenterStatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // import stack values
    const dataSourceId = cdk.Fn.importValue('DataSourceIdOutput');
    const knowledgeBaseArn = cdk.Fn.importValue('KnowledgeBaseArnOutput');
    const knowledgeBaseId = cdk.Fn.importValue('KnowledgeBaseIdOutput');

    // constants
    const serviceName = 'LjMedicalCenterService';
    const metricNamespace = 'LjMedicalCenter';

    // add our lambda config
    const lambdaConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: serviceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: metricNamespace,
    };

    // create the lambda for querying the model
    const queryModelLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'QueryModelLambda', {
        functionName: 'query-model-lambda',
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          './src/adapters/primary/query-model/query-model.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        timeout: cdk.Duration.minutes(3),
        description: 'query model lambda function',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
        },
        environment: {
          KNOWLEDGE_BASE_ARN: knowledgeBaseArn,
          KNOWLEDGE_BASE_ID: knowledgeBaseId,
          ...lambdaConfig,
        },
      });

    // we allow the query lambda function to query our models
    queryModelLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:RetrieveAndGenerate',
          'bedrock:Retrieve',
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      })
    );

    // create the lambda for ingesting data from our bucket
    const ingestionLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'IngestionLambda', {
        functionName: 'ingestion-lambda',
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          './src/adapters/primary/ingestion-lambda/ingestion-lambda.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        timeout: cdk.Duration.minutes(10),
        description: 'ingestion lambda function',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
        },
        environment: {
          DATA_SOURCE_ID: dataSourceId,
          KNOWLEDGE_BASE_ID: knowledgeBaseId,
          ...lambdaConfig,
        },
      });

    // import the bucket from name
    const bucket = s3.Bucket.fromBucketName(
      this,
      'Bucket',
      'lj-medical-center-patient-records'
    );

    // create an s3 event source for objects being added, modified or removed
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(ingestionLambda)
    );
    bucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3n.LambdaDestination(ingestionLambda)
    );

    // ensure that the lambda function can start a data ingestion job
    ingestionLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:StartIngestionJob'],
        resources: [knowledgeBaseArn],
      })
    );

    // create the api for our receptionist app to use
    const api: apigw.RestApi = new apigw.RestApi(this, 'Api', {
      description: 'LJ Medical Center API',
      restApiName: 'lj-medical-center-api',
      deploy: true,
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'prod',
        dataTraceEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
      },
    });

    // create the queries resource for the api
    const queries: apigw.Resource = api.root.addResource('queries');

    // add the endpoint for querying our knowledge base (post) on prod/queries/
    queries.addMethod(
      'POST',
      new apigw.LambdaIntegration(queryModelLambda, {
        proxy: true,
        allowTestInvoke: false,
      })
    );
  }
}
