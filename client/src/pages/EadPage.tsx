import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Play,
  CheckCircle2,
  Circle,
  BookOpen,
  Clock,
  Award,
  ArrowLeft,
  Lock,
  Film,
  BarChart3,
  GraduationCap,
  ChevronRight,
  Video,
} from "lucide-react";

type CourseCard = {
  course: {
    id: number;
    title: string;
    description: string | null;
    coverUrl: string | null;
    category: string;
    status: string;
    instructor: string | null;
    durationHours: string | null;
    totalLessons: number | null;
    visibility: string;
  };
};

type LessonItem = {
  lesson: {
    id: number;
    courseId: number;
    title: string;
    description: string | null;
    moduleName: string | null;
    orderIndex: number;
    videoType: string;
    videoId: string | null;
    videoUrl: string | null;
    durationMinutes: number;
    status: string;
  };
};

type ProgressItem = {
  id: number;
  userId: number;
  courseId: number;
  lessonId: number;
  completed: boolean;
  watchedPercent: number;
  completedAt: Date | null;
};

export default function EadPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"cursos" | "certificados" | "progresso">("cursos");

  const { data: coursesData, refetch: refetchCourses } = trpc.ead.listCourses.useQuery(
    { status: "publicado" },
    { refetchInterval: 10000 }
  );
  const courses = coursesData?.map((c) => c.course) ?? [];

  const { data: lessonsData, refetch: refetchLessons } = trpc.ead.listLessons.useQuery(
    selectedCourse ? { courseId: selectedCourse } : undefined,
    { enabled: !!selectedCourse }
  );
  const lessons = lessonsData?.map((l) => l.lesson) ?? [];

  const { data: progressData, refetch: refetchProgress } = trpc.ead.getCourseProgressSummary.useQuery(
    selectedCourse ? { courseId: selectedCourse } : undefined,
    { enabled: !!selectedCourse }
  );

  const { data: certificatesData } = trpc.ead.listMyCertificates.useQuery();
  const certificates = certificatesData ?? [];

  const markComplete = trpc.ead.markLessonComplete.useMutation({
    onSuccess: () => {
      refetchProgress();
      refetchCourses();
    },
  });

  const issueCert = trpc.ead.issueCertificate.useMutation({
    onSuccess: () => {
      alert("Certificado emitido com sucesso!");
    },
  });

  const handleMarkComplete = (lessonId: number) => {
    if (!selectedCourse) return;
    markComplete.mutate({ courseId: selectedCourse, lessonId, watchedPercent: 100 });
  };

  const handlePlayLesson = (lessonId: number) => {
    setSelectedLesson(lessonId);
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setSelectedCourse(null);
  };

  // ============ CERTIFICADOS VIEW ============
  if (activeTab === "certificados") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meus Certificados</h2>
          <button
            onClick={() => setActiveTab("cursos")}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={14} /> Voltar aos Cursos
          </button>
        </div>
        {certificates.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Award size={48} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum certificado ainda.</p>
            <p className="text-sm mt-1">Complete um curso para receber seu certificado!</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Award size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Certificado #{cert.certificateCode}</p>
                    <p className="text-xs text-gray-500">
                      Emitido em {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("pt-BR") : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============ PROGRESSO VIEW ============
  if (activeTab === "progresso") {
    const { data: allCoursesData } = trpc.ead.listCourses.useQuery();
    const allCourses = allCoursesData?.map((c) => c.course) ?? [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meu Progresso</h2>
          <button
            onClick={() => setActiveTab("cursos")}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={14} /> Voltar aos Cursos
          </button>
        </div>
        <div className="grid gap-3">
          {allCourses.filter(c => c.status === "publicado").map((course) => (
            <CourseProgressCard key={course.id} courseId={course.id} courseTitle={course.title} />
          ))}
        </div>
      </div>
    );
  }

  // ============ VIDEO PLAYER VIEW ============
  if (selectedLesson && lessons.length > 0) {
    const lesson = lessons.find((l) => l.id === selectedLesson);
    if (!lesson) return null;
    const course = courses.find((c) => c.id === selectedCourse);

    const getVideoUrl = () => {
      if (lesson.videoType === "youtube" && lesson.videoId) {
        return `https://www.youtube.com/embed/${lesson.videoId}`;
      }
      if (lesson.videoType === "vimeo" && lesson.videoId) {
        return `https://player.vimeo.com/video/${lesson.videoId}`;
      }
      return lesson.videoUrl || null;
    };

    const videoUrl = getVideoUrl();
    const isCompleted = progressData?.progress.some((p) => p.lessonId === lesson.id && p.completed);

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-1 text-sm text-blue-600">
          <ArrowLeft size={14} /> Voltar às aulas
        </button>
        <h3 className="font-semibold text-lg">{lesson.title}</h3>
        {lesson.moduleName && (
          <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{lesson.moduleName}</span>
        )}

        {/* Video Player */}
        <div className="w-full rounded-xl overflow-hidden bg-black shadow-lg">
          {videoUrl ? (
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={videoUrl}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Video size={48} className="mx-auto mb-2 opacity-30" />
                <p>Vídeo não disponível</p>
              </div>
            </div>
          )}
        </div>

        {/* Mark as complete */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : (
              <Circle size={20} className="text-gray-300" />
            )}
            <span className="text-sm">{isCompleted ? "Aula concluída" : "Ainda não concluída"}</span>
          </div>
          {!isCompleted && (
            <button
              onClick={() => handleMarkComplete(lesson.id)}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors min-h-[40px]"
            >
              Marcar como Concluída
            </button>
          )}
        </div>

        {/* Description */}
        {lesson.description && (
          <div className="p-4 bg-white rounded-xl border text-sm text-gray-600">
            {lesson.description}
          </div>
        )}

        {/* Next lesson */}
        {(() => {
          const idx = lessons.findIndex((l) => l.id === selectedLesson);
          const nextLesson = idx >= 0 && idx < lessons.length - 1 ? lessons[idx + 1] : null;
          if (nextLesson) {
            return (
              <button
                onClick={() => setSelectedLesson(nextLesson.id)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <span className="text-sm font-medium">Próxima: {nextLesson.title}</span>
                <ChevronRight size={16} />
              </button>
            );
          }
          return null;
        })()}
      </div>
    );
  }

  // ============ COURSE DETAIL (lessons list) ============
  if (selectedCourse) {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return null;
    const completedCount = progressData?.completedCount ?? 0;
    const totalLessons = progressData?.totalLessons ?? 0;
    const percentComplete = progressData?.percentComplete ?? 0;

    // Group lessons by module
    const groupedLessons: Record<string, typeof lessons> = {};
    lessons.forEach((l) => {
      const moduleName = l.moduleName || "Sem módulo";
      if (!groupedLessons[moduleName]) groupedLessons[moduleName] = [];
      groupedLessons[moduleName].push(l);
    });

    return (
      <div className="space-y-4">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-blue-600">
          <ArrowLeft size={14} /> Voltar aos cursos
        </button>

        {/* Course header */}
        <div className="relative rounded-xl overflow-hidden">
          {course.coverUrl ? (
            <img src={course.coverUrl} alt={course.title} className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <BookOpen size={40} className="text-white opacity-50" />
            </div>
          )}
          <div className="p-4 bg-white">
            <h2 className="font-bold text-lg">{course.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              {course.instructor && <span>{course.instructor}</span>}
              <span className="flex items-center gap-1">
                <Clock size={12} /> {course.durationHours ? `${course.durationHours}h` : "-"}
              </span>
              <span className="flex items-center gap-1">
                <Film size={12} /> {totalLessons} aulas
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seu progresso</span>
            <span className="text-sm text-gray-500">{percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{completedCount} de {totalLessons} aulas concluídas</p>
        </div>

        {/* Lessons grouped by module */}
        {Object.entries(groupedLessons).map(([moduleName, moduleLessons]) => (
          <div key={moduleName}>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{moduleName}</h4>
            <div className="space-y-1">
              {moduleLessons.map((lesson, idx) => {
                const isLessonCompleted = progressData?.progress.some(
                  (p) => p.lessonId === lesson.id && p.completed
                );
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handlePlayLesson(lesson.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: isLessonCompleted ? "#dcfce7" : "#f3f4f6", color: isLessonCompleted ? "#16a34a" : "#6b7280" }}>
                      {isLessonCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${isLessonCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400">{lesson.durationMinutes} min</p>
                    </div>
                    <Play size={16} className="text-blue-500" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Issue certificate if complete */}
        {percentComplete === 100 && totalLessons > 0 && (
          <button
            onClick={() => issueCert.mutate({ courseId: selectedCourse, userId: user?.id ?? 0 })}
            className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
          >
            <Award size={20} /> Emitir Certificado de Conclusão
          </button>
        )}
      </div>
    );
  }

  // ============ COURSE LIST (main view) ============
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("cursos")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "cursos" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
        >
          📚 Cursos
        </button>
        <button
          onClick={() => setActiveTab("progresso")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "progresso" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
        >
          📊 Progresso
        </button>
        <button
          onClick={() => setActiveTab("certificados")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "certificados" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
        >
          🏆 Certificados
        </button>
      </div>

      {/* Course cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCardComponent
            key={course.id}
            course={course}
            onClick={() => setSelectedCourse(course.id)}
          />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum curso disponível ainda.</p>
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

function CourseCardComponent({ course, onClick }: { course: CourseCard["course"]; onClick: () => void }) {
  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery(
    { courseId: course.id },
    { enabled: !!course.id }
  );
  const percent = progressData?.percentComplete ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left border rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      {course.coverUrl ? (
        <img src={course.coverUrl} alt={course.title} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <BookOpen size={32} className="text-white opacity-50" />
        </div>
      )}
      <div className="p-3">
        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mb-1">
          {course.category}
        </span>
        <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Film size={10} /> {course.totalLessons ?? 0} aulas
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {course.durationHours ? `${course.durationHours}h` : ""}
          </span>
        </div>
        {/* Progress */}
        {percent > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{percent}% concluído</p>
          </div>
        )}
      </div>
    </button>
  );
}

function CourseProgressCard({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery({ courseId });
  const percent = progressData?.percentComplete ?? 0;

  return (
    <div className="p-4 bg-white border rounded-xl">
      <h4 className="font-medium text-sm">{courseTitle}</h4>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-sm font-medium text-gray-600">{percent}%</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {progressData?.completedCount ?? 0} de {progressData?.totalLessons ?? 0} aulas
      </p>
    </div>
  );
}
