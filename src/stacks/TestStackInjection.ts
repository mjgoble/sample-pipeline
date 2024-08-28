import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { z } from 'zod';
import { StackParameters } from '../config/PipelineConfigLoader';
import { StackConfigLoader } from '../config/StackConfigLoader';
import { AccountAliasLookup } from '../helpers/AccountMappings';


/**
 *
 * Your stack parameter models start here!
 *
 * all zod objects that can be used (spoiler, there's heaps):
 * https://zod.dev/?id=table-of-contents
 *
 */
const EnvironmentModel = z.object({
  account: z.coerce.string(),
  region: z.string(),
});

const InjectedStackParamsModel = z.object({
  stackName: z.string(),
  environment: EnvironmentModel,
});

const MyConfigModel = z.object({
  foo: z.string(),
  whiz: z.string(),
  injectedStackParams: InjectedStackParamsModel,
});

type MyConfig = z.infer<typeof MyConfigModel>;

/**
 *
 * Your stack code starts here!
 *
 */
export class InjectionTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackParameters) {
    super(scope, id, props);

    const stackParameters: MyConfig = StackConfigLoader.parseConfig(
      MyConfigModel, props.stackParameters,
    );

    const myStage = cdk.Stage.of(this);
    const thisStack = cdk.Stack.of(this);

    const injectedStackAccountId = new AccountAliasLookup().findAccountId(
      stackParameters.injectedStackParams.environment.account,
    );
    const newStack = new cdk.Stack(myStage, stackParameters.injectedStackParams.stackName, {
      env: {
        account: injectedStackAccountId,
        region: stackParameters.injectedStackParams.environment.region,
      },
    });

    thisStack.addDependency(newStack);

  }
}
