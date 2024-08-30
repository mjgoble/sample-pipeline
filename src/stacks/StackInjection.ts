import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackInjectionStackProps } from '../config/config';


interface InjectedStackProps extends cdk.StackProps {
  bucketName: string;
}

class InjectedStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InjectedStackProps) {
    super(scope, id, props);

    new cdk.CfnOutput(this, 'pretendBucket', { value: props.bucketName });

  }
}


export class StackInjectionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackInjectionStackProps) {
    super(scope, id, props);

    // your resources go here!
    console.log('');
    console.log(`Stack: ${props.stackName}`);
    console.log('additionalParameters:');
    console.log(props.additionalParameters);

    const myStage = cdk.Stage.of(this);
    const thisStack = cdk.Stack.of(this);

    if (!myStage) {
      throw new Error('Cannot find stage!');
    }

    const stackKey = `${myStage?.stageName}${props.additionalParameters.injectedStackProps.stackName}`;
    const newStack = new InjectedStack(myStage, stackKey, {
      env: props.additionalParameters.injectedStackProps.environment,
      bucketName: props.additionalParameters.injectedStackProps.bucketName,
    });

    thisStack.addDependency(newStack);

  }
}
