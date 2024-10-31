#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IacAwscdkWebServerStack } from '../lib/iac-awscdk-web_server-stack';

import 'source-map-support/register';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

const app = new cdk.App();
new IacAwscdkWebServerStack(app, 'IacAwscdkWebServerStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1'  // 指定你想要的区域
  },

  //网络相关配置
  vpcId: 'vpc-06xxxxxxxxxec',
  albSecurityGroupId: 'sg-00xxxxxxxx78',
  ec2SecurityGroupId: 'sg-0bxxxxxxxx6e',
  rdsSecurityGroupId: 'sg-03xxxxxxxx0e',
  publicSubnetId: 'subnet-0axxxxxxxx3e',
  privateSubnetId: 'subnet-00xxxxxxxxde',
  subnetAvailabilityZone: 'us-east-1a',

  //EC2配置
  amiId1: 'ami-0axxxxxxxxf1',
  amiId2: 'ami-0axxxxxxxxf1',
  amiId3: 'ami-0axxxxxxxxf1',
  instanceType1: ec2.InstanceType.of(ec2.InstanceClass.M6I, ec2.InstanceSize.LARGE),
  instanceType2: ec2.InstanceType.of(ec2.InstanceClass.M6I, ec2.InstanceSize.LARGE),
  instanceType3: ec2.InstanceType.of(ec2.InstanceClass.M6I, ec2.InstanceSize.LARGE),
  volumeSize1: 100,
  volumeSize2: 200,
  volumeSize3: 300,
  keyName: 'kpxxxxxxxxia',  

  //alb相关配置
  domainName: 'www.mydomain.com',
  certificateArn: 'arn:aws:acm:us-east-1:06xxxxxxxx39:certificate/02xxxxxxxx47',
  ec2TargetPort: 8080, 


  // RDS 数据库配置
  database: {
    engine: 'mysql',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6GD, ec2.InstanceSize.LARGE),
    volumeSize: 20, // GB
    backupArn: 'arn:aws:rds:us-east-1:06xxxxxxxx39:snapshot:database-xx-snapshot',
    name: 'mydatabase', //database indentifier name
    port: 3306,
    multiAz: false, // 单可用区
    storageType: 'gp3',
  },
});