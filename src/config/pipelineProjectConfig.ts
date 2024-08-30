import { StackProps, Environment } from 'aws-cdk-lib';

export interface BaseStackProps extends StackProps{
  implementation: string;
  readonly env: Environment; //env is usually optional, make it not
}

export interface PipelineStackProps<TStackImplementation> extends StackProps{
  readonly projectName: string;
  readonly projectSource: PipelineProjectSourceProps;
  readonly env: Environment; //env is usually optional, make it not
  readonly tags?: Record<string, string>;
  stages: PipelineProjectStageProps<TStackImplementation>[];
}

export interface PipelineProjectSourceProps {
  readonly repoOwner: string;
  readonly repoName: string;
  readonly repoBranch: string;
}

export interface PipelineProjectStageProps<TStackImplementation> {
  readonly stageName: string;
  stacks: PipelineProjectStackProps<TStackImplementation>[];
}

export interface PipelineProjectStackProps<TStackImplementation> {
  readonly stackName: string;
  readonly manualApproval?: boolean;
  stackImplementation: TStackImplementation;
}
