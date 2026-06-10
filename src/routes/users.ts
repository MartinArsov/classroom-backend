import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { db } from '../db/index.js';
import { user } from '../db/schema/index.js';

const router = express.Router();

// Get all users with optional search, role filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { search, role, page, limit } = req.query;

    const parsePositiveInt = (value: unknown, fallback: number) => {
      const n = Number.parseInt(String(value ?? ''), 10);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };

    const currentPage = parsePositiveInt(page, 1);
    const limitPerPage = Math.min(100, parsePositiveInt(limit, 10));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];

    if (search) {
      const searchPattern = `%${String(search)}%`;
      filterConditions.push(
        or(ilike(user.name, searchPattern), ilike(user.email, searchPattern)),
      );
    }

    if (role) {
      filterConditions.push(eq(user.role, String(role)));
    }

    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const userList = await db
      .select({ ...getTableColumns(user) })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: userList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`Get /users error: ${e}`);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
