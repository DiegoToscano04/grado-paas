export type Role = 'STUDENT' | 'ADMIN';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    code: string;
}