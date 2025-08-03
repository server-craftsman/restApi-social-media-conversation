import { User } from '../entities/user.entity';

export interface IUser {
    id: string;
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    website?: string;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isActive: boolean;
    hash?: string;
    hashExpires?: Date;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateUser {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    website?: string;
    role?: UserRole;
}

export interface IUpdateUser {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    location?: string;
    website?: string;
    role?: UserRole;
    isVerified?: boolean;
    hash?: string;
    hashExpires?: Date;
}

export interface IUserStatus {
    id: string;
    status: UserStatus;
    lastSeen?: Date;
}

export enum UserStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY',
    BUSY = 'BUSY',
}

export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUserRepository {
    create(data: ICreateUser): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
    findByVerificationHash(hash: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: string, data: IUpdateUser): Promise<User>;
    updateStatus(id: string, status: IUserStatus): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    delete(id: string): Promise<void>;
    exists(email: string): Promise<boolean>;
    existsUsername(username: string): Promise<boolean>;
} 