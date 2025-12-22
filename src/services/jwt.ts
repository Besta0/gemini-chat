/**
 * JWT Token 服务
 * 提供 JWT Token 的生成、验证、存储和过期检测功能
 * 需求: 1.1, 1.2, 1.4, 1.6
 */

import { authLogger as logger } from './logger';

// ============ 类型定义 ============

/**
 * JWT Token 载荷接口
 */
export interface JWTPayload {
  /** 签发时间戳（毫秒） */
  iat: number;
  /** 过期时间戳（毫秒） */
  exp: number;
  /** 用户标识（本地应用使用固定值） */
  sub: string;
}

/**
 * JWT Token 头部接口
 */
export interface JWTHeader {
  /** 算法 */
  alg: 'HS256';
  /** 类型 */
  typ: 'JWT';
}

// ============ 配置常量 ============

/**
 * JWT Token 配置
 */
export const JWT_CONFIG = {
  /** Token 有效期（毫秒）- 7 天 */
  EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  /** LocalStorage 存储键名 */
  STORAGE_KEY: 'gemini-chat-jwt-token',
  /** 签名密钥（本地应用使用固定密钥） */
  SECRET: 'gemini-chat-local-secret',
  /** 用户标识（本地应用使用固定值） */
  SUBJECT: 'local-user',
} as const;

// ============ 辅助函数 ============

/**
 * Base64URL 编码
 * 将字符串转换为 Base64URL 格式
 * 
 * @param str - 要编码的字符串
 * @returns Base64URL 编码后的字符串
 */
export function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL 解码
 * 将 Base64URL 格式的字符串解码
 * 
 * @param str - Base64URL 编码的字符串
 * @returns 解码后的字符串
 */
export function base64UrlDecode(str: string): string {
  // 还原 Base64 字符
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补齐 padding
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

/**
 * 简单的 HMAC-SHA256 签名
 * 使用 Web Crypto API 进行签名
 * 
 * @param message - 要签名的消息
 * @param secret - 密钥
 * @returns 签名字符串
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return base64UrlEncode(signatureHex);
}


// ============ 核心函数 ============

/**
 * 生成 JWT Token
 * 创建一个包含签发时间和过期时间的 JWT Token
 * 
 * @returns JWT Token 字符串
 */
export async function generateToken(): Promise<string> {
  const now = Date.now();
  
  const header: JWTHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const payload: JWTPayload = {
    iat: now,
    exp: now + JWT_CONFIG.EXPIRY_MS,
    sub: JWT_CONFIG.SUBJECT,
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerEncoded}.${payloadEncoded}`;
  
  const signature = await hmacSha256(message, JWT_CONFIG.SECRET);
  
  logger.info('JWT Token 已生成');
  return `${message}.${signature}`;
}

/**
 * 验证 JWT Token
 * 解析并验证 Token 的签名和格式
 * 
 * @param token - JWT Token 字符串
 * @returns 解析后的载荷，如果验证失败则返回 null
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('JWT Token 格式无效：部分数量不正确');
      return null;
    }
    
    const headerEncoded = parts[0]!;
    const payloadEncoded = parts[1]!;
    const signatureProvided = parts[2]!;
    
    // 验证签名
    const message = `${headerEncoded}.${payloadEncoded}`;
    const expectedSignature = await hmacSha256(message, JWT_CONFIG.SECRET);
    
    if (signatureProvided !== expectedSignature) {
      logger.warn('JWT Token 签名验证失败');
      return null;
    }
    
    // 解析头部
    const headerJson = base64UrlDecode(headerEncoded);
    const header = JSON.parse(headerJson) as JWTHeader;
    
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      logger.warn('JWT Token 头部无效');
      return null;
    }
    
    // 解析载荷
    const payloadJson = base64UrlDecode(payloadEncoded);
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    // 验证载荷字段
    if (typeof payload.iat !== 'number' || 
        typeof payload.exp !== 'number' || 
        typeof payload.sub !== 'string') {
      logger.warn('JWT Token 载荷字段无效');
      return null;
    }
    
    logger.info('JWT Token 验证成功');
    return payload;
  } catch (error) {
    logger.error('JWT Token 验证过程发生错误', error);
    return null;
  }
}

/**
 * 检查 Token 是否过期
 * 
 * @param payload - JWT 载荷
 * @returns 如果 Token 已过期返回 true，否则返回 false
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  const now = Date.now();
  return now >= payload.exp;
}

// ============ 存储函数 ============

/**
 * 存储 Token 到 LocalStorage
 * 
 * @param token - JWT Token 字符串
 */
export function saveToken(token: string): void {
  try {
    localStorage.setItem(JWT_CONFIG.STORAGE_KEY, token);
    logger.info('JWT Token 已存储到 LocalStorage');
  } catch (error) {
    logger.error('存储 JWT Token 失败', error);
    throw new Error('无法存储 JWT Token');
  }
}

/**
 * 从 LocalStorage 获取 Token
 * 
 * @returns JWT Token 字符串，如果不存在则返回 null
 */
export function getToken(): string | null {
  try {
    return localStorage.getItem(JWT_CONFIG.STORAGE_KEY);
  } catch (error) {
    logger.error('读取 JWT Token 失败', error);
    return null;
  }
}

/**
 * 清除 LocalStorage 中的 Token
 */
export function clearToken(): void {
  try {
    localStorage.removeItem(JWT_CONFIG.STORAGE_KEY);
    logger.info('JWT Token 已从 LocalStorage 清除');
  } catch (error) {
    logger.error('清除 JWT Token 失败', error);
  }
}
