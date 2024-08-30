import { App } from 'aws-cdk-lib';
import { myProjectConfig } from './config/config';
import { PipelineStack } from './stacks/Pipeline';

const app = new App();

new PipelineStack(app, myProjectConfig.projectName, myProjectConfig);

app.synth();
