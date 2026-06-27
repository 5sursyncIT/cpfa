'use client';

import { useState } from 'react';
import { Role } from '@cpfa/db';
import { Button } from '@cpfa/ui';
import { trpc } from '@/lib/trpc';
import { roleLabel } from '@/lib/labels';
import { useToast } from '@/components/cpfa/admin-ui';

const ALL_ROLES: Role[] = [
  'VISITEUR',
  'CANDIDAT',
  'ABONNE_BIBLIOTHEQUE',
  'FORMATEUR',
  'EDITEUR',
  'BIBLIOTHECAIRE',
  'COMPTABLE',
  'ADMIN',
  'SUPER_ADMIN',
];

export function RolesCell({ userId, roles: initial }: { userId: string; roles: Role[] }) {
  const [roles, setRoles] = useState<Role[]>(initial);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const update = trpc.users.updateRoles.useMutation();

  const toggle = (r: Role) => {
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex flex-wrap gap-1 text-left text-xs hover:underline"
      >
        {roles.map((r) => (
          <span key={r} className="rounded-full bg-muted px-2 py-0.5">
            {roleLabel(r)}
          </span>
        ))}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {ALL_ROLES.map((r) => {
          const active = roles.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggle(r)}
              className={`rounded-full px-2 py-0.5 text-xs ${
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {roleLabel(r)}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { id: userId, roles },
              {
                onSuccess: () => {
                  setOpen(false);
                  toast('Rôles mis à jour.');
                },
                onError: (e) => toast(e.message, 'error'),
              },
            )
          }
        >
          {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRoles(initial);
            setOpen(false);
          }}
        >
          Annuler
        </Button>
      </div>
      {update.isError ? (
        <p className="text-xs text-destructive">{update.error.message}</p>
      ) : null}
    </div>
  );
}
