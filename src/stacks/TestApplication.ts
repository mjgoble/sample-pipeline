import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { z } from 'zod';
import { StackParameters } from '../config/PipelineConfigLoader';
import { StackConfigLoader } from '../config/StackConfigLoader';


/**
 *
 * Your stack parameter models start here!
 *
 * all zod objects that can be used (spoiler, there's heaps):
 * https://zod.dev/?id=table-of-contents
 *
 */
const ThisThingModel = z.object({
  hello: z.string(),
  world: z.string(),
});

const MyConfigModel = z.object({
  foo: z.string(),
  whiz: z.string().optional(),
  thisThing: ThisThingModel,
  // myList: z.string().array(),
  // exactlyThreeThings: z.string().array().length(3),
  // removalPolicy: z.nativeEnum(cdk.RemovalPolicy)
});

type MyConfig = z.infer<typeof MyConfigModel>;

/**
 *
 * Your stack code starts here!
 *
 */
export class MyApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props);

    const stackParameters: MyConfig = StackConfigLoader.parseConfig(
      MyConfigModel, props.stackParameters,
    );

    new cdk.CfnOutput(this, 'output', { value: stackParameters.foo });

  }
}
