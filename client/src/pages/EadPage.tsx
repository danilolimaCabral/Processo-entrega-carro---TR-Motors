import { useState, useRef, useMemo } from "react";
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
  Film,
  GraduationCap,
  ChevronRight,
  Video,
  Upload,
  Plus,
  Trash2,
  Settings,
  X,
  Trophy,
  TrendingUp,
  Target,
  LogOut,
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  Home,
  Menu,
} from "lucide-react";

type TabType = "dashboard" | "cursos" | "feitas" | "faltam" | "certificados" | "gerenciar" | "trilhas";

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

export default function EadPage() {
  const { user, logout } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Manage state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [showLessonForm, setShowLessonForm] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonModule, setNewLessonModule] = useState("");
  const [uploadingCourseId, setUploadingCourseId] = useState<number | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // All queries at top level (fix React #310 - conditional hooks)
  const { data: coursesData, refetch: refetchCourses } = trpc.ead.listCourses.useQuery(
    { status: "publicado" },
    { refetchInterval: 10000 }
  );
  const courses = coursesData?.map((c) => c.course) ?? [];

  const { data: allCoursesData } = trpc.ead.listCourses.useQuery(undefined, { enabled: true });
  const allCourses = allCoursesData?.map((c) => c.course) ?? [];

  const { data: lessonsData } = trpc.ead.listLessons.useQuery(
    selectedCourse ? { courseId: selectedCourse } : undefined,
    { enabled: !!selectedCourse }
  );
  const lessons = lessonsData?.map((l) => l.lesson) ?? [];

  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery(
    selectedCourse ? { courseId: selectedCourse } : undefined,
    { enabled: !!selectedCourse }
  );

  const { data: certificatesData } = trpc.ead.listMyCertificates.useQuery();
  const certificates = certificatesData ?? [];

  // Progress for ALL courses (for Feitas/Faltam tabs)
  const allCourseProgress = courses.map((course) => ({
    course,
    queryKey: course.id,
  }));

  // Per-course progress queries for Feitas/Faltam tabs
  const completedLessonsList: { courseId: number; courseTitle: string; lessonId: number; lessonTitle: string }[] = [];
  const pendingLessonsList: { courseId: number; courseTitle: string; lessonId: number; lessonTitle: string; courseStatus: string }[] = [];

  // Use lessonsData when a course is selected to compute completed/pending
  if (selectedCourse) {
    lessons.forEach((lesson) => {
      const isCompleted = progressData?.progress.some((p) => p.lessonId === lesson.id && p.completed);
      if (isCompleted) {
        completedLessonsList.push({
          courseId: selectedCourse,
          courseTitle: courses.find((c) => c.id === selectedCourse)?.title || "",
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        });
      } else {
        pendingLessonsList.push({
          courseId: selectedCourse,
          courseTitle: courses.find((c) => c.id === selectedCourse)?.title || "",
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          courseStatus: "pending",
        });
      }
    });
  }

  const markComplete = trpc.ead.markLessonComplete.useMutation({
    onSuccess: () => {
      refetchCourses();
    },
  });

  const issueCert = trpc.ead.issueCertificate.useMutation({
    onSuccess: () => {
      alert("Certificado emitido com sucesso!");
    },
  });

  // ============ MANAGE MUTATIONS ============
  const createCourseMut = trpc.ead.createCourse.useMutation({
    onSuccess: () => { setShowCourseForm(false); refetchCourses(); },
    onError: (e) => alert("Erro: " + e.message),
  });
  const updateCourseMut = trpc.ead.updateCourse.useMutation({
    onSuccess: () => { setShowCourseForm(false); setEditingCourseId(null); refetchCourses(); },
    onError: (e) => alert("Erro: " + e.message),
  });
  const deleteCourseMut = trpc.ead.deleteCourse.useMutation({
    onSuccess: () => refetchCourses(),
    onError: (e) => alert("Erro: " + e.message),
  });
  const publishCourseMut = trpc.ead.publishCourse.useMutation({
    onSuccess: () => refetchCourses(),
    onError: (e) => alert("Erro: " + e.message),
  });
  const createLessonMut = trpc.ead.createLesson.useMutation({
    onSuccess: () => { setShowLessonForm(null); refetchCourses(); },
    onError: (e) => alert("Erro: " + e.message),
  });
  const deleteLessonMut = trpc.ead.deleteLesson.useMutation({
    onSuccess: () => refetchCourses(),
    onError: (e) => alert("Erro: " + e.message),
  });

  const uploadVideoMut = trpc.ead.uploadVideo.useMutation({
    onSuccess: (data) => {
      if (uploadingCourseId) {
        const videoUrl = data.url;
        createLessonMut.mutate({
          courseId: uploadingCourseId,
          title: newLessonTitle || (selectedFile?.name || "Aula"),
          moduleName: newLessonModule || "",
          videoType: "upload",
          videoUrl: videoUrl,
          durationMinutes: 0,
        });
      }
      setSelectedFile(null);
      setUploading(false);
    },
    onError: (e) => {
      setUploading(false);
      alert("Erro no upload: " + e.message);
    },
  });

  const handleMarkComplete = (lessonId: number) => {
    if (!selectedCourse) return;
    markComplete.mutate({ courseId: selectedCourse, lessonId, watchedPercent: 100 });
  };

  const handleBack = () => {
    setSelectedLesson(null);
    setSelectedCourse(null);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  // ============ VIDEO PLAYER VIEW ============
  if (selectedLesson && lessons.length > 0) {
    const lesson = lessons.find((l) => l.id === selectedLesson);
    if (!lesson) return null;

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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
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
              lesson.videoType === "upload" ? (
                <video controls className="w-full" style={{ maxHeight: "400px" }}>
                  <source src={videoUrl} type="video/mp4" />
                  <source src={videoUrl} type="video/webm" />
                  Seu navegador não suporta vídeo.
                </video>
              ) : (
                <div className="relative pb-[56.25%] h-0">
                  <iframe
                    src={videoUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
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
          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 size={20} className="text-green-500" />
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
              <span className="text-sm">{isCompleted ? "Aula concluída ✅" : "Ainda não concluída"}</span>
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
            <div className="p-4 bg-white rounded-xl shadow-sm text-sm text-gray-600">
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
      </div>
    );
  }

  // ============ SIDEBAR NAVIGATION ============
  const navItems = [
    { id: "dashboard" as TabType, icon: Home, label: "Início" },
    { id: "cursos" as TabType, icon: BookOpen, label: "Cursos" },
    { id: "feitas" as TabType, icon: CheckCircle2, label: "Concluídas" },
    { id: "faltam" as TabType, icon: Target, label: "Faltam" },
    { id: "certificados" as TabType, icon: Trophy, label: "Certificados" },
    ...(user?.role === "admin" || user?.role === "rh"
      ? [{ id: "gerenciar" as TabType, icon: Settings, label: "Gerenciar" }]
      : []),
    ...(user?.role === "admin" || user?.role === "rh"
      ? [{ id: "trilhas" as TabType, icon: GraduationCap, label: "Trilhas" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ============ SIDEBAR (Desktop) ============ */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-950 shadow-xl fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl px-3 py-2 shadow-lg">
              <img src="/tr_logo.png" alt="TR Motors" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">TR Motors EAD</p>
              <p className="text-xs text-red-500 font-medium">Plataforma de Ensino</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedCourse(null); setSelectedLesson(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || "aluno"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors min-h-[40px]"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 lg:ml-64 lg:pt-0 p-3 lg:p-6">

        {/* Content based on tab */}
        {activeTab === "dashboard" && <EadDashboardView courses={courses} certificates={certificates} userName={user?.name || "Aluno"} onSelectCourse={(id) => { setSelectedCourse(id); setActiveTab("cursos"); }} />}
        {activeTab === "cursos" && !selectedCourse && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">📚 Meus Cursos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {courses.map((course) => (
                <CourseCardWithProgress key={course.id} course={course} onClick={() => setSelectedCourse(course.id)} />
              ))}
            </div>
            {courses.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum curso disponível ainda.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === "cursos" && selectedCourse && <CourseDetailSection />}
        {activeTab === "feitas" && <CompletedLessonsView courses={courses} />}
        {activeTab === "faltam" && <PendingLessonsView courses={courses} />}
        {activeTab === "certificados" && <CertificatesView certificates={certificates} />}
        {activeTab === "gerenciar" && <ManageView />}
        {activeTab === "trilhas" && <LearningPathsView />}

        {courses.length === 0 && activeTab !== "gerenciar" && activeTab !== "certificados" && (
          <div className="text-center py-12 text-gray-400">
            <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum curso disponível ainda.</p>
          </div>
        )}
      </main>

      {/* Render sub-components with props */}
      {(activeTab === "cursos" && selectedCourse) && (
        <CourseDetailContent
          selectedCourse={selectedCourse}
          lessons={lessons}
          progressData={progressData}
          courses={courses}
          onBack={handleBack}
          onSelectLesson={setSelectedLesson}
          onMarkComplete={handleMarkComplete}
          onIssueCert={() => issueCert.mutate({ courseId: selectedCourse!, userId: user?.id ?? 0 })}
        />
      )}
      {activeTab === "feitas" && <CompletedLessonsContent />}
      {activeTab === "faltam" && <PendingLessonsContent />}
      {activeTab === "certificados" && <CertificatesContent certificates={certificates} />}
      {activeTab === "trilhas" && <LearningPathsContent />}
      {activeTab === "gerenciar" && (
        <ManageContent
          allCourses={allCourses}
          showCourseForm={showCourseForm}
          setShowCourseForm={setShowCourseForm}
          editingCourseId={editingCourseId}
          setEditingCourseId={setEditingCourseId}
          showLessonForm={showLessonForm}
          setShowLessonForm={setShowLessonForm}
          uploading={uploading}
          uploadingCourseId={uploadingCourseId}
          setSelectedFile={setSelectedFile}
          setNewLessonTitle={setNewLessonTitle}
          setNewLessonModule={setNewLessonModule}
          setUploadingCourseId={setUploadingCourseId}
          setUploading={setUploading}
          createCourseMut={createCourseMut}
          updateCourseMut={updateCourseMut}
          deleteCourseMut={deleteCourseMut}
          publishCourseMut={publishCourseMut}
          createLessonMut={createLessonMut}
          deleteLessonMut={deleteLessonMut}
          uploadVideoMut={uploadVideoMut}
          selectedFile={selectedFile}
          videoInputRef={videoInputRef}
        />
      )}
    </div>
  );
}

// ============ Sub-components ============

function EadDashboardView({ courses, certificates, userName, onSelectCourse }: {
  courses: CourseCard["course"][];
  certificates: any[];
  userName: string;
  onSelectCourse: (id: number) => void;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* TR Motors Logo */}
      <div className="flex justify-center py-2">
        <div className="bg-white rounded-2xl px-6 py-3 shadow-md border border-gray-100">
          <img src="/tr_logo.png" alt="TR Motors" className="h-12 sm:h-14 w-auto object-contain" />
        </div>
      </div>

      {/* Welcome header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-red-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-red-900/20">
        <h2 className="text-lg sm:text-xl font-bold">Olá, {userName}! 👋</h2>
        <p className="text-xs sm:text-sm text-gray-300 mt-0.5 sm:mt-1">Continue de onde parou</p>

        {/* Motivation message */}
        <div className="mt-3 sm:mt-4 bg-red-600/20 border border-red-500/30 rounded-xl p-3">
          <p className="text-xs sm:text-sm text-red-100 font-medium">🚀 "O investimento em conhecimento rende sempre os melhores juros."</p>
          <p className="text-[10px] sm:text-xs text-red-200 mt-1">Continue firme! Cada aula te aproxima do seu próximo nível.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-xs text-gray-300">Cursos</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold">{certificates.length}</p>
            <p className="text-xs text-gray-300">Certificados</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold">
              {courses.length > 0 ? Math.round((certificates.length / courses.length) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-300">Concluídos</p>
          </div>
        </div>
      </div>

      {/* Training purpose */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
          <Target size={16} className="text-red-600" /> Por que estamos treinando?
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Na <strong>TR Motors</strong>, acreditamos que nosso time é nosso maior patrimônio. Este treinamento foi
          criado para desenvolver habilidades de <strong>vendas, liderança e atendimento</strong> que vão te ajudar
          a se destacar no mercado automotivo. Cada curso concluído te aproxima de melhores resultados,
          maior confiança e novas oportunidades de crescimento na empresa.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 rounded-full" style={{ width: "30%" }} />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Meta: 100% concluído</span>
        </div>
      </div>

      {/* Course cards */}
      <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-1">
        <TrendingUp size={14} /> Continue estudando
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => (
          <CourseCardWithProgress
            key={course.id}
            course={course}
            onClick={() => onSelectCourse(course.id)}
          />
        ))}
      </div>

      {/* Recent certificates */}
      {certificates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-1 mb-2">
            <Trophy size={14} /> Certificados recentes
          </h3>
          <div className="space-y-2">
            {certificates.slice(0, 3).map((cert: any) => (
              <div key={cert.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Award size={20} className="text-red-600" />
                <div>
                  <p className="text-sm font-medium">Certificado #{cert.certificateCode}</p>
                  <p className="text-xs text-gray-400">
                    {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("pt-BR") : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Course Detail Content ============
function CourseDetailContent({ selectedCourse, lessons, progressData, courses, onBack, onSelectLesson, onMarkComplete, onIssueCert }: {
  selectedCourse: number;
  lessons: any[];
  progressData: any;
  courses: CourseCard["course"][];
  onBack: () => void;
  onSelectLesson: (id: number) => void;
  onMarkComplete: (lessonId: number) => void;
  onIssueCert: () => void;
}) {
  const course = courses.find((c) => c.id === selectedCourse);
  if (!course) return null;
  const completedCount = progressData?.completedCount ?? 0;
  const totalLessons = progressData?.totalLessons ?? 0;
  const percentComplete = progressData?.percentComplete ?? 0;
  const remainingLessons = totalLessons - completedCount;

  const groupedLessons: Record<string, typeof lessons> = {};
  lessons.forEach((l: any) => {
    const moduleName = l.moduleName || "Sem módulo";
    if (!groupedLessons[moduleName]) groupedLessons[moduleName] = [];
    groupedLessons[moduleName].push(l);
  });

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors">
          <ArrowLeft size={14} /> Voltar
        </button>

        {/* Course header */}
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm">
          {course.coverUrl ? (
            <img src={course.coverUrl} alt={course.title} className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-r from-gray-900 to-red-900 flex items-center justify-center">
              <BookOpen size={40} className="text-white opacity-50" />
            </div>
          )}
          <div className="p-4">
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

        {/* Progress summary */}
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Seu progresso</span>
            <span className="text-sm text-gray-500">{percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-red-500" /> {completedCount} concluídas</span>
            <span className="flex items-center gap-1"><Target size={12} className="text-orange-500" /> {remainingLessons} restantes</span>
          </div>
        </div>

        {/* What's left */}
        {remainingLessons > 0 && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700">
              <Target size={16} />
              <span>Faltam {remainingLessons} aula{remainingLessons > 1 ? "s" : ""} para concluir</span>
            </div>
          </div>
        )}

        {/* Lessons grouped by module */}
        {Object.entries(groupedLessons).map(([moduleName, moduleLessons]) => (
          <div key={moduleName}>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{moduleName}</h4>
            <div className="space-y-1">
              {moduleLessons.map((lesson: any, idx: number) => {
                const isLessonCompleted = progressData?.progress.some(
                  (p: any) => p.lessonId === lesson.id && p.completed
                );
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left bg-white border border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: isLessonCompleted ? "#dcfce7" : "#f3f4f6", color: isLessonCompleted ? "#16a34a" : "#6b7280" }}>
                      {isLessonCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${isLessonCompleted ? "text-gray-400 line-through" : "text-gray-800 font-medium"}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400">{lesson.durationMinutes > 0 ? `${lesson.durationMinutes} min` : ""}</p>
                    </div>
                    {isLessonCompleted ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <Play size={16} className="text-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Issue certificate if complete */}
        {percentComplete === 100 && totalLessons > 0 && (
          <button
            onClick={onIssueCert}
            className="w-full py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Award size={20} /> Emitir Certificado de Conclusão
          </button>
        )}
      </div>
    </div>
  );
}

// ============ Completed Lessons View ============
function CompletedLessonsView({ courses }: { courses: CourseCard["course"][] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <CheckCircle2 size={20} className="text-green-500" /> Aulas Concluídas ✅
      </h2>
      <p className="text-sm text-gray-500">Aulas que você já finalizou em todos os seus cursos.</p>
      {courses.map((course) => (
        <CompletedLessonsForCourse key={course.id} courseId={course.id} courseTitle={course.title} />
      ))}
      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma aula concluída ainda.</p>
          <p className="text-sm mt-1">Comece um curso para registrar seu progresso!</p>
        </div>
      )}
    </div>
  );
}

function CompletedLessonsForCourse({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const { data: lessonsData } = trpc.ead.listLessons.useQuery({ courseId }, { enabled: !!courseId });
  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery({ courseId }, { enabled: !!courseId });
  const lessons = lessonsData?.map((l) => l.lesson) ?? [];
  const completed = lessons.filter((l) =>
    progressData?.progress.some((p) => p.lessonId === l.id && p.completed)
  );

  if (completed.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{courseTitle}</h4>
      <div className="space-y-2">
        {completed.map((lesson) => (
          <div key={lesson.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
            <CheckCircle2 size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{lesson.title}</span>
            <span className="ml-auto text-xs text-red-500">✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Pending Lessons View ============
function PendingLessonsView({ courses }: { courses: CourseCard["course"][] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Target size={20} className="text-red-500" /> Aulas Pendentes ⏳
      </h2>
      <p className="text-sm text-gray-500">Aulas que você ainda precisa completar.</p>
      {courses.map((course) => (
        <PendingLessonsForCourse key={course.id} courseId={course.id} courseTitle={course.title} />
      ))}
      {courses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma aula pendente.</p>
        </div>
      )}
    </div>
  );
}

function PendingLessonsForCourse({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const { data: lessonsData } = trpc.ead.listLessons.useQuery({ courseId }, { enabled: !!courseId });
  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery({ courseId }, { enabled: !!courseId });
  const lessons = lessonsData?.map((l) => l.lesson) ?? [];
  const pending = lessons.filter((l) =>
    !progressData?.progress.some((p) => p.lessonId === l.id && p.completed)
  );

  if (pending.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{courseTitle}</h4>
      <div className="space-y-2">
        {pending.map((lesson) => (
          <div key={lesson.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-100">
            <Circle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700">{lesson.title}</span>
            <span className="ml-auto text-xs text-red-500">{lesson.moduleName || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Certificates View ============
function CertificatesView({ certificates }: { certificates: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Trophy size={20} className="text-yellow-500" /> Meus Certificados
      </h2>
      {certificates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Award size={48} className="mx-auto mb-3 opacity-20 text-yellow-600" />
          <p className="font-medium text-gray-700">Nenhum certificado ainda</p>
          <p className="text-sm text-gray-400 mt-1">Complete um curso para receber seu certificado!</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-5 text-center shadow-sm">
              <Trophy size={32} className="mx-auto mb-2 text-yellow-600" />
              <p className="font-bold text-sm text-gray-800">Certificado de Conclusão</p>
              <p className="text-xs text-gray-500 mt-1">Código: #{cert.certificateCode}</p>
              <p className="text-xs text-gray-400 mt-1">
                {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("pt-BR") : "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Course Card with Progress ============
function CourseCardWithProgress({ course, onClick }: { course: CourseCard["course"]; onClick: () => void }) {
  const { data: progressData } = trpc.ead.getCourseProgressSummary.useQuery(
    { courseId: course.id },
    { enabled: !!course.id }
  );
  const percent = progressData?.percentComplete ?? 0;
  const completed = progressData?.completedCount ?? 0;
  const total = progressData?.totalLessons ?? course.totalLessons ?? 0;
  const remaining = total - completed;

  return (
    <button
      onClick={onClick}
      className="w-full text-left border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-500 transition-all hover:scale-[1.01] active:scale-[0.98] bg-white shadow-sm"
    >
      {course.coverUrl ? (
        <img src={course.coverUrl} alt={course.title} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gradient-to-r from-gray-900 to-red-900 flex items-center justify-center">
          <BookOpen size={32} className="text-white opacity-50" />
        </div>
      )}
      <div className="p-4">
        <span className="inline-block text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full mb-1">
          {course.category}
        </span>
        <h3 className="font-semibold text-sm leading-tight">{course.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Film size={10} /> {total} aulas
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} /> {course.durationHours ? `${course.durationHours}h` : ""}
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-red-600">{percent}% concluído</span>
            {remaining > 0 && (
              <span className="text-red-400">Faltam {remaining}</span>
            )}
            {remaining === 0 && total > 0 && (
              <span className="text-green-600 flex items-center gap-0.5"><CheckCircle2 size={10} /> Completo!</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============ Manage View (Admin/RH only) ============
function ManageContent(props: any) {
  const {
    allCourses, showCourseForm, setShowCourseForm, editingCourseId, setEditingCourseId,
    showLessonForm, setShowLessonForm, uploading, uploadingCourseId,
    setSelectedFile, setNewLessonTitle, setNewLessonModule, setUploadingCourseId, setUploading,
    createCourseMut, updateCourseMut, deleteCourseMut, publishCourseMut,
    createLessonMut, deleteLessonMut, uploadVideoMut, selectedFile, videoInputRef,
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">⚙️ Gerenciar EAD</h2>
        <button
          onClick={() => { setShowCourseForm(true); setEditingCourseId(null); }}
          className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors min-h-[40px]"
        >
          <Plus size={14} /> Novo Curso
        </button>
      </div>

      {/* Course form modal */}
      {showCourseForm && (
        <CourseForm
          editingId={editingCourseId}
          onClose={() => { setShowCourseForm(false); setEditingCourseId(null); }}
          onCreate={(data: any) => createCourseMut.mutate(data)}
          onUpdate={(data: any) => updateCourseMut.mutate(data)}
          editingCourse={allCourses.find((c: any) => c.id === editingCourseId)}
        />
      )}

      {/* Course list with actions */}
      <div className="space-y-3">
        {allCourses.map((course: any) => (
          <div key={course.id} className="border rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{course.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${course.status === "publicado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {course.status === "publicado" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{course.totalLessons ?? 0} aulas · {course.category}</p>
              </div>
              <div className="flex gap-1">
                {course.status !== "publicado" && (
                  <button onClick={() => publishCourseMut.mutate({ id: course.id })} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Publicar">
                    <CheckCircle2 size={16} />
                  </button>
                )}
                  <button onClick={() => { setEditingCourseId(course.id); setShowCourseForm(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Editar">
                  <Settings size={16} />
                </button>
                <button onClick={() => setShowLessonForm(course.id)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Adicionar Aula">
                  <Plus size={16} />
                </button>
                <button onClick={() => { if (confirm("Deletar curso?")) deleteCourseMut.mutate({ id: course.id }); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Deletar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Lesson form for this course */}
            {showLessonForm === course.id && (
              <LessonForm
                courseId={course.id}
                onClose={() => setShowLessonForm(null)}
                onUploadVideo={(file: File, title: string, module: string) => {
                  setSelectedFile(file);
                  setNewLessonTitle(title);
                  setNewLessonModule(module);
                  setUploadingCourseId(course.id);
                  setUploading(true);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = (reader.result as string).split(",")[1];
                    uploadVideoMut.mutate({
                      courseId: course.id,
                      fileName: file.name,
                      fileData: base64,
                      mimeType: file.type || "video/mp4",
                    });
                  };
                  reader.readAsDataURL(file);
                }}
                onDeleteLesson={(lessonId: number) => deleteLessonMut.mutate({ id: lessonId })}
                onYoutube={(title: string, module: string, videoId: string) => {
                  createLessonMut.mutate({ courseId: course.id, title, moduleName: module, videoType: "youtube", videoId });
                }}
              />
            )}

            {/* Upload progress */}
            {uploading && uploadingCourseId === course.id && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Upload size={12} className="animate-pulse" />
                  <span>Enviando vídeo...</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
            )}

            {/* Lessons list for this course */}
            <LessonsList courseId={course.id} onDelete={(id: number) => deleteLessonMut.mutate({ id })} />
          </div>
        ))}
      </div>

      {allCourses.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Settings size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum curso cadastrado.</p>
          <p className="text-sm mt-1">Clique em "Novo Curso" para começar!</p>
        </div>
      )}
    </div>
  );
}

// ============ Course Form ============
function CourseForm({ editingId, editingCourse, onClose, onCreate, onUpdate }: {
  editingId: number | null;
  editingCourse?: any;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
}) {
  const [title, setTitle] = useState(editingCourse?.title || "");
  const [description, setDescription] = useState(editingCourse?.description || "");
  const [category, setCategory] = useState(editingCourse?.category || "Vendas");
  const [instructor, setInstructor] = useState(editingCourse?.instructor || "");
  const [durationHours, setDurationHours] = useState(editingCourse?.durationHours || "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (editingId && editingCourse) {
      onUpdate({ id: editingId, title, description, category, instructor, durationHours });
    } else {
      onCreate({ title, description, category, instructor, durationHours, status: "rascunho" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{editingId ? "Editar Curso" : "Novo Curso"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Título do curso *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Vendas">Vendas</option>
            <option value="Despachante">Despachante</option>
            <option value="RH">RH</option>
            <option value="Entrega">Entrega</option>
            <option value="Liderança">Liderança</option>
            <option value="Técnico">Técnico</option>
            <option value="Geral">Geral</option>
          </select>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Instrutor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Duração (ex: 4.5)"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors min-h-[40px]"
          >
            {editingId ? "Salvar Alterações" : "Criar Curso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Lesson Form ============
function LessonForm({ courseId, onClose, onUploadVideo, onYoutube, onDeleteLesson }: {
  courseId: number;
  onClose: () => void;
  onUploadVideo: (file: File, title: string, module: string) => void;
  onYoutube: (title: string, module: string, videoId: string) => void;
  onDeleteLesson: (lessonId: number) => void;
}) {
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonModule, setLessonModule] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [useUpload, setUseUpload] = useState(true);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file, lessonTitle || file.name.replace(/\.[^/.]+$/, ""), lessonModule);
    }
    e.target.value = "";
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeId.trim()) return;
    onYoutube(lessonTitle || "Aula " + youtubeId, lessonModule, youtubeId);
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-xl border space-y-3">
      <h4 className="text-sm font-semibold">Adicionar Aula</h4>
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        placeholder="Título da aula *"
        value={lessonTitle}
        onChange={(e) => setLessonTitle(e.target.value)}
      />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        placeholder="Módulo (ex: Módulo 1)"
        value={lessonModule}
        onChange={(e) => setLessonModule(e.target.value)}
      />

      {/* Toggle between upload and YouTube */}
      <div className="flex gap-1 bg-white border rounded-lg p-1">
        <button
          onClick={() => setUseUpload(true)}
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium ${useUpload ? "bg-red-100 text-red-700" : "text-gray-500"}`}
        >
          📤 Upload Vídeo
        </button>
        <button
          onClick={() => setUseUpload(false)}
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium ${!useUpload ? "bg-gray-100 text-gray-700" : "text-gray-500"}`}
        >
          ▶️ YouTube
        </button>
      </div>

      {useUpload ? (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 transition-colors">
          <Upload size={24} className="text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">Toque para selecionar vídeo</span>
          <span className="text-xs text-gray-300">MP4, WebM (máx 100MB)</span>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            placeholder="ID do vídeo YouTube (ex: dQw4w9WgXcQ)"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
          />
          <button
            onClick={handleYoutubeSubmit}
            className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Adicionar Vídeo YouTube
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Lessons List ============
function LessonsList({ courseId, onDelete }: { courseId: number; onDelete: (id: number) => void }) {
  const { data: lessonsData, refetch } = trpc.ead.listLessons.useQuery(
    { courseId },
    { enabled: !!courseId }
  );
  const lessons = lessonsData?.map((l) => l.lesson) ?? [];

  if (lessons.length === 0) return null;

  const grouped: Record<string, typeof lessons> = {};
  lessons.forEach((l) => {
    const mod = l.moduleName || "Geral";
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(l);
  });

  return (
    <div className="mt-3 space-y-2">
      {Object.entries(grouped).map(([modName, modLessons]) => (
        <div key={modName}>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">{modName}</p>
          {modLessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Video size={12} className="text-red-600" />
              </div>
              <span className="flex-1 text-xs">{lesson.title}</span>
              <span className="text-xs text-gray-400">
                {lesson.videoType === "upload" ? "📤" : "▶️"}
              </span>
              <button
                onClick={() => { if (confirm("Deletar aula?")) onDelete(lesson.id); }}
                className="p-1 text-red-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Placeholder sub-components that are not rendered (hooks are at top level)
function CourseDetailSection() { return null; }
function CompletedLessonsContent() { return null; }
function PendingLessonsContent() { return null; }
function CertificatesContent({ certificates }: { certificates: any[] }) { return null; }
function ManageView() { return null; }

// ===================== TRILHAS DE ONBOARDING (EAD) =====================
function LearningPathsView() {
  return null; // View wrapper - content rendered in LearningPathsContent
}

function LearningPathsContent() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", role: "" });
  const utils = trpc.useUtils();

  const { data: paths } = trpc.rh.listLearningPaths.useQuery();
  const createPath = trpc.rh.createLearningPath.useMutation({
    onSuccess: () => { utils.invalidate(); setShowForm(false); setForm({ name: "", description: "", role: "" }); },
    onError: (e) => alert("Erro: " + e.message),
  });
  const deletePath = trpc.rh.deleteLearningPath.useMutation({ onSuccess: () => utils.invalidate() });

  const roles = ["admin", "rh", "vendedor", "financeiro", "gerente", "aluno"];
  const roleLabels: Record<string, string> = {
    admin: "Administrador", rh: "RH", vendedor: "Vendedor", financeiro: "Financeiro", gerente: "Gerente", aluno: "Aluno",
  };

  const handleCreate = () => {
    if (!form.name || !form.role) { alert("Preencha nome e cargo alvo"); return; }
    createPath.mutate({ name: form.name, role: form.role, description: form.description || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">🎓 Trilhas de Onboarding</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors min-h-[40px]"
        >
          <Plus size={16} /> Nova Trilha
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-medium text-gray-900">Criar Nova Trilha</h3>
          <input
            placeholder="Nome da trilha"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[40px]"
          />
          <textarea
            placeholder="Descrição"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={2}
          />
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[40px]"
          >
            <option value="">Selecione o cargo alvo...</option>
            {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors min-h-[40px]">Criar</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors min-h-[40px]">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {paths?.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                </div>
                <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2 shrink-0">
                  {roleLabels[p.role] || p.role}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">Cursos vinculados: {p.courses?.length || 0}</span>
                <button
                  onClick={() => deletePath.mutate({ id: p.id })}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!paths?.length && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma trilha criada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
