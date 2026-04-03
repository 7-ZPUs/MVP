export interface AppError {
    code: string;      
    message: string;    
    recoverable: boolean;
    details?: any;      
}