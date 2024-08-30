import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DnsSupportStackProps } from '../config/config';


export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DnsSupportStackProps) {
    super(scope, id, props);

    // your resources go here!
    console.log('');
    console.log(`Stack: ${props.stackName}`);
    console.log('additionalParameters:');
    console.log(props.additionalParameters);
  }
}
