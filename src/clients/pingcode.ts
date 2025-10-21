import axios, { AxiosInstance } from 'axios';

export class PingCodeClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.PINGCODE_BASE_URL || 'https://open.alpha.pingcode.live';
    const token = process.env.PINGCODE_ACCESS_TOKEN || 'f9ae8892-f76a-48de-a07b-424180636c5f';
    
    if (!token) {
      throw new Error('PINGCODE_ACCESS_TOKEN 环境变量未设置');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async searchWorkItems(params: {
    identifier?: string;
    project_ids?: string;
    type_ids?: string;
    state_ids?: string;
    assignee_ids?: string;
  }) {
    const response = await this.client.get('/v1/project/work_items', { params });
    return response.data.values;
  }

  async searchWorkItemStates(params: {
    project_id: string;
    work_item_type_id: string;
  }) {
    const response = await this.client.get('/v1/project/work_item/states', { params });
    return response.data.values;
  }

  async searchWorkItemTypes(params: {
    project_id: string;
  }) {
    const response = await this.client.get('/v1/project/work_item/types', { params });
    return response.data.values;
  }

  async searchProjects(params: {
    identifier?: string;
    type?: string;
  }) {
    const response = await this.client.get('/v1/project/projects', { params });
    return response.data.values;
  }

}

export class PingCodeClientFactory {
  private static _pingcodeClient: PingCodeClient;
  static get pingcodeClient() {
    if (!this._pingcodeClient) {
      this._pingcodeClient = new PingCodeClient(); 
    }
    return this._pingcodeClient;
  }
}