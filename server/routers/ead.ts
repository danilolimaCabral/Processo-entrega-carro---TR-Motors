import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  ead_courses,
  ead_lessons,
  ead_progress,
  ead_certificates,
  type InsertEadCourse,
  type InsertEadLesson,
} from "../../drizzle/schema";

// ============================================================
// Course endpoints
// ============================================================
export const listCourses = protectedProcedure
  .input(
    z.object({
      status: z.string().optional(),
      category: z.string().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const db = await getDb();
    let query = db
      .select({ course: ead_courses })
      .from(ead_courses);
    if (input?.status) {
      query = query.where(eq(ead_courses.status, input.status as any));
    }
    return query.orderBy(desc(ead_courses.createdAt));
  });

export const getCourse = protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    const db = await getDb();
    const [course] = await db
      .select()
      .from(ead_courses)
      .where(eq(ead_courses.id, input.id));
    if (!course) throw new Error("Curso não encontrado");
    return { course };
  });

export const createCourse = protectedProcedure
  .input(
    z.object({
      title: z.string().min(1, "Título obrigatório"),
      description: z.string().optional(),
      coverUrl: z.string().optional(),
      category: z.string().default("Geral"),
      instructor: z.string().optional(),
      durationHours: z.string().optional(),
      visibility: z.string().default("todos"),
      status: z.string().default("rascunho"),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const insertData: InsertEadCourse = {
      title: input.title,
      description: input.description ?? null,
      coverUrl: input.coverUrl ?? null,
      category: input.category,
      instructor: input.instructor ?? null,
      durationHours: input.durationHours ?? null,
      visibility: input.visibility as any,
      status: input.status as any,
    };
    const result = await db.insert(ead_courses).values(insertData);
    return { success: true, id: result[0].insertId };
  });

export const updateCourse = protectedProcedure
  .input(
    z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      coverUrl: z.string().optional(),
      category: z.string().optional(),
      instructor: z.string().optional(),
      durationHours: z.string().optional(),
      visibility: z.string().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const { id, ...updates } = input;
    await db.update(ead_courses).set(updates as any).where(eq(ead_courses.id, id));
    return { success: true };
  });

export const deleteCourse = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(ead_lessons).where(eq(ead_lessons.courseId, input.id));
    await db.delete(ead_progress).where(eq(ead_progress.courseId, input.id));
    await db.delete(ead_certificates).where(eq(ead_certificates.courseId, input.id));
    await db.delete(ead_courses).where(eq(ead_courses.id, input.id));
    return { success: true };
  });

export const publishCourse = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.update(ead_courses).set({ status: "publicado" as any }).where(eq(ead_courses.id, input.id));
    return { success: true };
  });

// ============================================================
// Lesson endpoints
// ============================================================
export const listLessons = protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input }) => {
    const db = await getDb();
    return db
      .select({ lesson: ead_lessons })
      .from(ead_lessons)
      .where(eq(ead_lessons.courseId, input.courseId))
      .orderBy(ead_lessons.orderIndex);
  });

export const createLesson = protectedProcedure
  .input(
    z.object({
      courseId: z.number(),
      title: z.string().min(1, "Título obrigatório"),
      description: z.string().optional(),
      moduleName: z.string().optional(),
      orderIndex: z.number().default(0),
      videoType: z.string().default("youtube"),
      videoId: z.string().optional(),
      videoUrl: z.string().optional(),
      durationMinutes: z.number().default(0),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const insertData: InsertEadLesson = {
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      moduleName: input.moduleName ?? null,
      orderIndex: input.orderIndex,
      videoType: input.videoType as any,
      videoId: input.videoId ?? null,
      videoUrl: input.videoUrl ?? null,
      durationMinutes: input.durationMinutes,
    };
    const result = await db.insert(ead_lessons).values(insertData);
    // Update total lessons count
    const [lessonCount] = await db
      .select()
      .from(ead_lessons)
      .where(and(eq(ead_lessons.courseId, input.courseId), eq(ead_lessons.status, "ativo" as any)));
    const count = (await db
      .select()
      .from(ead_lessons)
      .where(eq(ead_lessons.courseId, input.courseId))).length;
    await db.update(ead_courses).set({ totalLessons: count }).where(eq(ead_courses.id, input.courseId));
    return { success: true, id: result[0].insertId };
  });

export const updateLesson = protectedProcedure
  .input(
    z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      moduleName: z.string().optional(),
      orderIndex: z.number().optional(),
      videoType: z.string().optional(),
      videoId: z.string().optional(),
      videoUrl: z.string().optional(),
      durationMinutes: z.number().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    const { id, ...updates } = input;
    await db.update(ead_lessons).set(updates as any).where(eq(ead_lessons.id, id));
    return { success: true };
  });

