import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

import { bedrock } from '@cdklabs/generative-ai-cdk-constructs';
import { Construct } from 'constructs';

export class LjMedicalCenterStatefulStack extends cdk.Stack {
  public bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create the bedrock knowledge base
    const kb = new bedrock.KnowledgeBase(this, 'BedrockKnowledgeBase', {
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
      instruction: `Use this knowledge base to answer questions about patient records.`,
    });

    // create the s3 bucket which houses our patient data as a source for bedrock
    this.bucket = new s3.Bucket(this, 'PatientRecordsBucket', {
      bucketName: 'lj-medical-center-patient-records',
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ensure that the data is uploaded as part of the cdk deploy
    new s3deploy.BucketDeployment(this, 'ClientBucketDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../data/'))],
      destinationBucket: this.bucket,
    });

    // set the data source of the s3 bucket for the knowledge base
    const dataSource = new bedrock.S3DataSource(this, 'DataSource', {
      bucket: this.bucket,
      knowledgeBase: kb,
      dataSourceName: 'patients',
      chunkingStrategy: bedrock.ChunkingStrategy.DEFAULT,
      maxTokens: 500,
      overlapPercentage: 20,
    });

    new cdk.CfnOutput(this, 'DataSourceIdOutput', {
      value: dataSource.dataSourceId,
      exportName: 'DataSourceIdOutput',
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseIdOutput', {
      value: kb.knowledgeBaseId,
      exportName: 'KnowledgeBaseIdOutput',
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseArnOutput', {
      value: kb.knowledgeBaseArn,
      exportName: 'KnowledgeBaseArnOutput',
    });
  }
}
