import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Camera,
  Save,
  CheckCircle,
  AlertTriangle,
  FileText,
  Car,
  Trash2,
  Plus,
  ArrowLeft,
  Calculator,
  Image,
} from "lucide-react";

const PHOTO_CATEGORIES = [
  { key: "frontal", label: "Frontal", icon: "🚗" },
  { key: "traseira", label: "Traseira", icon: "🚗" },
  { key: "lateral_esquerda", label: "Lateral Esquerda", icon: "📷" },
  { key: "lateral_direita", label: "Lateral Direita", icon: "📷" },
  { key: "painel", label: "Painel/KM", icon: "📊" },
  { key: "motor", label: "Motor", icon: "⚙️" },
  { key: "portamalas", label: "Porta-malas", icon: "📦" },
  { key: "interior", label: "Interior", icon: "🪑" },
  { key: "pneu_dianteiro_esq", label: "Pneu Dianteiro Esq.", icon: "🛞" },
  { key: "pneu_dianteiro_dir", label: "Pneu Dianteiro Dir.", icon: "🛞" },
  { key: "pneu_traseiro_esq", label: "Pneu Traseiro Esq.", icon: "🛞" },
  { key: "pneu_traseiro_dir", label: "Pneu Traseiro Dir.", icon: "🛞" },
  { key: "documentos", label: "Documentos", icon: "📄" },
  { key: "chassi", label: "Chassi", icon: "🔢" },
  { key: "motor_number", label: "Nº Motor", icon: "🔢" },
  { key: "danos", label: "Danos/Avariados", icon: "⚠️" },
  { key: "outros", label: "Outros", icon: "📸" },
] as const;

const CONDITIONS = [
  { value: "otimo", label: "Ótimo", color: "text-green-600" },
  { value: "bom", label: "Bom", color: "text-blue-600" },
  { value: "regular", label: "Regular", color: "text-yellow-600" },
  { value: "ruim", label: "Ruim", color: "text-red-600" },
  { value: "nao_verificado", label: "Não verificado", color: "text-gray-400" },
] as const;

type TabType = "dados" | "fotos" | "avaliacao" | "relatorio";