export const deleteLesson = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    const [lesson] = await db.select().from(ead_lessons).where(eq(ead_lessons.id, input.id));
    if (lesson) {
      await db.delete(ead_progress).where(eq(ead_progress.lessonId, input.id));
      await db.delete(ead_lessons).where(eq(ead_lessons.id, input.id));
      const count = (await db.select().from(ead_lessons).where(eq(ead_lessons.courseId, lesson.courseId))).length;
      await db.update(ead_courses).set({ totalLessons: count }).where(eq(ead_courses.id, lesson.courseId));
    }
    return { success: true };
  });

// ============================================================
// Progress endpoints
// ============================================================
export const getProgress = protectedProcedure
  .input(
    z.object({
      courseId: z.number(),
      userId: z.number().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    const db = await getDb();
    const targetUserId = input.userId ?? ctx.user.id;
    return db
      .select()
      .from(ead_progress)
      .where(and(eq(ead_progress.courseId, input.courseId), eq(ead_progress.userId, targetUserId)));
  });

export const markLessonComplete = protectedProcedure
  .input(
    z.object({
      courseId: z.number(),
      lessonId: z.number(),
      watchedPercent: z.number().default(100),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    // Check if already has progress
    const [existing] = await db
      .select()
      .from(ead_progress)
      .where(and(eq(ead_progress.userId, ctx.user.id), eq(ead_progress.lessonId, input.lessonId)));
    if (existing) {
      await db
        .update(ead_progress)
        .set({ completed: true, watchedPercent: input.watchedPercent, completedAt: new Date() })
        .where(eq(ead_progress.id, existing.id));
    } else {
      await db.insert(ead_progress).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        lessonId: input.lessonId,
        completed: true,
        watchedPercent: input.watchedPercent,
        completedAt: new Date(),
      });
    }
    return { success: true };
  });

export const getCourseProgressSummary = protectedProcedure
  .input(z.object({ courseId: z.number() }))
  .query(async ({ input, ctx }) => {
    const db = await getDb();
    const progress = await db
      .select()
      .from(ead_progress)
      .where(and(eq(ead_progress.courseId, input.courseId), eq(ead_progress.userId, ctx.user.id)));
    const [course] = await db.select().from(ead_courses).where(eq(ead_courses.id, input.courseId));
    const totalLessons = course?.totalLessons || 0;
    const completedCount = progress.filter(p => p.completed).length;
    const percentComplete = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    return { completedCount, totalLessons, percentComplete, progress };
  });

