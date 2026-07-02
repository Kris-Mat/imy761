import axios, { type AxiosInstance } from 'axios';

export class BaseApi {
  private apiBase: string = import.meta.env.VITE_API_BASE_URL || 'api/';
  private client: AxiosInstance = axios.create();

  async get<T>(
    path: string, 
    options: { 
      queryParams?: Record<string, string>; 
    } = {}
  ): Promise<T> {
    const { queryParams = {}  } = options;
    
    try {
      const response = await this.client.get(`${this.apiBase}/${path}`, {
        params: queryParams
      });
      return response.data as T;
    } catch (error) {
      console.error('GET request failed', error);
      throw new Error('GET request failed:', {
        cause: error
      });
    }
  }

  async post<T>(
    path: string,
    body: unknown,
    options?: {
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const response = await this.client.post(`${this.apiBase}/${path}`, body, {
        headers: options?.headers,
        params: options?.queryParams
      });
      return response.data as T;
    } catch (error) {
      console.error('POST request failed', error);
      throw new Error('POST request failed', {
        cause: error
      });
    }
  }

  async put<T>(
    path: string,
    body: unknown,
    options?: {
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const response = await this.client.put(`${this.apiBase}/${path}`, body, {
        headers: options?.headers,
        params: options?.queryParams
      });
      return response.data as T;
    } catch (error) {
      console.error('PUT request failed', error);
      throw new Error('PUT request failed', {
        cause: error
      });
    }
  }
}
