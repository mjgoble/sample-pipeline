import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebSiteStackProps } from '../config/config';


export class WebsiteApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebSiteStackProps) {
    super(scope, id, props);

    // your resources go here!
    console.log('');
    console.log(`Stack: ${props.stackName}`);
    console.log('additionalParameters:');
    console.log(props.additionalParameters);
  }
}
