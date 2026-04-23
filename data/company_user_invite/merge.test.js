import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('company_user_invite merge', () => {
  describe('base behaviors', () => {
    it('route.js exports a POST handler', async () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('route.js validates email, requiring a valid format', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/normalizeEmail/);
      expect(src).toMatch(/Valid email is required/);
    });

    it('route.js validates departmentId is required', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/departmentId is required/);
    });

    it('route.js validates termStartDate and termEndDate as ISO dates', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/isIsoDateOnly/);
      expect(src).toMatch(/termStartDate and termEndDate are required/);
    });

    it('route.js validates role against ALLOWED_ROLES', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/ALLOWED_ROLES/);
      expect(src).toMatch(/Invalid role/);
    });

    it('route.js handles existing users by upserting company_users', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/existing/i);
      expect(src).toMatch(/ON CONFLICT.*user_id.*company_id/s);
      expect(src).toMatch(/alreadyExisted.*true/);
    });

    it('CreateUserModal renders ROLE_OPTIONS with 8 roles', () => {
      const src = readResolved('apps/web/src/components/Employees/CreateUserModal.jsx');
      expect(src).toMatch(/ROLE_OPTIONS/);
      const roleValues = src.match(/value:\s*"([^"]+)"/g);
      expect(roleValues.length).toBeGreaterThanOrEqual(8);
    });

    it('CreateUserModal renders a checkbox for setAsHead', () => {
      const src = readResolved('apps/web/src/components/Employees/CreateUserModal.jsx');
      expect(src).toMatch(/type="checkbox"/);
      expect(src).toMatch(/createUserSetAsHead/);
    });

    it('UsersPage defines canManageUsers based on role list including admin, manager, operations, director, super_admin', () => {
      const src = readResolved('apps/web/src/app/modules/users/page.jsx');
      expect(src).toMatch(/canManageUsers/);
      expect(src).toMatch(/admin/);
      expect(src).toMatch(/manager/);
      expect(src).toMatch(/director/);
      expect(src).toMatch(/super_admin/);
    });
  });

  describe('ours behaviors', () => {
    it('route.js includes normalizeDepartmentIdArray and validateDepartmentsExist for headDepartmentIds', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/normalizeDepartmentIdArray/);
      expect(src).toMatch(/validateDepartmentsExist/);
      expect(src).toMatch(/headDepartmentIds/);
    });

    it('route.js builds headDeptIds array that includes deptId when shouldBeDeptHead is true, with deduplication', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/headDeptIds/);
      // The deduplication logic must be present
      expect(src).toMatch(/seen/);
    });

    it('route.js gates setUserAsHeadForDepartments on headDeptIds.length', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/headDeptIds\.length/);
      expect(src).toMatch(/setUserAsHeadForDepartments/);
    });

    it('UsersPage uses useDepartments hook', () => {
      const src = readResolved('apps/web/src/app/modules/users/page.jsx');
      expect(src).toMatch(/useDepartments/);
    });

    it('UsersPage includes departmentsQuery.isFetching in isLoading condition', () => {
      const src = readResolved('apps/web/src/app/modules/users/page.jsx');
      expect(src).toMatch(/departmentsQuery\.isFetching/);
    });
  });

  describe('theirs behaviors', () => {
    it('route.js derives shouldBeDeptHead from role === dept_head OR setAsDepartmentHead', () => {
      const src = readResolved('apps/web/src/app/api/company-users/invite/route.js');
      expect(src).toMatch(/shouldBeDeptHead/);
      expect(src).toMatch(/role\s*===\s*["']dept_head["']\s*\|\|\s*setAsDepartmentHead/);
    });

    it('UsersPage renders department error banner when departmentsQuery.isError', () => {
      const src = readResolved('apps/web/src/app/modules/users/page.jsx');
      expect(src).toMatch(/departmentsQuery\.isError/);
      expect(src).toMatch(/Could not load departments/);
    });

    it('UsersPage passes company in the departments query enable condition', () => {
      const src = readResolved('apps/web/src/app/modules/users/page.jsx');
      // Should check !!company in the departments query enable
      expect(src).toMatch(/!!company\s*&&\s*canManageUsers|canManageUsers.*!!company/);
    });
  });
});
