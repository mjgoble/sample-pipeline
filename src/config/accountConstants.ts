// NOTE: This is a shit way of storing accounts.
// use src/helpers/update-account-mappings.ts to generate a mapping of
// accountId->accountName and use class from src/helpers/AccountMapping.ts
// to do lookups within your stack code.


// i'm only putting these here so it's a little more obvious which parts need to be changed

export const AWS_PRIMARY_REGION = 'ap-southeast-2';
export const AWS_PIPELINE_ACCOUNT = '123456789012'; // where your pipeline stack will be
export const AWS_WORKLOAD_TEST_ACCOUNT = '123456789012'; // where your dev workloads are
export const AWS_WORKLOAD_PROD_ACCOUNT = '123456789012'; // where your prod workloads are
export const AWS_BUCKET_ACCOUNT = '123456789012'; // i guess where your buckets are


export const GITHUB_REPO_OWNER = 'yourgithubname';
export const GITHUB_REPO_NAME = 'sample-pipeline';
export const GITHUB_REPO_BRANCH = 'main';