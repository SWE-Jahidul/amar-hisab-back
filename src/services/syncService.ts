// services/syncService.ts
import { Types } from 'mongoose';
import Income from '../models/Income';
import Expense from '../models/Expense';
import { Note } from '../models/Note';
import Bazar from '../models/Bazar';

export interface SyncChanges {
    incomes: any[];
    expenses: any[];
    notes: any[];
    bazar: any[];
}

export interface PendingChange {
    _id?: string; // Temp ID from client or real ID for updates
    tempId?: string; // Client-generated temp ID
    action: 'create' | 'update' | 'delete';
    data: any;
    clientTimestamp: Date;
}

export interface PendingChanges {
    incomes?: PendingChange[];
    expenses?: PendingChange[];
    notes?: PendingChange[];
    bazar?: PendingChange[];
}

export interface IdMapping {
    tempId: string;
    realId: string;
}

/**
 * Get all changes for a user since a specific timestamp
 */
export async function getChangesSince(
    userId: Types.ObjectId,
    lastSyncAt: Date
): Promise<SyncChanges> {
    const query = {
        user: userId,
        updatedAt: { $gt: lastSyncAt }
    };

    const [incomes, expenses, notes, bazar] = await Promise.all([
        Income.find(query).sort({ updatedAt: 1 }).lean(),
        Expense.find(query).sort({ updatedAt: 1 }).lean(),
        Note.find(query).sort({ updatedAt: 1 }).lean(),
        Bazar.find(query).sort({ updatedAt: 1 }).lean()
    ]);

    return {
        incomes,
        expenses,
        notes,
        bazar
    };
}

/**
 * Apply pending changes from client to server
 */
export async function applyPendingChanges(
    userId: Types.ObjectId,
    pendingChanges: PendingChanges
): Promise<{ idMappings: Record<string, IdMapping[]>; conflicts: any[] }> {
    const idMappings: Record<string, IdMapping[]> = {
        incomes: [],
        expenses: [],
        notes: [],
        bazar: []
    };
    const conflicts: any[] = [];

    // Process incomes
    if (pendingChanges.incomes) {
        for (const change of pendingChanges.incomes) {
            const result = await processChange('Income', Income, userId, change);
            if (result.idMapping) {
                idMappings.incomes.push(result.idMapping);
            }
            if (result.conflict) {
                conflicts.push(result.conflict);
            }
        }
    }

    // Process expenses
    if (pendingChanges.expenses) {
        for (const change of pendingChanges.expenses) {
            const result = await processChange('Expense', Expense, userId, change);
            if (result.idMapping) {
                idMappings.expenses.push(result.idMapping);
            }
            if (result.conflict) {
                conflicts.push(result.conflict);
            }
        }
    }

    // Process notes
    if (pendingChanges.notes) {
        for (const change of pendingChanges.notes) {
            const result = await processChange('Note', Note, userId, change);
            if (result.idMapping) {
                idMappings.notes.push(result.idMapping);
            }
            if (result.conflict) {
                conflicts.push(result.conflict);
            }
        }
    }

    // Process bazar
    if (pendingChanges.bazar) {
        for (const change of pendingChanges.bazar) {
            const result = await processChange('Bazar', Bazar, userId, change);
            if (result.idMapping) {
                idMappings.bazar.push(result.idMapping);
            }
            if (result.conflict) {
                conflicts.push(result.conflict);
            }
        }
    }

    return { idMappings, conflicts };
}

/**
 * Process a single change (create, update, or delete)
 */
async function processChange(
    modelName: string,
    Model: any,
    userId: Types.ObjectId,
    change: PendingChange
): Promise<{ idMapping?: IdMapping; conflict?: any }> {
    try {
        if (change.action === 'create') {
            // Create new record
            const newRecord = new Model({
                ...change.data,
                user: userId,
                syncedAt: new Date()
            });
            await newRecord.save();

            // Return ID mapping if client provided a temp ID
            if (change.tempId) {
                return {
                    idMapping: {
                        tempId: change.tempId,
                        realId: newRecord._id.toString()
                    }
                };
            }
        } else if (change.action === 'update') {
            // Update existing record
            const existingRecord = await Model.findOne({
                _id: change._id,
                user: userId
            });

            if (!existingRecord) {
                return {
                    conflict: {
                        type: 'not_found',
                        modelName,
                        id: change._id,
                        message: 'Record not found on server'
                    }
                };
            }

            // Check for conflicts using Last-Write-Wins
            const serverTimestamp = new Date(existingRecord.updatedAt);
            const clientTimestamp = new Date(change.clientTimestamp);

            if (serverTimestamp > clientTimestamp) {
                // Server version is newer - conflict
                return {
                    conflict: {
                        type: 'timestamp_conflict',
                        modelName,
                        id: change._id,
                        serverTimestamp,
                        clientTimestamp,
                        resolution: 'server_wins',
                        message: 'Server version is newer, client changes ignored'
                    }
                };
            }

            // Client wins - apply changes
            Object.assign(existingRecord, change.data);
            existingRecord.syncedAt = new Date();
            await existingRecord.save();
        } else if (change.action === 'delete') {
            // Soft delete
            const record = await Model.findOne({
                _id: change._id,
                user: userId
            });

            if (record) {
                record.isDeleted = true;
                record.syncedAt = new Date();
                await record.save();
            }
        }

        return {};
    } catch (error) {
        console.error(`Error processing ${modelName} change:`, error);
        return {
            conflict: {
                type: 'error',
                modelName,
                error: (error as Error).message
            }
        };
    }
}

/**
 * Resolve conflicts using Last-Write-Wins strategy
 */
export function resolveConflicts(serverData: any, clientData: any): any {
    const serverTimestamp = new Date(serverData.updatedAt);
    const clientTimestamp = new Date(clientData.clientTimestamp);

    // Most recent change wins
    return serverTimestamp > clientTimestamp ? serverData : clientData;
}
