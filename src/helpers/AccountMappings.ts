import * as fs from 'fs';

export class AccountAliasLookup {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? 'data.json';
  }

  findAccountName(accountId: string): string {
    const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    if (data[accountId]) {
      return data[accountId];
    }
    throw new Error(`Account ID ${accountId} not found`);
  }

  findAccountId(alias: string): string {
    const fileContents = fs.readFileSync(this.filePath, 'utf8');
    const data = JSON.parse(fileContents);

    for (const accountId in data) {
      if (data[accountId] === alias) {
        return accountId;
      }
    }
    throw new Error(`Alias ${alias} not found`);
  }

}
