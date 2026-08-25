import { createSignal, For, Show, onMount } from 'solid-js';
import { fetchJson, fetchMutate } from '../services/api.js';

/**
 * v1.1 (workstream A): AI-admin key management section for the dashboard.
 *
 * Lists `mnfst_admin_ai_*` keys (prefix…last4 display identity — the prefix is
 * identical across admin keys), mints new named keys (raw shown ONCE via a
 * one-time reveal that is never persisted client-side), rotates with
 * confirmation, pauses/resumes, and revokes with confirmation.
 *
 * Auth: the caller's dashboard session. Backend note — v1.1 resolution §D.1:
 * the session's server-side ai_admin key performs the actual /admin calls, so
 * the owner never handles raw admin keys beyond the copy-once reveal.
 */

interface AdminKey {
  id: string;
  keyPrefix: string;
  keyLast4: string | null;
  name: string;
  createdAt: string;
  pausedAt: string | null;
  lastUsedAt: string | null;
}

const AdminKeysSection = () => {
  const [keys, setKeys] = createSignal<AdminKey[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [newKeyName, setNewKeyName] = createSignal('');
  const [creating, setCreating] = createSignal(false);
  // One-time reveal state: raw key from create/rotate. Dismissed permanently
  // once copied or closed — the backend cannot re-serve it (hash-only storage).
  const [oneTimeKey, setOneTimeKey] = createSignal<{ id: string; raw: string } | null>(null);
  const [copied, setCopied] = createSignal(false);
  const [confirmAction, setConfirmAction] = createSignal<{
    kind: 'rotate' | 'revoke' | 'pause' | 'resume';
    key: AdminKey;
  } | null>(null);
  const [busyId, setBusyId] = createSignal<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchJson<{ keys: AdminKey[] }>('/admin/keys', undefined, {
        cache: false,
      });
      setKeys(resp.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin keys');
    } finally {
      setLoading(false);
    }
  };

  onMount(load);

  const displayName = (k: AdminKey) =>
    k.keyLast4 ? `${k.keyPrefix}…${k.keyLast4}` : `${k.keyPrefix}…`;

  const copyRaw = async () => {
    const current = oneTimeKey();
    if (!current) return;
    await navigator.clipboard.writeText(current.raw);
    setCopied(true);
  };

  const dismissRaw = () => {
    setOneTimeKey(null);
    setCopied(false);
    void load();
  };

  const createKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await fetchMutate<{ id: string; key: string; keyPrefix: string }>(
        '/admin/keys',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newKeyName().trim() ? { name: newKeyName().trim() } : {}),
        },
      );
      setNewKeyName('');
      setOneTimeKey({ id: created.id, raw: created.key });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const runConfirmed = async () => {
    const action = confirmAction();
    if (!action) return;
    setBusyId(action.key.id);
    setError(null);
    try {
      if (action.kind === 'rotate') {
        const rotated = await fetchMutate<{ id: string; key: string; keyPrefix: string }>(
          `/admin/keys/${action.key.id}/rotate`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
        );
        setConfirmAction(null);
        setOneTimeKey({ id: rotated.id, raw: rotated.key });
        await load();
      } else if (action.kind === 'revoke') {
        await fetchMutate(`/admin/keys/${action.key.id}`, { method: 'DELETE' });
        setConfirmAction(null);
        await load();
      } else if (action.kind === 'pause') {
        await fetchMutate(`/admin/keys/${action.key.id}/pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        setConfirmAction(null);
        await load();
      } else {
        await fetchMutate(`/admin/keys/${action.key.id}/resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        setConfirmAction(null);
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action.kind} key`);
    } finally {
      setBusyId(null);
    }
  };

  const confirmText = () => {
    const action = confirmAction();
    if (!action) return '';
    switch (action.kind) {
      case 'rotate':
        return `Rotate "${action.key.name}"? The current key stops working immediately and a new key will be shown once.`;
      case 'revoke':
        return `Revoke "${action.key.name}"? Anything using this key loses admin access immediately. This cannot be undone.`;
      case 'pause':
        return `Pause "${action.key.name}"? It will be rejected on all admin routes until resumed.`;
      case 'resume':
        return `Resume "${action.key.name}"?`;
    }
  };

  return (
    <>
      <h2 class="settings-section__title">AI admin keys</h2>
      <div class="settings-card">
        <div class="settings-card__body">
          <span class="settings-card__label-title">mnfst_admin_ai_* keys</span>
          <span class="settings-card__label-desc" style="font-size: 14px;">
            Scoped keys for AI agents to administer this install. The full key is shown exactly
            once at creation — store it somewhere safe. Paused keys fail immediately on all
            admin routes except resume.
          </span>

          <Show when={error()}>
            <div style="color: var(--text-danger, #b00); margin-top: 8px;" role="alert">
              {error()}
            </div>
          </Show>

          <Show when={loading()}>
            <span class="spinner" /> Loading…
          </Show>

          <Show when={!loading()}>
            <table style="width: 100%; margin-top: 12px; border-collapse: collapse;">
              <thead>
                <tr style="text-align: left;">
                  <th style="padding: 6px 8px;">Name</th>
                  <th style="padding: 6px 8px;">Key</th>
                  <th style="padding: 6px 8px;">Status</th>
                  <th style="padding: 6px 8px;">Last used</th>
                  <th style="padding: 6px 8px;" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                <For each={keys()}>
                  {(k) => (
                    <tr>
                      <td style="padding: 6px 8px;">{k.name}</td>
                      <td style="padding: 6px 8px;">
                        <code>{displayName(k)}</code>
                      </td>
                      <td style="padding: 6px 8px;">
                        <Show when={k.pausedAt} fallback={<span>Active</span>}>
                          <span style="color: var(--text-danger, #b00);">Paused</span>
                        </Show>
                      </td>
                      <td style="padding: 6px 8px;">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}
                      </td>
                      <td style="padding: 6px 8px; text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                          <Show
                            when={!k.pausedAt}
                            fallback={
                              <button
                                class="btn btn--ghost btn--sm"
                                disabled={busyId() === k.id}
                                onClick={() => setConfirmAction({ kind: 'resume', key: k })}
                              >
                                Resume
                              </button>
                            }
                          >
                            <button
                              class="btn btn--ghost btn--sm"
                              disabled={busyId() === k.id}
                              onClick={() => setConfirmAction({ kind: 'pause', key: k })}
                            >
                              Pause
                            </button>
                          </Show>
                          <button
                            class="btn btn--ghost btn--sm"
                            disabled={busyId() === k.id}
                            onClick={() => setConfirmAction({ kind: 'rotate', key: k })}
                          >
                            Rotate
                          </button>
                          <button
                            class="btn btn--danger btn--sm"
                            disabled={busyId() === k.id}
                            onClick={() => setConfirmAction({ kind: 'revoke', key: k })}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>

            {/* Create row */}
            <div style="display: flex; gap: 8px; margin-top: 16px; align-items: center;">
              <input
                type="text"
                placeholder="New key name"
                value={newKeyName()}
                onInput={(e) => setNewKeyName(e.currentTarget.value)}
                style="flex: 0 1 240px;"
              />
              <button
                class="btn btn--primary btn--sm"
                disabled={creating() || !newKeyName().trim()}
                onClick={createKey}
              >
                {creating() ? 'Creating…' : 'Create key'}
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* One-time raw-key reveal modal */}
      <Show when={oneTimeKey()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New key created"
          style="
            position: fixed; inset: 0; background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
          "
        >
          <div
            class="settings-card"
            style="max-width: 560px; width: 92%; background: var(--bg-primary, #fff); padding: 24px;"
          >
            <h3 style="margin-top: 0;">Copy your new key now</h3>
            <p style="font-size: 14px;">
              This is the only time the full key is shown. It is stored hashed — it cannot be
              retrieved again. If lost, rotate the key to generate a new one.
            </p>
            <code
              style="
                display: block; word-break: break-all; padding: 12px;
                background: var(--bg-secondary, #f5f5f5); border-radius: 6px; font-size: 13px;
              "
            >
              {oneTimeKey()?.raw}
            </code>
            <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
              <button class="btn btn--primary btn--sm" onClick={copyRaw}>
                {copied() ? 'Copied!' : 'Copy key'}
              </button>
              <button class="btn btn--ghost btn--sm" onClick={dismissRaw} disabled={!copied()}>
                {copied() ? 'Done' : 'Copy first'}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Confirmation modal for rotate/revoke/pause/resume */}
      <Show when={confirmAction()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm action"
          style="
            position: fixed; inset: 0; background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
          "
        >
          <div
            class="settings-card"
            style="max-width: 480px; width: 90%; background: var(--bg-primary, #fff); padding: 24px;"
          >
            <h3 style="margin-top: 0;">Are you sure?</h3>
            <p style="font-size: 14px;">{confirmText()}</p>
            <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
              <button class="btn btn--ghost btn--sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                class={`btn btn--sm ${
                  confirmAction()?.kind === 'revoke' ? 'btn--danger' : 'btn--primary'
                }`}
                disabled={busyId() === confirmAction()?.key.id}
                onClick={runConfirmed}
              >
                {busyId() === confirmAction()?.key.id ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default AdminKeysSection;
