import { Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow'

export class BeforceWixApi implements ICredentialType {
	name = 'beforceWixApi'
	displayName = 'Beforce Wix Account Credentials API'
	documentationUrl = 'https://dev.wix.com/docs/rest'
	icon: Icon = 'file:beforce.svg'
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Account-level API token with high-level permissions',
		},
		{
			displayName: 'Account ID',
			name: 'accountId',
			type: 'string',
			default: '',
			required: true,
			description: 'ID of the owning Wix account',
		}
	]
	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: 'https://www.wixapis.com/site-list/v2/sites/query',
			headers: {
				Authorization: '={{$credentials.apiKey}}',
				'wix-account-id': '={{$credentials.accountId}}',
				'Content-Type': 'application/json',
			},
			body: { cursorPaging: { limit: 1 } }
		}
	}
}