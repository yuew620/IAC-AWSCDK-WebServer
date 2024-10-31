# Welcome to your CDK TypeScript project

This is a IAC project for CDK development with TypeScript.

This iac project is for building test staging environment automatically. When the test start, we build the environment using cdk . After the test , we destroy the environment using cdk. We build this project for cost optimization.

In reality, the whole environment is  including ec2, alb, rds, s3 , cloudfront  and IOT core etc. The resources is divided in three catergories . 
1 resouces are charged when they are build , such as ec2,alb,rds. We build resource using iac code. 
2 resource are charged with on demand request, such as cloudfront. It is free after we build the cloudfront without using it.So we build them manually once.
3 resource are very cheap or totally free, such as s3, VPC, subnet, security group ,acm certificate. We build them once manully.

So this project only build ec2, alb,rds automatically with iac code . For all the other resource , we build them manually and config their info in the IAC code.

## How to use

modify the  ./bin/iac-awscdk-web_server.ts   , input all the value according the real environment.

install CDK 

npm run build 

npm synth

npm deploy 

npm destroy 

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
