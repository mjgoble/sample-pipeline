import * as cdk from 'aws-cdk-lib';
import {
  AWS_PRIMARY_REGION,
  AWS_PIPELINE_ACCOUNT,
  AWS_WORKLOAD_TEST_ACCOUNT,
  AWS_WORKLOAD_PROD_ACCOUNT,
  AWS_BUCKET_ACCOUNT,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_REPO_BRANCH,
} from './accountConstants';
import { BaseStackProps, PipelineStackProps } from './pipelineProjectConfig';


/**
 * An example stack definition
 */
export interface WebSiteStackProps extends BaseStackProps {
  implementation: 'stacks.Website.WebsiteApplicationStack';
  additionalParameters: {
    websiteName: string;
    bucketName: string;
    statusCode: number;
  };
}

/**
 * Another example stack definition
 */
export interface Ec2InstanceStackProps extends BaseStackProps {
  implementation: 'stacks.Ec2Instance.Ec2Stack';
  additionalParameters: {
    instanceName: string;
    securityGroupRules: {
      fromPort: number;
      toPort: number;
      description: string;
      cidrs: string[];
    }[];
    tags: Record<string, string>;

  };
}

/**
 * Another example stack definition
 */
export interface DnsSupportStackProps extends BaseStackProps {
  implementation: 'stacks.DnsSupport.DnsStack';
  additionalParameters: {
    hostedZoneId: string;
    cname: string;
    cnameTarget: string;
  };
}

/**
 * Defines a stack implementation for a cdk stack
 * that is able to inject a stack into another account
 * useful if you want to do cross account lookups
 * using custom resources
 */
export interface StackInjectionStackProps extends BaseStackProps {
  implementation: 'stacks.StackInjection.StackInjectionStack';
  additionalParameters: {
    foobar: string;
    whizbang: number;
    injectedStackProps: {
      stackName: string;
      bucketName: string;
      environment: cdk.Environment;
    };
  };
}

/**
 * StackImplementation is a union of all of the StackProps you have defined
 */
type StackImplementation = WebSiteStackProps | Ec2InstanceStackProps | DnsSupportStackProps | StackInjectionStackProps


/**
 *
 *  Your configuration goes here.
 *
 * This will define how your pipeline is layed out
 * and what stacks go where
 *
 */
export const myProjectConfig: PipelineStackProps<StackImplementation>= {
  projectName: 'sample-pipeline',
  projectSource: {
    repoOwner: GITHUB_REPO_OWNER,
    repoName: GITHUB_REPO_NAME,
    repoBranch: GITHUB_REPO_BRANCH,
  },
  env: {
    account: AWS_PIPELINE_ACCOUNT,
    region: AWS_PRIMARY_REGION,
  },
  stages: [
    {
      stageName: 'devStage',
      stacks: [{
        stackName: 'devWebsite',
        // manualApproval: false
        stackImplementation: {
          implementation: 'stacks.Website.WebsiteApplicationStack',
          env: {
            account: AWS_WORKLOAD_TEST_ACCOUNT,
            region: AWS_PRIMARY_REGION,
          },
          additionalParameters: {
            bucketName: 'mydevbucket',
            websiteName: 'dev.mywebsite.com',
            statusCode: 200,
          },
        },
      },
      {
        stackName: 'devEc2Instance',
        // manualApproval: false
        stackImplementation: {
          implementation: 'stacks.Ec2Instance.Ec2Stack',
          env: {
            account: AWS_WORKLOAD_TEST_ACCOUNT,
            region: AWS_PRIMARY_REGION,
          },
          additionalParameters: {
            instanceName: 'myDevEc2Instance',
            tags: { myTagKey: 'myTagValue' },
            securityGroupRules: [
              {
                fromPort: 1234,
                toPort: 4200,
                description: 'allows some stuff',
                cidrs: ['192.168.1.0/24'],
              },
            ],
          },
        },
      }],
    },
    {
      stageName: 'prodStage',
      stacks: [{
        stackName: 'prodDnsStack',
        // manualApproval: false
        stackImplementation: {
          implementation: 'stacks.DnsSupport.DnsStack',
          env: {
            account: AWS_WORKLOAD_PROD_ACCOUNT,
            region: AWS_PRIMARY_REGION,
          },
          additionalParameters: {
            hostedZoneId: 'XXXXXXXXXXXXXXXXX',
            cname: 'www.mywebsite.com',
            cnameTarget: 'test.mywebsite.com',
          },
        },
      }, {
        stackName: 'BucketStack',
        manualApproval: true,
        stackImplementation: {
          implementation: 'stacks.StackInjection.StackInjectionStack',
          env: {
            account: AWS_WORKLOAD_PROD_ACCOUNT,
            region: AWS_PRIMARY_REGION,
          },
          additionalParameters: {
            foobar: 'hello',
            whizbang: 420,
            injectedStackProps: {
              stackName: 'InjectedBucketStack',
              bucketName: 'myinjectedbucketname',
              environment: {
                account: AWS_BUCKET_ACCOUNT,
                region: AWS_PRIMARY_REGION,
              },
            },
          },
        },
      }],
    },
  ],
};


