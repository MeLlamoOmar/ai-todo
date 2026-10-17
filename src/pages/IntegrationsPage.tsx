import { useEffect, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import type { Integration } from '../types/integration';
import {
  createIntegration, getIntegrationEndpoint, getIntegrationStatus,
  listIntegrations, revokeIntegration,
} from '../utils/integrationRepository';

function message(error: unknown) {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message : 'Please try again.';
}

function displayDate(date: string | null) {
  return date ? new Date(date).toLocaleString() : 'Never';
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState<{ id: string; token: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const endpoint = getIntegrationEndpoint();
  const activeCount = integrations.filter((integration) => getIntegrationStatus(integration) === 'Active').length;

  useEffect(() => {
    let current = true;
    void listIntegrations()
      .then((data) => {
        if (current) { setIntegrations(data); setLoadError(null); }
      })
      .catch((error: unknown) => { if (current) setLoadError(message(error)); })
      .finally(() => { if (current) setIsLoading(false); });
    return () => { current = false; };
  }, [loadAttempt]);

  function refresh() {
    setIsLoading(true);
    setLoadError(null);
    setLoadAttempt((attempt) => attempt + 1);
  }

  async function handleCreate(event: SubmitEvent) {
    event.preventDefault();
    if (isBusy || !name.trim()) return;
    setIsBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      const { token, ...integration } = await createIntegration(name.trim());
      setSecret({ id: integration.id, token });
      setIntegrations((current) => [integration, ...current]);
      setName('');
    } catch (error) {
      setActionError(message(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    if (isBusy) return;
    setIsBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await revokeIntegration(id);
      if (secret?.id === id) setSecret(null);
      setIntegrations((current) => current.map((integration) => integration.id === id
        ? { ...integration, revoked_at: new Date().toISOString() } : integration));
      setNotice('Integration revoked. Its token can no longer be used.');
    } catch (error) {
      setActionError(message(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function copyToken() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret.token);
      setNotice('Token copied. Paste it only into your private shortcut.');
    } catch {
      setActionError('Could not copy. Select and copy the token manually.');
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm underline">Back to transactions</Link>
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect Siri and iOS Shortcuts to your account. Each token can create transactions
            and fetch their category options. Tokens expire after 90 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
          {notice && <p role="status" className="text-sm">{notice}</p>}

          {secret && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Save this token now</p>
              <p className="text-sm text-muted-foreground">
                This is the only time it will be shown. Keep your shortcut private: anyone
                with this token can add transactions to your account until it expires or you revoke it.
              </p>
              <Label htmlFor="integration-token">Integration token</Label>
              <Input id="integration-token" value={secret.token} readOnly autoComplete="off" spellCheck={false} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void copyToken()}>Copy token</Button>
                <Button type="button" variant="outline" onClick={() => setSecret(null)}>I saved it — hide token</Button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3" aria-busy={isBusy}>
            <Label htmlFor="integration-name">Integration name</Label>
            <Input id="integration-name" value={name} onChange={(event) => setName(event.target.value)}
              placeholder="Personal iPhone" required maxLength={80} disabled={isLoading || isBusy || Boolean(loadError)} />
            <p className="text-sm text-muted-foreground">Up to 5 active integrations. Permission: transactions:create.</p>
            <Button type="submit" disabled={isLoading || isBusy || Boolean(loadError) || !name.trim() || activeCount >= 5 || Boolean(secret)}>
              {isBusy ? 'Working...' : 'Create integration'}
            </Button>
            {secret && <p className="text-sm">Save and hide the current token before creating another integration.</p>}
          </form>

          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">Your integrations</p>
            <Button type="button" variant="outline" onClick={refresh} disabled={isLoading || isBusy}>Refresh</Button>
          </div>
          {isLoading ? <p role="status">Loading integrations...</p> : loadError ? (
            <p role="alert" className="text-sm text-destructive">Could not load integrations. {loadError} Use Refresh to retry.</p>
          ) : integrations.length === 0 ? <p className="text-sm text-muted-foreground">You have no integrations yet.</p> : (
            <ul className="space-y-3">
              {integrations.map((integration) => (
                <li key={integration.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm">{getIntegrationStatus(integration)}</p>
                    </div>
                    {!integration.revoked_at && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="outline" disabled={isBusy}>Revoke</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke {integration.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This token will stop working. You can create a new integration if you need to reconnect the device.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleRevoke(integration.id)}>Revoke integration</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <dl className="space-y-1 text-sm text-muted-foreground">
                    <div><dt className="inline">Created: </dt><dd className="inline">{displayDate(integration.created_at)}</dd></div>
                    <div><dt className="inline">Expires: </dt><dd className="inline">{displayDate(integration.expires_at)}</dd></div>
                    <div><dt className="inline">Last used: </dt><dd className="inline">{displayDate(integration.last_used_at)}</dd></div>
                    <div><dt className="inline">Permissions: </dt><dd className="inline">{integration.scopes.join(', ')}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Set up your iPhone shortcut</CardTitle>
          <CardDescription>Build a shortcut named “Registrar transacción” in Apple Shortcuts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Use this endpoint and the token you generated for this device:</p>
          <code className="block break-all rounded border p-3">{endpoint}</code>
          <ol className="list-decimal space-y-3 pl-5">
            <li>Store the endpoint and your token in private Text actions. Use <code>Authorization: Bearer TOKEN</code> on both requests below.</li>
            <li>Choose Gasto → <code>expense</code> or Ingreso → <code>income</code>.</li>
            <li>Use Get Contents of URL with GET on <code className="break-all">ENDPOINT/categories?type=TYPE</code>. Read <code>categories</code>; build a list of each item’s <code>label</code> and choose one. Find the matching item and keep its <code>value</code> as the category.</li>
            <li>Ask for Input: a positive Number for the amount and Text for the description. Format the current local date as <code>yyyy-MM-dd</code>.</li>
            <li>Read the summary and choose Save or Cancel. After confirmation, generate a UUID and keep it with this operation.</li>
            <li>POST to the endpoint. Add <code>Content-Type: application/json</code> and <code>Idempotency-Key: UUID</code>. Send a JSON dictionary with <code>type</code>, <code>amount</code> (Number), <code>description</code>, <code>category</code> (the catalog value), and <code>date</code>.</li>
            <li>Announce success only if <code>ok</code> is true and <code>transaction_id</code> is present. A duplicate response means the same operation was already processed.</li>
          </ol>
          <p>Keep one pending operation, including its UUID, in a local file before sending. Retry that same file after a lost response; create a new UUID only for a new transaction. Never store the token in the pending file.</p>
          <p>Authentication errors require a new valid token. For a rate limit, wait for <code>retry_after</code> seconds. Shortcuts may stop with its own error if the network is unavailable; that does not confirm whether the save completed.</p>
          <p>For local iPhone testing, replace the Mac’s localhost address with an HTTPS test tunnel restricted to these two routes, using a local test token. Production uses the endpoint shown by the production app.</p>
          <p>Keep the personalized shortcut private. Shared templates must have empty credentials. iCloud synchronization may copy your shortcut to your other devices.</p>
        </CardContent>
      </Card>
    </div>
  );
}
