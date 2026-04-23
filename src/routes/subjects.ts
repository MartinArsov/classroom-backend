import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { departments, subjects } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

//Get all subjects with optional search, filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { search, department, page, limit } = req.query;
    const parsePositiveInt = (value: unknown, fallback: number) => {
      const n = Number.parseInt(String(value ?? ''), 10);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    const currentPage = parsePositiveInt(page, 1);
    const limitPerPage = Math.min(100, parsePositiveInt(limit, 10));
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [];
    // if search query is provided, filter by subject name or code
    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }
    // if department filter is provided, filter by department name
    if (department) {
      const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;
      filterConditions.push(ilike(departments.name, deptPattern));
    }
    // Combine all filter conditions using AND operator, if any filters are applied
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const subjectList = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(subjects.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (e) {
    console.error(`Get /subjects error: ${e}`);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
});

export default router;
