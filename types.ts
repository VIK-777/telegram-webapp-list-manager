
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  author: string;
  createdAt: number;
}

export interface List {
  id: string;
  title: string;
  tasks: Task[];
}

export enum AppStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error'
}
