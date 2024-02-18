#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { LjMedicalCenterStatefulStack } from '../stateful/stateful';
import { LjMedicalCenterStatelessStack } from '../stateless/stateless';

const app = new cdk.App();
new LjMedicalCenterStatefulStack(app, 'LjMedicalCenterStatefulStack', {
  // we deploy to us-east-1 as eu-west-1 is not available currently for Bedrock
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});

new LjMedicalCenterStatelessStack(app, 'LjMedicalCenterStatelessStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
