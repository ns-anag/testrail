export enum Role {
  User = 'user',
  Model = 'model',
  System = 'system',
}

export interface Message {
  role: Role;
  text: string;
}

export interface TestRailSettings {
  url: string;
  email: string;
  apiKey: string;
}
