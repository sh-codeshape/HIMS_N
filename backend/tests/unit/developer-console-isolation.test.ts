import { describe, it, expect, vi } from 'vitest';
import { authorize } from '../../src/middleware/authorize';
import { UnauthorizedError } from '../../src/shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';

describe('Developer Console & Super Admin RBAC Isolation', () => {
  const createMockReq = (roles: string[], permissions: string[] = []): Request =>
    ({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        roles,
        permissions,
      },
    } as unknown as Request);

  const mockRes = {} as Response;

  it('allows super_admin to access normal hospital operations (e.g. staff.manage, billing.create)', () => {
    const middleware = authorize(['staff.manage', 'billing.create']);
    const req = createMockReq(['super_admin']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(); // Called with no error
  });

  it('allows admin to access normal hospital operations', () => {
    const middleware = authorize(['patients.view']);
    const req = createMockReq(['admin']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('BLOCKS super_admin from developer-only permissions (developer.modules)', () => {
    const middleware = authorize(['developer.modules']);
    const req = createMockReq(['super_admin']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toContain('Developer access required');
  });

  it('BLOCKS admin from developer-only permissions (developer.config)', () => {
    const middleware = authorize(['developer.config']);
    const req = createMockReq(['admin']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('ALLOWS developer role to access developer-only permissions', () => {
    const middleware = authorize(['developer.modules']);
    const req = createMockReq(['developer']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('ALLOWS developer role to access any hospital permissions', () => {
    const middleware = authorize(['billing.manage', 'bed.manage']);
    const req = createMockReq(['developer']);
    const next: NextFunction = vi.fn();

    middleware(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });
});
