import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('resource_crud_modals', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('createResourceHandler validates resource name is required', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      expect(src).toContain('Resource name is required');
      expect(src).toContain('status: 400');
    });

    it('createResourceHandler enforces unique resource names per club', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      expect(src).toContain('LOWER(name) = LOWER');
      expect(src).toContain('status: 409');
    });

    it('createResourceHandler validates category sizes', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      expect(src).toContain('validateCategorySizes');
    });

    it('createResourceHandler inserts resource with all fields', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      expect(src).toContain('INSERT INTO resources');
      expect(src).toContain('RETURNING *');
    });

    it('updateResourceHandler validates resource ID is required', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('Resource ID is required');
    });

    it('updateResourceHandler returns 404 when resource not found', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('Resource not found');
      expect(src).toContain('status: 404');
    });

    it('updateResourceHandler enforces unique names on update', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('LOWER(name) = LOWER');
      expect(src).toContain('AND id <> $3');
    });

    it('updateResourceHandler validates sublease is allowed for category', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('Subleasing is disabled for this category');
    });

    it('updateResourceHandler validates temporary assignments', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('Temporary assignments are disabled');
    });

    it('updateResourceHandler validates membership type restriction', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toContain('validateMembershipTypeRestriction');
    });

    it('ResourcesTab shows resource list with categories', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/ResourcesTab.jsx');
      expect(src).toContain('resources');
      expect(src).toContain('categoryOptions');
    });

    it('CreateResourceModal (Configuration) has resource form', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/CreateResourceModal.jsx');
      expect(src).toContain('resourceName');
    });

    it('CreateResourceModal (Resources/Modals) has resource form with isMoorage check', () => {
      const src = readResolved('apps/web/src/components/Resources/Modals/CreateResourceModal.jsx');
      expect(src).toContain('isMoorage');
      expect(src).toContain('resourceName');
    });

    it('EditResourceModal has resource form with isMoorage check', () => {
      const src = readResolved('apps/web/src/components/Resources/Modals/EditResourceModal.jsx');
      expect(src).toContain('isMoorage');
      expect(src).toContain('resourceName');
    });

    it('ResourceTable renders resources with status and assignment info', () => {
      const src = readResolved('apps/web/src/components/Resources/ListView/ResourceTable.jsx');
      expect(src).toContain('assignment_type');
      expect(src).toContain('sublease');
      expect(src).toContain('temporary');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('ResourcesTab uses resourceTerm # pattern for header (ours)', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/ResourcesTab.jsx');
      // ours used numberLabel which includes resourceTerm
      expect(src).toContain('numberLabel');
      expect(src).toContain('resourceTerm');
    });

    it('ResourcesTab uses displayName for resource name display (theirs)', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/ResourcesTab.jsx');
      // theirs used displayName = resource?.resource_name || "-"
      expect(src).toContain('displayName');
      expect(src).toMatch(/resource\?\.resource_name/);
    });

    it('CreateResourceModal (Configuration) sends resourceName unconditionally (theirs)', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/CreateResourceModal.jsx');
      // theirs: resourceName: resourceName.trim() || null (not guarded by isMoorage)
      expect(src).toMatch(/resourceName:\s*resourceName\.trim\(\)\s*\|\|\s*null/);
    });

    it('CreateResourceModal (Configuration) shows resource name field always (theirs)', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/CreateResourceModal.jsx');
      // theirs rendered the resource name field unconditionally
      // Check for the label
      expect(src).toMatch(/Resource\s*Name/i);
    });

    it('CreateResourceModal (Resources/Modals) sends resourceName unconditionally (theirs)', () => {
      const src = readResolved('apps/web/src/components/Resources/Modals/CreateResourceModal.jsx');
      // theirs: resourceName: resourceName.trim() || null
      expect(src).toMatch(/resourceName:\s*resourceName\.trim\(\)\s*\|\|\s*null/);
    });

    it('EditResourceModal sends resourceName unconditionally (theirs)', () => {
      const src = readResolved('apps/web/src/components/Resources/Modals/EditResourceModal.jsx');
      // theirs: resourceName: resourceName.trim() || null
      expect(src).toMatch(/resourceName:\s*resourceName\.trim\(\)\s*\|\|\s*null/);
    });

    it('ResourceTable uses displayName for secondary label (theirs)', () => {
      const src = readResolved('apps/web/src/components/Resources/ListView/ResourceTable.jsx');
      // theirs used displayName instead of resourceSecondary
      expect(src).toContain('displayName');
    });

    it('ResourceTable uses club sublease_verbiage directly (theirs)', () => {
      const src = readResolved('apps/web/src/components/Resources/ListView/ResourceTable.jsx');
      // theirs: subleaseLabel = club?.sublease_verbiage || "Sublease"
      expect(src).toMatch(/club\?\.sublease_verbiage\s*\|\|\s*"Sublease"/);
    });

    it('ResourceTable has specialAssignmentHeaderLabel (theirs)', () => {
      const src = readResolved('apps/web/src/components/Resources/ListView/ResourceTable.jsx');
      expect(src).toContain('specialAssignmentHeaderLabel');
    });

    it('createResourceHandler accepts resourceName (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      expect(src).toContain('resourceName');
    });

    it('updateResourceHandler saves resource_name when provided (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      // theirs: resource_name is a separate display name
      expect(src).toContain('resourceName');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('createResourceHandler handles null/undefined resourceName safely (ours)', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/createResourceHandler.js');
      // ours checked resourceName === undefined || resourceName === null
      expect(src).toMatch(/resourceName\s*===\s*undefined/);
      expect(src).toMatch(/resourceName\s*===\s*null/);
    });

    it('updateResourceHandler handles null/undefined resourceName safely (ours)', () => {
      const src = readResolved('apps/web/src/app/api/resources/handlers/updateResourceHandler.js');
      expect(src).toMatch(/resourceName\s*===\s*undefined/);
    });

    it('ResourcesTab uses numberLabel template with resourceTerm (ours)', () => {
      const src = readResolved('apps/web/src/components/Configuration/Resources/ResourcesTab.jsx');
      // ours: const numberLabel = `${resourceTerm} Number`
      expect(src).toMatch(/numberLabel\s*=\s*`\$\{resourceTerm\}\s*Number`/);
    });
  });
});
