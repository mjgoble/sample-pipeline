import { error } from 'console';
import * as fs from 'fs';
import { StackProps, Environment } from 'aws-cdk-lib';
import YAML from 'yaml';
import { z } from 'zod';

export interface StackParameters extends StackProps {
  stackParameters: { [key: string]: any };
}

export type PipelineProjectConfig = z.infer<typeof PipelineProjectConfig>;
export type PipelineProjectStackConfig = z.infer<typeof PipelineProjectStackConfig>;
export type PipelineProjectStageConfig = z.infer<typeof PipelineProjectStageConfig>;
export type PipelineProjectSource = z.infer<typeof PipelineProjectSource>;


/**
 * PipelineConfigLoader
 *
 * Loads in yaml configuration into a PipelineProjectConfig
 * schema and validates the inputs at runtime.
 *
 */
export class PipelineConfigLoader {
  public static loadConfig(fileName?: string): PipelineProjectConfig {
    if (!fileName) { fileName = './src/config/config.yaml'; }

    const fileContents = fs.readFileSync(fileName, 'utf-8');
    const result = PipelineProjectConfig.safeParse(YAML.parse(fileContents));

    if (result.success) {
      return result.data;
    } else {
      throw error(
        '##################################################################\n',
        'Invalid stackParameters format:',
        result.error.issues,
        '##################################################################\n',
      );
    }
  }
}

const PipelineProjectStackConfig = z.object({
  stackName: z.string(),
  implementation: z.string(),
  manualApproval: z.boolean().default(false),
  environment: z.custom<Environment>(),
  stackParameters: z.record(z.string(), z.any()),
});


const PipelineProjectStageConfig = z.object({
  stageName: z.string(),
  stacks: PipelineProjectStackConfig.array(),
});

const PipelineProjectSource = z.object({
  repoOwner: z.string(),
  repoName: z.string(),
  repoBranch: z.string(),
});

const PipelineProjectConfig = z.object({
  projectName: z.string(),
  projectSource: PipelineProjectSource,
  environment: z.custom<Environment>(),
  tags: z.record(z.string(), z.string()).optional(),
  stages: PipelineProjectStageConfig.array(),
});
