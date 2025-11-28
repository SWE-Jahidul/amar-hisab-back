// routes/sync.ts
import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getChangesSince, applyPendingChanges, PendingChanges } from '../services/syncService';

const router = express.Router();

interface SyncRequest {
    lastSyncAt?: string; // ISO timestamp
    pendingChanges?: PendingChanges;
}

interface SyncResponse {
    success: boolean;
    syncTimestamp: string;
    changes?: {
        incomes: any[];
        expenses: any[];
        notes: any[];
        bazar: any[];
    };
    idMappings?: Record<string, any[]>;
    conflicts?: any[];
    message?: string;
    error?: string;
}

/**
 * POST /api/sync
 * Main synchronization endpoint
 * Accepts last sync timestamp and pending changes from client
 * Returns all server changes since last sync and applies client changes
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response<SyncResponse>): Promise<void> => {
    try {
        const { lastSyncAt, pendingChanges } = req.body as SyncRequest;
        const userId = req.user!._id;

        // Default to epoch if no last sync timestamp provided
        const lastSyncTimestamp = lastSyncAt ? new Date(lastSyncAt) : new Date(0);
        const currentTimestamp = new Date();

        // Get all changes from server since last sync
        const serverChanges = await getChangesSince(userId, lastSyncTimestamp);

        // Apply pending changes from client
        let idMappings = {};
        let conflicts: any[] = [];

        if (pendingChanges) {
            const result = await applyPendingChanges(userId, pendingChanges);
            idMappings = result.idMappings;
            conflicts = result.conflicts;
        }

        res.status(200).json({
            success: true,
            syncTimestamp: currentTimestamp.toISOString(),
            changes: serverChanges,
            idMappings,
            conflicts,
            message: 'Sync completed successfully'
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            syncTimestamp: new Date().toISOString(),
            message: 'Sync failed',
            error: (error as Error).message
        });
    }
});

/**
 * GET /api/sync/status
 * Get sync status for the current user
 * Returns last sync timestamp and count of changes since then
 */
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id;
        const lastSyncAt = req.query.lastSyncAt as string;

        if (!lastSyncAt) {
            res.status(400).json({
                success: false,
                message: 'lastSyncAt query parameter is required'
            });
            return;
        }

        const lastSyncTimestamp = new Date(lastSyncAt);
        const changes = await getChangesSince(userId, lastSyncTimestamp);

        const totalChanges =
            changes.incomes.length +
            changes.expenses.length +
            changes.notes.length +
            changes.bazar.length;

        res.status(200).json({
            success: true,
            hasChanges: totalChanges > 0,
            changeCount: {
                incomes: changes.incomes.length,
                expenses: changes.expenses.length,
                notes: changes.notes.length,
                bazar: changes.bazar.length,
                total: totalChanges
            },
            lastSyncAt: lastSyncAt,
            currentTimestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Sync status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sync status',
            error: (error as Error).message
        });
    }
});

export default router;
