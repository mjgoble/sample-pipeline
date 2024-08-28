import * as path from 'path';
import { Stack, StackProps, Stage, Tags } from 'aws-cdk-lib';
import { IAction, IStage, CfnPipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodePipeline, CodePipelineSource, ShellStep, StackSteps, ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import {
  PipelineProjectConfig,
  PipelineProjectStackConfig,
  PipelineProjectStageConfig,
} from '../config/PipelineConfigLoader';

interface PipelineStackProps extends StackProps {
  pipelineConfig: PipelineProjectConfig;
}

/**
 *
 * The main pipeline stack
 *
 */
export class PipelineStack extends Stack {
  private projectName: string = '';

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    this.projectName = props.pipelineConfig.projectName;
    const synthStep = new ShellStep('Synth', {
      input: CodePipelineSource.gitHub(
        `${props.pipelineConfig.projectSource.repoOwner}/${props.pipelineConfig.projectSource.repoName}`,
        props.pipelineConfig.projectSource.repoBranch,
      ),
      commands: ['npm ci', 'npm run build', 'npx cdk synth'],
    });

    const pipeline = new CodePipeline(this, props.pipelineConfig.projectName, {
      crossAccountKeys: true,
      dockerEnabledForSynth: true,
      synth: synthStep,
    });

    // build the stages
    for (const stage of props.pipelineConfig.stages) {
      this.generateStage(pipeline, stage);
    }

    // build the pipeline
    pipeline.buildPipeline();

    // tag pipeline
    if (props.pipelineConfig.tags) {
      for (const [key, value] of Object.entries(props.pipelineConfig.tags)) {
        Tags.of(pipeline.pipeline.node.defaultChild as CfnPipeline).add(key, value);
      }
    }

    // ensure the stacks with manual approvals have their prepare step
    // on the same runOrder as the manual approval
    this.fixStepOrder(pipeline);

  }

  /**
   *
   * Generates stage in a pipeline
   * and adds all the stacksteps to
   * the stage
   *
   */
  private generateStage(pipeline: CodePipeline, props: PipelineProjectStageConfig) {
    const wave = pipeline.addWave(`${props.stageName}Wave`);

    const stage = new Stage(this, props.stageName);

    // this is where we build stacks based on what's in props
    // for now, a placeholder to generate some stacks
    wave.addStage(stage, { stackSteps: this.generateStacks(stage, props.stacks) });
  }

  /**
   *
   * Generates stacks for the stage
   *
   * returns a list of StackSteps that
   * will be added to the stage
   *
   * this also includes the manual approval steps
   *
   */
  private generateStacks(stage: Stage, stacks: PipelineProjectStackConfig[]): StackSteps[] {
    let stackSteps: StackSteps[] = [];
    for (const stackConfig of stacks) {
      // build a stack using external implementation
      let stack = new DynamicStack(
        stage,
        stackConfig.stackName,
        stackConfig.implementation,
        {
          env: stackConfig.environment,
          stackName: `${this.projectName}-${stage.stageName}-${stackConfig.stackName}`,
          stackParameters: stackConfig.stackParameters,
        },
      );

      stackSteps.push({
        stack: stack.stack,
        pre: stackConfig.manualApproval ? [new ManualApprovalStep('ManualApproval')] : undefined,
      });
    }
    return stackSteps;
  }

  /**
   *
   * Finds all actions in a stage that start
   * with a given prefix.
   *
   * This is useful for finding which stacks
   * belong to a particular manual approval.
   *
   */
  private getActionsWithPrefix(prefix: string, stage: IStage): IAction[] {
    return stage.actions.filter((action) => action.actionProperties.actionName.startsWith(prefix));
  }

  /**
   *
   * Updates the runOrder of stack steps (Prepare & Deploy)
   * to be better aligned with the manual approval.
   * by default a manualapproval prestep will be one step before the "Prepare"
   * which is useless when we're wanting to look at changesets
   *
   * This rearrangement brings the Prepare step to happen at the same
   * time as a manual approval, allowing the changeset to be created
   * whilst still on a approval.
   *
   */
  private fixStepOrder(pipeline: CodePipeline) {
    const cfnPipeline = pipeline.pipeline.node.defaultChild as CfnPipeline;
    const pipelineStages: IStage[] = pipeline.pipeline.stages;

    pipelineStages.forEach((stage, stageIndex) => {
      const allActions: IAction[] = stage.actions;
      allActions.forEach((action, actionIndex) => {
        if (action.actionProperties.category === 'Approval') {
          // actionNames will start with a prefix if there is > 1 stacks in stage
          // e.g. ProdApp.ManualApproval, ProdApp.Prepare or ProdApp.Deploy
          // if there is only 1 stack in the stage, it won't have this prefix
          // e.g new actionName will be just ManualApproval, Prepare or Deploy

          // figure out the prefix by splitting the actionName by '.'
          // if there's no '.' the prefix will be nothing, i.e. only 1 stack in
          // stage
          const parts: string[] = action.actionProperties.actionName.split('.');
          const targetStepNamePrefix: string = parts.length === 1 ? '' : parts[0];

          // now we know the prefix, we can find all actions that have that prefix
          // these will be the actions we need to modify the runOrder of
          const actionsToModifyRunOrder: IAction[] = this.getActionsWithPrefix(targetStepNamePrefix, stage);

          for (const actionToModify of actionsToModifyRunOrder) {
            // don't modify if the action is a manual approval step
            if (actionToModify.actionProperties.category === 'Approval') {
              continue;
            }

            // get the current runOrder
            const actionCurrentRunOrder = actionToModify.actionProperties.runOrder as number;

            // console.log(
            //   `Modifying action: ${actionToModify.actionProperties.actionName}`,
            //   `with new runOrder ${actionCurrentRunOrder - 1}`,
            // );

            // use the stageIndex, actionIndex to target the action and drop the actions'
            // runOrder by 1.
            cfnPipeline.addPropertyOverride(
              `Stages.${stageIndex}.Actions.${actionIndex}.RunOrder`, actionCurrentRunOrder - 1,
            );
          }
        }
      });
    });
  }

}

export interface DynamicStackProps extends StackProps {
  stackParameters?: { [key: string]: any };
}

export class DynamicStack {
  public readonly stack: Stack;

  constructor(scope: Construct, id: string, implementationPath: string, props: DynamicStackProps) {
    this.stack = this.getStackImplementation(
      scope,
      id,
      implementationPath,
      props,
    );
  }

  private getStackImplementation(
    scope: Construct,
    id: string,
    implementationPath: string,
    props?: DynamicStackProps,
  ): Stack {

    const parts = implementationPath.split('.');
    const className = parts.pop()!;
    const filePath = path.resolve(__dirname, `../../src/${parts.join('/')}`);

    // TODO - don't use require() - change to async import
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(filePath);

    const StackClass = module[className];


    return new StackClass(scope, id, props);
  }
}