export default function PurchaseInspectionPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const [tab, setTab] = useState<TabType>("dados");
  const [isNew, setIsNew] = useState(!params.id);

  // Form data
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerContact: "",
    vehiclePlate: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleKm: "",
    vehicleFuel: "",
    vehicleColor: "",
    engineCondition: "nao_verificado" as any,
    transmissionCondition: "nao_verificado" as any,
    bodyworkCondition: "nao_verificado" as any,
    interiorCondition: "nao_verificado" as any,
    tiresCondition: "nao_verificado" as any,
    suspensionCondition: "nao_verificado" as any,
    electricCondition: "nao_verificado" as any,
    generalNotes: "",
    fipeCode: "",
    fipePrice: "",
  });

  const [photos, setPhotos] = useState<Array<{ id: number; photoCategory: string; fileUrl: string; notes: string; filename: string }>>([]);
  const [priceCalc, setPriceCalc] = useState<{
    baseValue: number;
    deductions: number;
    finalPrice: number;
    breakdown: string[];
  } | null>(null);

  // Queries
  const inspectionsQuery = trpc.purchaseInspection.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const inspectionQuery = trpc.purchaseInspection.getById.useQuery(
    { inspectionId: Number(params.id) },
    { enabled: !!params.id, refetchOnWindowFocus: false }
  );

  const fipeBrandsQuery = trpc.purchaseInspection.fipeBrands.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const fipeModelsQuery = trpc.purchaseInspection.fipeModels.useQuery(
    { brandId: 0 },
    { enabled: false, refetchOnWindowFocus: false }
  );

  const fipeYearsQuery = trpc.purchaseInspection.fipeYears.useQuery(
    { brandId: 0, modelId: 0 },
    { enabled: false, refetchOnWindowFocus: false }
  );

  const priceCalcQuery = trpc.purchaseInspection.calculatePrice.useQuery(
    { inspectionId: Number(params.id) },
    { enabled: !!params.id && tab === "relatorio", refetchOnWindowFocus: false }
  );

  // Mutations
  const createMutation = trpc.purchaseInspection.create.useMutation({
    onSuccess: (data) => {
      toast.success("Vistoria criada!");
      setLocation(`/vistoria/${data.inspectionId}`);
      setIsNew(false);
      inspectionsQuery.refetch();
    },
  });

  const updateMutation = trpc.purchaseInspection.update.useMutation({
    onSuccess: () => toast.success("Vistoria atualizada!"),
  });

  const uploadPhotoMutation = trpc.purchaseInspection.uploadPhoto.useMutation({
    onSuccess: () => {
      toast.success("Foto enviada!");
      inspectionQuery.refetch();
    },
  });

  const deletePhotoMutation = trpc.purchaseInspection.deletePhoto.useMutation({
    onSuccess: () => {
      toast.success("Foto removida!");
      inspectionQuery.refetch();
    },
  });

  const deleteMutation = trpc.purchaseInspection.delete.useMutation({
    onSuccess: () => {
      toast.success("Vistoria removida!");
      setLocation("/vistoria");
      inspectionsQuery.refetch();
    },
  });

  // Load inspection data
  useEffect(() => {
    if (inspectionQuery.data) {
      const d = inspectionQuery.data;
      setFormData({
        ownerName: d.ownerName || "",
        ownerContact: d.ownerContact || "",
        vehiclePlate: d.vehiclePlate || "",
        vehicleBrand: d.vehicleBrand || "",
        vehicleModel: d.vehicleModel || "",
        vehicleYear: d.vehicleYear?.toString() || "",
        vehicleKm: d.vehicleKm?.toString() || "",
        vehicleFuel: d.vehicleFuel || "",
        vehicleColor: d.vehicleColor || "",
        engineCondition: (d.engineCondition as any) || "nao_verificado",
        transmissionCondition: (d.transmissionCondition as any) || "nao_verificado",
        bodyworkCondition: (d.bodyworkCondition as any) || "nao_verificado",
        interiorCondition: (d.interiorCondition as any) || "nao_verificado",
        tiresCondition: (d.tiresCondition as any) || "nao_verificado",
        suspensionCondition: (d.suspensionCondition as any) || "nao_verificado",
        electricCondition: (d.electricCondition as any) || "nao_verificado",
        generalNotes: d.generalNotes || "",
        fipeCode: d.fipeCode || "",
        fipePrice: d.fipePrice ? Number(d.fipePrice).toString() : "",
      });
      if (d.photos) {
        setPhotos(d.photos);
      }
    }
  }, [inspectionQuery.data]);

  useEffect(() => {
    if (priceCalcQuery.data) {
      setPriceCalc(priceCalcQuery.data);
    }
  }, [priceCalcQuery.data]);

  const handleCreate = () => {
    createMutation.mutate({
      ownerName: formData.ownerName,
      ownerContact: formData.ownerContact,
      vehiclePlate: formData.vehiclePlate,
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
      vehicleKm: formData.vehicleKm ? parseInt(formData.vehicleKm) : undefined,
      vehicleFuel: formData.vehicleFuel,
      vehicleColor: formData.vehicleColor,
    });
  };

  const handleSave = () => {
    if (!params.id) return;
    const priceVal = formData.fipePrice ? parseFloat(formData.fipePrice) : undefined;
    updateMutation.mutate({
      inspectionId: Number(params.id),
      ownerName: formData.ownerName,
      ownerContact: formData.ownerContact,
      vehiclePlate: formData.vehiclePlate,
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
      vehicleKm: formData.vehicleKm ? parseInt(formData.vehicleKm) : undefined,
      vehicleFuel: formData.vehicleFuel,
      vehicleColor: formData.vehicleColor,
      engineCondition: formData.engineCondition,
      transmissionCondition: formData.transmissionCondition,
      bodyworkCondition: formData.bodyworkCondition,
      interiorCondition: formData.interiorCondition,
      tiresCondition: formData.tiresCondition,
      suspensionCondition: formData.suspensionCondition,
      electricCondition: formData.electricCondition,
      generalNotes: formData.generalNotes,
      fipePrice: priceVal,
      status: "em_andamento",
    });
  };

  const handleComplete = () => {
    if (!params.id) return;
    const priceVal = formData.fipePrice ? parseFloat(formData.fipePrice) : undefined;
    updateMutation.mutate({
      inspectionId: Number(params.id),
      status: "concluida",
      fipePrice: priceVal,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (!file || !params.id) return;

    const reader = new FileReader();
    reader.onload = () => {
      uploadPhotoMutation.mutate({
        inspectionId: Number(params.id),
        photoCategory: category as any,
        filename: file.name,
        fileUrl: reader.result as string,
        mimeType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (photoId: number) => {
    if (confirm("Remover esta foto?")) {
      deletePhotoMutation.mutate({ photoId });
    }
  };

  const handleDeleteInspection = () => {
    if (!params.id) return;
    if (confirm("Remover esta vistoria? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate({ inspectionId: Number(params.id) });
    }
  };

  const formatBRL = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // If listing inspections
  if (location === "/vistoria") {
    return (
      <DashboardLayout title="Vistoria de Compra">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Vistorias de Compra</h2>
          <button
            onClick={() => setLocation("/vistoria/nova")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Nova Vistoria
          </button>
        </div>

        {inspectionsQuery.isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : inspectionsQuery.data?.length === 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg">Nenhuma vistoria cadastrada</p>
            <p className="text-gray-400 mt-2">Clique em "Nova Vistoria" para começar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {inspectionsQuery.data?.map((insp: any) => {
              const statusColors: Record<string, string> = {
                rascunho: "bg-gray-100 text-gray-700",
                em_andamento: "bg-yellow-100 text-yellow-700",
                concluida: "bg-green-100 text-green-700",
                cancelada: "bg-red-100 text-red-700",
              };
              return (
                <div
                  key={insp.id}
                  onClick={() => setLocation(`/vistoria/${insp.id}`)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {insp.vehicleBrand || "Sem marca"} {insp.vehicleModel || ""}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {insp.ownerName || "Sem proprietário"} | Placa: {insp.vehiclePlate || "---"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {insp.vehicleYear} | {insp.vehicleKm ? `${insp.vehicleKm.toLocaleString("pt-BR")} km` : "--- km"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[insp.status]}`}>
                        {insp.status === "rascunho" ? "Rascunho" : insp.status === "em_andamento" ? "Em andamento" : insp.status === "concluida" ? "Concluída" : "Cancelada"}
                      </span>
                      {insp.purchasePrice && (
                        <p className="text-green-700 font-bold mt-2">{formatBRL(Number(insp.purchasePrice))}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardLayout>
    );
  }

  // If creating new or editing
  const title = isNew ? "Nova Vistoria de Compra" : "Vistoria de Compra";

  return (
    <DashboardLayout title={title}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "dados", label: "Dados do Veículo", icon: Car },
          { key: "fotos", label: "Fotos", icon: Camera },
          { key: "avaliacao", label: "Avaliação", icon: CheckCircle },
          { key: "relatorio", label: "Relatório", icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              tab === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6">
        {!isNew && (
          <>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={18} /> Salvar
            </button>
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <CheckCircle size={18} /> Concluir
            </button>
            <button
              onClick={handleDeleteInspection}
              className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              <Trash2 size={18} /> Excluir
            </button>
          </>
        )}
        <button
          onClick={() => setLocation("/vistoria")}
          className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      {/* Tab: Dados do Veículo */}
      {tab === "dados" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Proprietário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Proprietário</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                <input
                  type="text"
                  value={formData.ownerContact}
                  onChange={(e) => setFormData({ ...formData, ownerContact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Telefone / Email"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                <input
                  type="text"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select
                  value={formData.vehicleBrand}
                  onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione</option>
                  {fipeBrandsQuery.data?.map((b: any) => (
                    <option key={b.code} value={b.name}>{b.name}</option>
                  ))}
                  {!fipeBrandsQuery.data && <option>Carregando marcas...</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Civic EX 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                <input
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label>
                <input
                  type="number"
                  value={formData.vehicleKm}
                  onChange={(e) => setFormData({ ...formData, vehicleKm: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
                <select
                  value={formData.vehicleFuel}
                  onChange={(e) => setFormData({ ...formData, vehicleFuel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="Flex">Flex</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Etanol">Etanol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="GNV">GNV</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="text"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Prata"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor FIPE (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fipePrice}
                  onChange={(e) => setFormData({ ...formData, fipePrice: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="85000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código FIPE</label>
                <input
                  type="text"
                  value={formData.fipeCode}
                  onChange={(e) => setFormData({ ...formData, fipeCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="004278-1"
                />
              </div>
            </div>
          </div>

          {!isNew && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg"
              >
                <Save size={20} /> Salvar Dados
              </button>
            </div>
          )}

          {isNew && (
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg"
              >
                <Plus size={20} /> Criar Vistoria
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Fotos */}
      {tab === "fotos" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fotos do Veículo</h3>
            <p className="text-gray-500 text-sm mb-4">Tire fotos de cada ângulo e parte do veículo para o relatório completo.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PHOTO_CATEGORIES.map((cat) => {
                const categoryPhotos = photos.filter((p) => p.photoCategory === cat.key);
                return (
                  <div key={cat.key} className="border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      {cat.icon} {cat.label}
                    </h4>

                    {/* Show existing photos */}
                    <div className="space-y-2 mb-3">
                      {categoryPhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.fileUrl}
                            alt={cat.label}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {photo.notes && (
                            <p className="text-xs text-gray-500 mt-1">{photo.notes}</p>
                          )}
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Upload button */}
                    <label className="flex items-center justify-center gap-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-200 transition">
                      <Camera size={20} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {categoryPhotos.length > 0 ? "Adicionar" : "Tirar foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, cat.key)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400">
            Total: {photos.length} foto(s) registrada(s)
          </div>
        </div>
      )}

      {/* Tab: Avaliação */}
      {tab === "avaliacao" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Avaliação do Veículo</h3>
            <p className="text-gray-500 text-sm mb-6">
              Avalie cada componente do veículo. O valor de compra será calculado automaticamente baseado nas condições.
            </p>

            <div className="space-y-4">
              {[
                { key: "engineCondition", label: "Motor", description: "Estado do motor, ruídos, fumaça" },
                { key: "transmissionCondition", label: "Câmbio / Transmissão", description: "Troca de marchas, embreagem" },
                { key: "bodyworkCondition", label: "Lataria / Carroceria", description: "Amassados, riscos, pintura" },
                { key: "interiorCondition", label: "Interior", description: "Bancos, painel, ar condicionado" },
                { key: "tiresCondition", label: "Pneus", description: "Desgaste, alinhamento" },
                { key: "suspensionCondition", label: "Suspensão", description: "Amortecedores, molas, batentes" },
                { key: "electricCondition", label: "Sistema Elétrico", description: "Luzes, alternador, bateria" },
              ].map((item) => (
                <div key={item.key} className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-gray-800">{item.label}</span>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond.value}
                        onClick={() => setFormData({ ...formData, [item.key]: cond.value })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          formData[item.key as keyof typeof formData] === cond.value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Observações Gerais</h3>
            <textarea
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observações adicionais sobre o veículo..."
            />
          </div>

          {!isNew && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg"
              >
                <Save size={20} /> Salvar Avaliação
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Relatório */}
      {tab === "relatorio" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              <Calculator className="inline mr-2" size={20} />
              Relatório de Compra
            </h3>

            {/* Vehicle info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Veículo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Marca:</span> <strong>{formData.vehicleBrand || "---"}</strong></div>
                <div><span className="text-gray-500">Modelo:</span> <strong>{formData.vehicleModel || "---"}</strong></div>
                <div><span className="text-gray-500">Ano:</span> <strong>{formData.vehicleYear || "---"}</strong></div>
                <div><span className="text-gray-500">Placa:</span> <strong>{formData.vehiclePlate || "---"}</strong></div>
                <div><span className="text-gray-500">KM:</span> <strong>{formData.vehicleKm || "---"}</strong></div>
                <div><span className="text-gray-500">Cor:</span> <strong>{formData.vehicleColor || "---"}</strong></div>
                <div><span className="text-gray-500">Combustível:</span> <strong>{formData.vehicleFuel || "---"}</strong></div>
                <div><span className="text-gray-500">Proprietário:</span> <strong>{formData.ownerName || "---"}</strong></div>
              </div>
            </div>

            {/* FIPE Price */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Valor FIPE</h4>
              <p className="text-3xl font-bold text-blue-600">
                {formData.fipePrice ? formatBRL(parseFloat(formData.fipePrice)) : "Não informado"}
              </p>
              {formData.fipeCode && <p className="text-sm text-gray-500">Código: {formData.fipeCode}</p>}
            </div>

            {/* Price calculation */}
            {priceCalc && priceCalc.baseValue > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Descontos por Condição</h4>
                <div className="space-y-2">
                  {priceCalc.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-600">Valor FIPE:</span>
                      <span className="ml-2 font-medium">{formatBRL(priceCalc.baseValue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Total de descontos:</span>
                    <span className="text-red-600 font-medium">- {formatBRL(priceCalc.deductions)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xl font-bold text-green-700">Valor de Compra:</span>
                    <span className="text-3xl font-bold text-green-700">{formatBRL(priceCalc.finalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4">
                <AlertTriangle className="inline text-yellow-600 mr-2" size={20} />
                <span className="text-yellow-700">Informe o valor FIPE na aba "Dados do Veículo" para calcular o valor de compra.</span>
              </div>
            )}

            {/* Condition summary */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Resumo da Avaliação</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: "engineCondition", label: "Motor" },
                  { key: "transmissionCondition", label: "Câmbio" },
                  { key: "bodyworkCondition", label: "Lataria" },
                  { key: "interiorCondition", label: "Interior" },
                  { key: "tiresCondition", label: "Pneus" },
                  { key: "suspensionCondition", label: "Suspensão" },
                  { key: "electricCondition", label: "Elétrica" },
                ].map((item) => {
                  const condition = formData[item.key as keyof typeof formData];
                  const condInfo = CONDITIONS.find((c) => c.value === condition);
                  return (
                    <div key={item.key} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-600 text-sm">{item.label}</span>
                      <span className={`font-medium text-sm ${condInfo?.color || "text-gray-400"}`}>
                        {condInfo?.label || "Não avaliado"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photos summary */}
            {photos.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  <Image className="inline mr-2" size={18} />
                  Fotos ({photos.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.fileUrl}
                      alt={photo.photoCategory}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {formData.generalNotes && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Observações</h4>
                <p className="text-gray-600 text-sm">{formData.generalNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
