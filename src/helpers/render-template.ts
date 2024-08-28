import * as fs from 'fs';
import * as path from 'path';

interface CloudFormationTemplate {
  Resources: {
    [key: string]: {
      Type: string;
      Properties?: {
        Stages?: Stage[];
      };
    };
  };
}

interface Stage {
  Name: string;
  Actions: Action[];
}

interface Action {
  Name: string;
  ActionTypeId: {
    Category: string;
    Owner: string;
    Provider: string;
    Version: string;
  };
  RunOrder: number;
}

const loadTemplate = (filePath: string): CloudFormationTemplate => {
  const template = fs.readFileSync(path.resolve(filePath), 'utf8');
  return JSON.parse(template) as CloudFormationTemplate;
};

const renderPipeline = (template: CloudFormationTemplate) => {
  for (const resourceKey in template.Resources) {
    const resource = template.Resources[resourceKey];
    if (resource.Type === 'AWS::CodePipeline::Pipeline' && resource.Properties?.Stages) {
      console.log(`CodePipeline: ${resourceKey}`);
      resource.Properties.Stages.forEach((stage, stageIndex) => {
        console.log(`  Stage ${stageIndex + 1}: ${stage.Name}`);

        // group actions by RunOrder
        const actionsByRunOrder: { [key: number]: string[] } = {};
        stage.Actions.forEach((action) => {
          if (!actionsByRunOrder[action.RunOrder]) {
            actionsByRunOrder[action.RunOrder] = [];
          }
          actionsByRunOrder[action.RunOrder].push(action.Name);
        });

        // display actions grouped by RunOrder
        for (const runOrder in actionsByRunOrder) {
          console.log(
            `    RunOrder ${runOrder}: ${actionsByRunOrder[runOrder].join(', ')}`,
          );
        }
      });
      console.log('');
    }
  }
};

const templateFilePath = './cdk.out/sample-pipeline.template.json';
const template = loadTemplate(templateFilePath);
renderPipeline(template);
