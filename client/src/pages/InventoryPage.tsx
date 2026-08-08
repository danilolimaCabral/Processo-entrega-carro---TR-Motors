import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Car, Package, Plus, Edit, Trash2, Eye, RotateCcw,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Image, List,
} from "lucide-react";

type Tab = "lista" | "adicionar";
type ViewMode = "grid" | "list";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("lista");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Form state
  const [form, setForm] = useState({
    brand: "", model: "", year: "", mileage: "", price: "",
    costPrice: "", color: "", fuelType: "flex", transmission: "manual",
    plate: "", chassi: "", condition: "used", source: "purchase",
    notes: "", inspectionId: "",
  });

  const { data: inventoryData, isLoading, refetch } = trpc.inventory.list.useQuery(
    { search: search || undefined },
    { refetchInterval: 10000 }
  );

  const { data: statsData } = trpc.inventory.stats.useQuery();

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      toast.success("Veículo adicionado ao estoque!");
      setDialogOpen(false);
      refetch();
      setForm({
        brand: "", model: "", year: "", mileage: "", price: "",
        costPrice: "", color: "", fuelType: "flex", transmission: "manual",
        plate: "", chassi: "", condition: "used", source: "purchase",
        notes: "", inspectionId: "",
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.inventory.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      toast.success("Veículo removido do estoque!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncMutation = trpc.inventory.syncRevendaMais.useMutation({
    onSuccess: (res) => {
      toast.success(res.message || "Sincronização concluída!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const inventory = (inventoryData || []).map((item: any) => item.inventory || item);
  const stats = statsData || { total: 0, available: 0, reserved: 0, sold: 0 };

  const handleSubmit = () => {
    if (!form.brand || !form.model || !form.price) {
      toast.error("Preencha marca, modelo e preço");
      return;
    }
    createMutation.mutate({
      brand: form.brand,
      model: form.model,
      year: form.year ? parseInt(form.year) : undefined,
      mileage: form.mileage ? parseInt(form.mileage) : undefined,
      price: parseFloat(form.price),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
      color: form.color || undefined,
      fuelType: form.fuelType,
      transmission: form.transmission,
      plate: form.plate || undefined,
      chassi: form.chassi || undefined,
      condition: form.condition,
      source: form.source,
      notes: form.notes || undefined,
      inspectionId: form.inspectionId ? parseInt(form.inspectionId) : undefined,
    });
  };

  const statusColors: Record<string, string> = {
    disponivel: "bg-green-100 text-green-800",
    reservado: "bg-yellow-100 text-yellow-800",
    vendido: "bg-blue-100 text-blue-800",
    em_preparacao: "bg-orange-100 text-orange-800",
    transferido: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    disponivel: "Disponível",
    reservado: "Reservado",
    vendido: "Vendido",
    em_preparacao: "Em Preparação",
    transferido: "Transferido",
  };

  const getFirstImage = (v: any): string => {
    if (v.images) {
      try {
        const imgs = JSON.parse(v.images);
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
      } catch {}
    }
    if (v.imagesLarge) {
      try {
        const imgs = JSON.parse(v.imagesLarge);
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
      } catch {}
    }
    return "";
  };

  const getImageCount = (v: any): number => {
    if (v.images) {
      try {
        const imgs = JSON.parse(v.images);
        if (Array.isArray(imgs)) return imgs.length;
      } catch {}
    }
    return 0;
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (!price) return "R$ 0,00";
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
  };

  const formatName = (brand: string, model: string): string => {
    if (!model) return brand || "-";
    const b = (brand || "").trim().toUpperCase();
    const m = model.trim();
    // Remove brand prefix from model if present
    if (b && m.toUpperCase().startsWith(b.split(" ")[0])) {
      return `${b} ${m}`;
    }
    return `${b} ${m}`;
  };

  const formatFuel = (fuel: string) => {
    if (!fuel) return "-";
    const f = fuel.toLowerCase();
    if (f.includes("flex")) return "Flex";
    if (f.includes("gasol")) return "Gasolina";
    if (f.includes("diesel")) return "Diesel";
    if (f.includes("eléctric") || f.includes("electric")) return "Elétrico";
    if (f.includes("híbrid") || f.includes("hybrid")) return "Híbrido";
    return fuel;
  };

  return (
    <DashboardLayout title="Estoque de Veículos">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Car className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                <p className="text-xs text-gray-500">Disponível</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
                <p className="text-xs text-gray-500">Reservado</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
                <p className="text-xs text-gray-500">Vendido</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "lista" ? "default" : "outline"}
              onClick={() => setActiveTab("lista")}
              className="bg-red-600 hover:bg-red-700"
            >
              <Package className="h-4 w-4 mr-2" /> Lista
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Veículo ao Estoque</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Marca *</Label>
                    <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" />
                  </div>
                  <div className="space-y-1">
                    <Label>Modelo *</Label>
                    <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Civic" />
                  </div>
                  <div className="space-y-1">
                    <Label>Ano</Label>
                    <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
                  </div>
                  <div className="space-y-1">
                    <Label>Quilometragem</Label>
                    <Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="15000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Preço Venda (R$) *</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="145000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Custo (R$)</Label>
                    <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="120000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Cor</Label>
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Branco" />
                  </div>
                  <div className="space-y-1">
                    <Label>Placa</Label>
                    <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-1">
                    <Label>Combustível</Label>
                    <Select value={form.fuelType} onValueChange={(v) => setForm({ ...form, fuelType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Câmbio</Label>
                    <Select value={form.transmission} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Condição</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="used">Usado</SelectItem>
                        <SelectItem value="seminovo">Seminovo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Origem</Label>
                    <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Compra (Vistoria)</SelectItem>
                        <SelectItem value="trade">Troca</SelectItem>
                        <SelectItem value="consignment">Consignação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Chassi</Label>
                    <Input value={form.chassi} onChange={(e) => setForm({ ...form, chassi: e.target.value })} placeholder="9BWZZZ377VT004251" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Observações</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes adicionais..." />
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Salvando..." : "Adicionar ao Estoque"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Sincronizando..." : "Sincronizar Revenda Mais"}
            </Button>
            <Input
              placeholder="Buscar veículo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* View Toggle - Grid / List */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-3"
          >
            <Image className="h-4 w-4 mr-1" /> Fotos
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-1" /> Lista
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-gray-500">Carregando estoque...</CardContent></Card>
        ) : inventory.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum veículo no estoque</p>
            <p className="text-sm mt-1">Clique em "Sincronizar Revenda Mais" para importar</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {/* Photo Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {inventory.map((v: any) => (
                  <Card key={v.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="relative">
                      {getFirstImage(v) ? (
                        <img
                          src={getFirstImage(v)}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-40 object-cover"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                          <Car className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 ${statusColors[v.status] || "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[v.status] || v.status}
                      </Badge>
                      {getImageCount(v) > 1 && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          {getImageCount(v)} fotos
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm truncate">{formatName(v.brand, v.modelDetail || v.model)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {v.fabricYear && v.year ? `${v.fabricYear}/${v.year}` : v.year || ""}
                        {v.km ? ` • ${v.km.toLocaleString()} km` : ""}
                        {v.color ? ` • ${v.color}` : ""}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-base font-bold text-green-700">{formatPrice(v.salePrice)}</p>
                        <div className="flex gap-1">
                          {v.status === "disponivel" && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "reservado" })}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {v.status === "reservado" && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "disponivel" })}>
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate({ id: v.id })}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Desktop Table (List View) */}
            <div className="hidden lg:block overflow-x-auto">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-3 text-left font-medium">Veículo</th>
                        <th className="p-3 text-left font-medium">Ano</th>
                        <th className="p-3 text-left font-medium">KM</th>
                        <th className="p-3 text-left font-medium">Cor</th>
                        <th className="p-3 text-left font-medium">Combustível</th>
                        <th className="p-3 text-left font-medium">Câmbio</th>
                        <th className="p-3 text-right font-medium">Preço</th>
                        <th className="p-3 text-center font-medium">Status</th>
                        <th className="p-3 text-center font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((v: any) => (
                        <tr key={v.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">
                            {formatName(v.brand, v.modelDetail || v.model)}
                            {v.plate && <span className="text-gray-400 text-xs ml-1">({v.plate})</span>}
                          </td>
                          <td className="p-3">{v.fabricYear ? `${v.fabricYear}/${v.year}` : v.year || "-"}</td>
                          <td className="p-3">{v.km ? `${v.km.toLocaleString()} km` : "-"}</td>
                          <td className="p-3">{v.color || "-"}</td>
                          <td className="p-3">{formatFuel(v.fuel)}</td>
                          <td className="p-3">{v.transmission === "manual" ? "Manual" : v.transmission === "automatic" ? "Auto" : "CVT"}</td>
                          <td className="p-3 text-right font-medium text-green-700">{formatPrice(v.salePrice)}</td>
                          <td className="p-3 text-center">
                            <Badge className={statusColors[v.status] || "bg-gray-100 text-gray-800"}>
                              {statusLabels[v.status] || v.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {v.status === "available" && (
                                <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "reserved" })}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {v.status === "reserved" && (
                                <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "available" })}>
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: v.id })}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {inventory.map((v: any) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{formatName(v.brand, v.modelDetail || v.model)}</p>
                        <p className="text-sm text-gray-500">
                          {v.fabricYear && v.year ? `${v.fabricYear}/${v.year} • ` : ""}
                          {v.km ? `${v.km.toLocaleString()} km` : ""}
                          {v.color ? ` • ${v.color}` : ""}
                          {v.fuel ? ` • ${formatFuel(v.fuel)}` : ""}
                        </p>
                        <p className="text-lg font-bold text-green-700 mt-1">{formatPrice(v.salePrice)}</p>
                      </div>
                      <Badge className={statusColors[v.status] || "bg-gray-100 text-gray-800"}>
                        {statusLabels[v.status] || v.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {v.status === "available" && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "reserved" })}>
                          <Eye className="h-4 w-4 mr-1" /> Reservar
                        </Button>
                      )}
                      {v.status === "reserved" && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: v.id, status: "available" })}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Liberar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => deleteMutation.mutate({ id: v.id })}>
                        <Trash2 className="h-4 w-4 mr-1 text-red-500" /> Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
