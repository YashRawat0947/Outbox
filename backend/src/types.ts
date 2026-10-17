export interface Sender {
  id: number;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
}

export interface JobData {
  emailId: string;
  userId: string;
  hourlyLimit: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
