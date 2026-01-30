import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeApiError } from 'n8n-workflow'

interface WixSite extends IDataObject {
	id: string
	displayName: string
	name: string
	published: boolean
	premium: boolean
	createdDate: string
	updatedDate: string
	editorType: string
	viewUrl?: string
}

interface WixQueryResponse {
	sites: WixSite[]
	metadata?: {
		count: number
		cursors?: {
			next?: string
		}
	}
}

export class BeforceWix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Beforce',
		name: 'beforceWix',
		icon: 'file:beforce.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Manage and retrieve Wix site data through the Beforce platform',
		usableAsTool: true,
		defaults: { name: 'Beforce Wix' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'beforceWixApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'site',
				options: [{
					name: 'Site',
					value: 'site',
				}]
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'query',
				options: [
					{
						name: 'Query Sites',
						value: 'query',
						action: 'Query sites a site',
						description: 'Retrieve sites from Wix',
					},
					{
						name: 'Count Sites',
						value: 'count',
						action: 'Count sites a site',
						description: 'Return total number of sites',
					},
				],
				displayOptions: {
					show: {
						resource: ['site'],
					},
				},
			},
		]
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		try {
			const credentials = await this.getCredentials('beforceWixApi')
			
			const resource = this.getNodeParameter('resource', 0) as string
			const operation = this.getNodeParameter('operation', 0) as string

			if (resource !== 'site') throw new NodeApiError(this.getNode(), { message: 'Unsupported resource' })

			const baseHeaders = {
				Authorization: credentials.apiKey as string,
				'wix-account-id': credentials.accountId as string,
				'Content-Type': 'application/json',
				Accept: 'application/json, text/plain, */*',
			}

			if (operation === 'query') {
			const response = (await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://www.wixapis.com/site-list/v2/sites/query',
				headers: baseHeaders,
				body: {
					query: {
						filter: { editorType: 'EDITOR' },
						sort: [{ fieldName: 'createdDate', order: 'ASC' }],
						cursorPaging: { limit: 2 },
					},
				},
				json: true,
			})) as WixQueryResponse

			return [this.helpers.returnJsonArray(response.sites)]
		}

		if (operation === 'count') {
			const response = (await this.helpers.httpRequest({
				method: 'POST',
				url: 'https://www.wixapis.com/site-list/v2/sites/count',
				headers: baseHeaders,
				body: {
					filter: { editorType: 'EDITOR' },
				},
				json: true,
			})) as { count: number }

			return [[{ json: response }]]
		}

		throw new NodeApiError(this.getNode(), { message: 'Unsupported operation' })
		} catch (error) {
            if (error instanceof NodeApiError) throw error
			throw new NodeApiError(this.getNode(), { message: error instanceof Error ? error.message : 'Unknown error' })
		}
	}
}