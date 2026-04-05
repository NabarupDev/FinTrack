import { Role } from '../enums/role.enum';

/**
 * Represents the authenticated user attached to `req.user` by the JWT strategy.
 * Declared as a class (not interface) so it can be referenced in decorated
 * parameter positions without breaking `isolatedModules + emitDecoratorMetadata`.
 */
export class AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: string;
}