// ============================================================
// Certificate endpoints
// ============================================================
export const issueCertificate = protectedProcedure
  .input(z.object({ courseId: z.number(), userId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    const code = `TRM-${Date.now().toString(36).toUpperCase()}`;
    await db.insert(ead_certificates).values({
      userId: input.userId,
      courseId: input.courseId,
      certificateCode: code,
    });
    return { success: true, certificateCode: code };
  });

export const listCertificates = protectedProcedure
  .input(z.object({ userId: z.number().optional() }))
  .query(async ({ input, ctx }) => {
    const db = await getDb();
    const targetUserId = input.userId ?? ctx.user.id;
    return db
      .select()
      .from(ead_certificates)
      .where(eq(ead_certificates.userId, targetUserId))
      .orderBy(desc(ead_certificates.issuedAt));
  });

export const listMyCertificates = protectedProcedure.query(async ({ ctx }) => {
  const db = await getDb();
  return db
    .select()
    .from(ead_certificates)
    .where(eq(ead_certificates.userId, ctx.user.id))
    .orderBy(desc(ead_certificates.issuedAt));
});

// ============================================================
// Student management (admin only - enroll users as students)
// ============================================================
export const enrollStudent = protectedProcedure
  .input(z.object({ userId: z.number(), courseId: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    // Get all lessons for this course
    const lessons = await db
      .select()
      .from(ead_lessons)
      .where(eq(ead_lessons.courseId, input.courseId));
    // Insert progress for each lesson
    for (const lesson of lessons) {
      const [existing] = await db
        .select()
        .from(ead_progress)
        .where(and(eq(ead_progress.userId, input.userId), eq(ead_progress.lessonId, lesson.id)));
      if (!existing) {
        await db.insert(ead_progress).values({
          userId: input.userId,
          courseId: input.courseId,
          lessonId: lesson.id,
          completed: false,
          watchedPercent: 0,
          completedAt: null,
        });
      }
    }
    return { success: true, enrolledLessons: lessons.length };
  });

export const listStudents = protectedProcedure
  .input(z.object({ userId: z.number().optional() }).optional())
  .query(async ({ input, ctx }) => {
    const db = await getDb();
    const query = input?.userId
      ? db.select().from(ead_progress).where(eq(ead_progress.userId, input.userId))
      : db.select().from(ead_progress);
    const progress = await query;
    // Get unique users from progress
    const uniqueUserIds = [...new Set(progress.map(p => p.userId))];
    if (uniqueUserIds.length === 0) return { students: [], progress: [] };
    return { students: uniqueUserIds, progress };
  });

export const getStudentCourses = protectedProcedure
  .input(z.object({ userId: z.number() }))
  .query(async ({ input }) => {
    const db = await getDb();
    // Get all progress for this user grouped by course
    const progress = await db
      .select()
      .from(ead_progress)
      .where(eq(ead_progress.userId, input.userId));
    const courseIds = [...new Set(progress.map(p => p.courseId))];
    if (courseIds.length === 0) return { courses: [], progress: [] };
    const courses = await db
      .select()
      .from(ead_courses)
      .whereIn(ead_courses.id, courseIds);
    // Calculate progress per course
    const courseProgress = courses.map(course => {
      const courseProgressItems = progress.filter(p => p.courseId === course.id);
      const completedCount = courseProgressItems.filter(p => p.completed).length;
      const totalLessons = course.totalLessons || 1;
      const percentComplete = Math.round((completedCount / totalLessons) * 100);
      return {
        course,
        completedCount,
        totalLessons,
        percentComplete,
        progress: courseProgressItems,
      };
    });
    return { courses: courseProgress, progress };
  });

export const unenrollStudent = protectedProcedure
  .input(z.object({ userId: z.number(), courseId: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(ead_progress).where(
      and(eq(ead_progress.userId, input.userId), eq(ead_progress.courseId, input.courseId))
    );
    return { success: true };
  });

// ============================================================
// Stats
// ============================================================
export const eadStats = protectedProcedure.query(async () => {
  const db = await getDb();
  const courses = await db.select().from(ead_courses);
  const published = courses.filter(c => c.status === "publicado");
  const lessons = await db.select().from(ead_lessons);
  return {
    totalCourses: courses.length,
    publishedCourses: published.length,
    totalLessons: lessons.length,
  };
});

export const eadRouter = router({
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  listLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getProgress,
  markLessonComplete,
  getCourseProgressSummary,
  issueCertificate,
  listCertificates,
  listMyCertificates,
  enrollStudent,
  listStudents,
  getStudentCourses,
  unenrollStudent,
  stats: eadStats,
});
