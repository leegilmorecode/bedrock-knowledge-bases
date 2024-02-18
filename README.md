# Amazon Bedrock knowledge Bases

Using TypeScript and the AWS CDK, you can integrate Knowledge Bases into Amazon Bedrock to provide foundation models with contextual data from your private sources

**NOTE: Deploying this solution is not free, and is at least $700 per month**

![image](./docs/images/header.png)

The article can be found here: https://medium.com/@leejamesgilmore/amazon-bedrock-knowledge-bases-with-private-data-7685d04ef396

## Getting started

**NOTE: This is a basic example and is not production ready.**

1. cd into the `lj-medical-center` folder and run `npm run deploy:stateful`
2. once complete, cd into the `lj-medical-center` folder and run `npm run deploy:stateless`

## Removing Stacks

1. cd into the `lj-medical-center` folder and run `npm run remove:stateless`
2. once complete, cd into the `lj-medical-center` folder and run `npm run remove:stateful`
3. In the console perform a sync for the first time.
