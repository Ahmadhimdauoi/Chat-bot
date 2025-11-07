export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

export interface Group {
  id: string;
  name: string;
  files: File[];
}
