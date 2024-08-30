import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Ec2InstanceStackProps } from '../config/config';


export class Ec2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Ec2InstanceStackProps) {
    super(scope, id, props);

    // your resources go here!
    console.log('');
    console.log(`Stack: ${props.stackName}`);
    console.log('additionalParameters:');
    console.log(props.additionalParameters);
  }
}
