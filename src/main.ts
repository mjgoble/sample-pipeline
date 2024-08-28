import { App } from 'aws-cdk-lib';
import { PipelineConfigLoader } from './config/PipelineConfigLoader';
import { PipelineStack } from './stacks/Pipeline';

const app = new App();

const pipelineConfig = PipelineConfigLoader.loadConfig();

new PipelineStack(app, pipelineConfig.projectName, {
  env: pipelineConfig.environment,
  pipelineConfig: pipelineConfig,
});


app.synth();
