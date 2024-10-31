import 'source-map-support/register';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';


interface IacAwscdkWebServerStackProps extends StackProps {
  env?: cdk.Environment;
  vpcId: string;
  albSecurityGroupId: string;
  ec2SecurityGroupId: string;
  rdsSecurityGroupId: string;
  publicSubnetId: string;
  privateSubnetId: string;
  subnetAvailabilityZone: string;
  amiId1: string;
  amiId2: string;
  amiId3: string;
  instanceType1: ec2.InstanceType;
  instanceType2: ec2.InstanceType;
  instanceType3: ec2.InstanceType;
  volumeSize1: number;
  volumeSize2: number;
  volumeSize3: number;
  keyName: string;
  domainName: string;
  certificateArn: string;
  ec2TargetPort: number;
  database: {
    engine: string;
    instanceType: ec2.InstanceType;
    volumeSize: number;
    backupArn: string;
    name: string;
    port: number;
    multiAz: boolean;
    storageType: string;
  };
}

export class IacAwscdkWebServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IacAwscdkWebServerStackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'IacAwscdkWebServerQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const vpc = this.getExistingVpc(props.vpcId);

    const EC2securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'ImportedSecurityGroup', props.ec2SecurityGroupId,);
  
    // 使用 fromSubnetAttributes 方法导入子网，并提供可用区信息
    const EC2subnet = ec2.Subnet.fromSubnetAttributes(this, 'SpecifiedSubnet', {
      subnetId: props.publicSubnetId,
      availabilityZone: props.subnetAvailabilityZone
    });
    
    const ec2Instance1 = this.createEc2Instance(
      vpc, 
      props.amiId1, 
      props.instanceType1, 
      props.volumeSize1, 
      props.keyName,
      EC2securityGroup,
      EC2subnet,
      "ec2Instance1"
    );

  
    const ec2Instance2 = this.createEc2Instance(
      vpc, 
      props.amiId2, 
      props.instanceType2, 
      props.volumeSize2, 
      props.keyName,
      EC2securityGroup,
      EC2subnet,
      "ec2Instance2"
    );
  
    const ec2Instance3 = this.createEc2Instance(
      vpc, 
      props.amiId3, 
      props.instanceType3, 
      props.volumeSize3, 
      props.keyName,
      EC2securityGroup,
      EC2subnet,
      "ec2Instance3"
    );

    const alb = this.createAlbWithRules(
      vpc,
      [ec2Instance1, ec2Instance2, ec2Instance3],
      props.domainName,
      props.certificateArn,
      props.ec2TargetPort,
      props.albSecurityGroupId,
    );

    const dbInstance = this.createDatabase(vpc,props);

  }

  private getExistingVpc(vpcId: string): ec2.IVpc {
    return ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: vpcId
    });
  }

  private createEc2Instance(
    vpc: ec2.IVpc, 
    amiId: string, 
    instanceType: ec2.InstanceType, 
    volumeSize: number, 
    keyName: string,
    EC2securityGroup:ec2.ISecurityGroup,
    EC2subnet:ec2.ISubnet,
    EC2Name: string
  ): ec2.Instance {

    return new ec2.Instance(this, EC2Name, {
      vpc,
      vpcSubnets: {
        subnets: [EC2subnet]  // 使用指定的子网
      },
      instanceType: instanceType,
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': amiId  // 假设使用 us-east-1 区域，如果不是，请相应调整
      }),
      securityGroup: EC2securityGroup,  // 使用导入的安全组
      keyName: keyName,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(volumeSize)
        }
      ]
    });
  }
  

  private createAlbWithRules(
    vpc: ec2.IVpc,
    ec2Instances: ec2.Instance[],
    domainName: string,
    certificateArn: string,
    ec2TargetPort: number,
    albSecurityGroupId: string
  ): elbv2.ApplicationLoadBalancer {

    const albSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ExistingAlbSecurityGroup',
      albSecurityGroupId,
      {
        mutable: false  // 设置为 false 以防止 CDK 修改此安全组
      }
    );
    // 创建 ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'MyALB', {
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: albSecurityGroup
    });
  
    // 创建 HTTPS 侦听器
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [elbv2.ListenerCertificate.fromArn(certificateArn)],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED
    });
  
    // 创建目标组
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'EC2TargetGroup', {
      vpc,
      port: ec2TargetPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5)
      }
    });
  
    // 将 EC2 实例添加到目标组
    ec2Instances.forEach((instance) => {
      targetGroup.addTarget(new targets.InstanceTarget(instance));
    });
  
    // 添加特定域名和路径的规则
    httpsListener.addAction('DomainRule', {
      conditions: [
        elbv2.ListenerCondition.hostHeaders([domainName]),
        elbv2.ListenerCondition.pathPatterns(['/*'])
      ],
      action: elbv2.ListenerAction.forward([targetGroup]),
      priority: 10
    });
  
    // 添加默认操作到 HTTPS 侦听器（返回 404）
    httpsListener.addAction('Default', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found'
      })
    });
  
    // 添加 HTTP 到 HTTPS 重定向
    alb.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443
    });
  
    return alb;
  }
  
  private createDatabase(vpc: ec2.IVpc, props: IacAwscdkWebServerStackProps): rds.DatabaseInstance {
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this, 
      'RDSSecurityGroup', 
      props.rdsSecurityGroupId,
      { allowAllOutbound: true }
    );
    
    const dbSubnetGroup = new rds.SubnetGroup(this, 'MyDbSubnetGroup', {
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      description: 'Subnet group for my database',
    });
  
    const dbName = props.database.name || 'DefaultDBName';
  
    return new rds.DatabaseInstanceFromSnapshot(this, 'MyDatabaseInstance', {
      instanceIdentifier: dbName,
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_39 }),
      instanceType: props.database.instanceType,
      vpc,
      //vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      multiAz: props.database.multiAz,
      storageType: rds.StorageType.GP3,
      allocatedStorage: props.database.volumeSize,
      port: props.database.port,
      snapshotIdentifier: props.database.backupArn,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      publiclyAccessible: true,  // 建议移除此行，除非你有特殊需求
    });    
  
  
  
  }
  }
}
