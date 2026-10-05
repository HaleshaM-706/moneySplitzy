"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await argon2.hash('password123');
    const alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: { email: 'alice@example.com', name: 'Alice', passwordHash: password }
    });
    const bob = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: { email: 'bob@example.com', name: 'Bob', passwordHash: password }
    });
    const carol = await prisma.user.upsert({
        where: { email: 'carol@example.com' },
        update: {},
        create: { email: 'carol@example.com', name: 'Carol', passwordHash: password }
    });
    const group = await prisma.group.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Weekend Trip',
            description: 'Group for weekend trip',
            currency: 'INR',
            createdById: alice.id
        }
    });
    await prisma.groupMember.createMany({ data: [
            { userId: alice.id, groupId: group.id, role: 'ADMIN' },
            { userId: bob.id, groupId: group.id, role: 'MEMBER' },
            { userId: carol.id, groupId: group.id, role: 'MEMBER' }
        ] });
    console.log('Seed complete');
}
main().catch(e => { console.error(e); process.exit(1); })
    .finally(() => process.exit());
