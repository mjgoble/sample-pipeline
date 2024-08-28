import * as fs from 'fs';
import { OrganizationsClient, ListAccountsCommand, ListAccountsCommandOutput } from '@aws-sdk/client-organizations';

const organizationsClient = new OrganizationsClient({});

async function getAccountIdToAliasMapping(): Promise<Record<string, string>> {
  const accountIdToAlias: Record<string, string> = {};

  let nextToken: string | undefined;

  do {
    const listAccountsCommand: ListAccountsCommand = new ListAccountsCommand({
      NextToken: nextToken,
    });

    const response: ListAccountsCommandOutput = await organizationsClient.send(listAccountsCommand);
    nextToken = response.NextToken;

    response.Accounts?.forEach((account) => {
      if (account.Id) {
        accountIdToAlias[account.Id] = account.Name || 'NoAlias';
      }
    });
  } while (nextToken);

  return accountIdToAlias;
}

async function main() {
  try {
    const accountIdToAliasMapping = await getAccountIdToAliasMapping();
    const dataJson = JSON.stringify(accountIdToAliasMapping, null, 2);

    // Write the mapping to data.json
    fs.writeFileSync('data.json', dataJson);

    console.log('Mapping of Account IDs to Account Aliases has been written to data.json');
  } catch (error) {
    console.error('Error fetching account mapping:', error);
  }
}

void main();
